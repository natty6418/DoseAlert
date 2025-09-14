from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction
from django.db.models import Count, Q, Avg
from datetime import timedelta, date
from collections import defaultdict

from .models import AdherenceRecord, AdherenceStreak
from .serializers import (
    AdherenceRecordSerializer, 
    AdherenceResponseSerializer, 
    AdherenceStreakSerializer,
    AdherenceSummarySerializer
)
from reminders.models import Reminder

class AdherenceRecordViewSet(viewsets.ModelViewSet):
    serializer_class = AdherenceRecordSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return AdherenceRecord.objects.filter(user=self.request.user).select_related('medication', 'reminder')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get adherence records pending user response"""
        pending_records = AdherenceRecord.objects.filter(
            user=request.user,
            status='pending'
        )
        serializer = self.get_serializer(pending_records, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get adherence records that are overdue for response"""
        overdue_records = AdherenceRecord.objects.filter(
            user=request.user,
            status='pending',
            scheduled_time__lt=timezone.now() - timedelta(hours=1)
        )
        serializer = self.get_serializer(overdue_records, many=True)
        return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def record_adherence(request):
    """
    Record user's adherence response for a medication reminder
    """
    serializer = AdherenceResponseSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    reminder_id = serializer.validated_data['reminder_id']
    adherence_status = serializer.validated_data['status']
    actual_time = serializer.validated_data.get('actual_time')
    notes = serializer.validated_data.get('notes', '')
    
    try:
        with transaction.atomic():
            # Get the reminder
            reminder = Reminder.objects.select_related('schedule__medication').get(
                id=reminder_id,
                schedule__user=request.user
            )
            
            # Get or create adherence record
            adherence, created = AdherenceRecord.objects.get_or_create(
                user=request.user,
                reminder=reminder,
                defaults={
                    'medication': reminder.schedule.medication,
                    'scheduled_time': reminder.scheduled_at,
                    'status': 'pending'
                }
            )
            
            # Update adherence record
            adherence.status = adherence_status
            adherence.response_time = timezone.now()
            adherence.notes = notes
            
            if adherence_status == 'taken':
                adherence.actual_time = actual_time or timezone.now()
            
            adherence.save()
            
            # Update or create adherence streak
            streak, created = AdherenceStreak.objects.get_or_create(
                user=request.user,
                medication=reminder.schedule.medication
            )
            streak.update_streak(adherence_status)
            
            # # Update reminder status
            # if adherence_status == 'taken':
            #     reminder.status = 'sent'
            # else:
            #     reminder.status = 'failed'
            #
            # reminder.save()
            #
            return Response({
                'message': 'Adherence recorded successfully',
                'adherence_record': AdherenceRecordSerializer(adherence).data,
                'streak': AdherenceStreakSerializer(streak).data
            }, status=status.HTTP_200_OK)
            
    except Reminder.DoesNotExist:
        return Response({
            'error': 'Reminder not found or does not belong to user'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def adherence_summary(request):
    """
    Get comprehensive adherence summary for the user
    """
    user = request.user
    
    # Get all adherence streaks for user
    streaks = AdherenceStreak.objects.filter(user=user)
    
    # Calculate overall adherence
    total_taken = sum(streak.total_taken for streak in streaks)
    total_scheduled = sum(streak.total_scheduled for streak in streaks)
    overall_adherence = (total_taken / total_scheduled * 100) if total_scheduled > 0 else 0
    
    # Get pending and overdue responses
    pending_count = AdherenceRecord.objects.filter(
        user=user,
        status='pending'
    ).count()
    
    overdue_count = AdherenceRecord.objects.filter(
        user=user,
        status='pending',
        scheduled_time__lt=timezone.now() - timedelta(hours=1)
    ).count()
    
    # Get recent adherence records (last 7 days)
    recent_records = AdherenceRecord.objects.filter(
        user=user,
        scheduled_time__gte=timezone.now() - timedelta(days=7)
    )[:20]
    
    summary_data = {
        'total_medications': streaks.count(),
        'pending_responses': pending_count,
        'overdue_responses': overdue_count,
        'overall_adherence_percentage': round(overall_adherence, 2),
        'recent_records': recent_records,
        'streaks': streaks
    }
    
    serializer = AdherenceSummarySerializer(summary_data)
    return Response(serializer.data)

class AdherenceStreakViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AdherenceStreakSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return AdherenceStreak.objects.filter(user=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def adherence_report(request):
    """
    Get comprehensive adherence report with detailed analytics
    """
    user = request.user
    
    # Get date range from query parameters (default last 30 days)
    days_back = request.GET.get('days', 30)
    try:
        days_back = int(days_back)
        if days_back <= 0:
            days_back = 30
    except (ValueError, TypeError):
        days_back = 30
    
    start_date = timezone.now() - timedelta(days=days_back)
    end_date = timezone.now()
    
    # Get adherence records within date range
    records = AdherenceRecord.objects.filter(
        user=user,
        scheduled_time__gte=start_date,
        scheduled_time__lte=end_date
    ).select_related('medication', 'reminder')
    
    # Overall statistics
    total_records = records.count()
    taken_count = records.filter(status='taken').count()
    missed_count = records.filter(status='missed').count()
    skipped_count = records.filter(status='skipped').count()
    pending_count = records.filter(status='pending').count()
    
    # Calculate adherence rate (excluding pending)
    completed_records = total_records - pending_count
    adherence_rate = (taken_count / completed_records * 100) if completed_records > 0 else 0
    
    # Daily adherence data for charts
    daily_data = defaultdict(lambda: {'taken': 0, 'missed': 0, 'skipped': 0, 'pending': 0})
    
    for record in records:
        day_key = record.scheduled_time.date().isoformat()
        daily_data[day_key][record.status] += 1
    
    # Convert to list sorted by date
    daily_adherence = []
    current_date = start_date.date()
    while current_date <= end_date.date():
        day_key = current_date.isoformat()
        day_data = daily_data[day_key]
        daily_total = sum(day_data.values())
        day_adherence_rate = (day_data['taken'] / daily_total * 100) if daily_total > 0 else 0
        
        daily_adherence.append({
            'date': day_key,
            'taken': day_data['taken'],
            'missed': day_data['missed'],
            'skipped': day_data['skipped'],
            'pending': day_data['pending'],
            'total': daily_total,
            'adherence_rate': round(day_adherence_rate, 2)
        })
        current_date += timedelta(days=1)
    
    # Medication-specific adherence
    medication_adherence = []
    medications = records.values('medication__id', 'medication__name').distinct()
    
    for med in medications:
        med_records = records.filter(medication__id=med['medication__id'])
        med_total = med_records.count()
        med_taken = med_records.filter(status='taken').count()
        med_missed = med_records.filter(status='missed').count()
        med_skipped = med_records.filter(status='skipped').count()
        med_pending = med_records.filter(status='pending').count()
        
        med_completed = med_total - med_pending
        med_adherence_rate = (med_taken / med_completed * 100) if med_completed > 0 else 0
        
        # Get current streak for this medication
        try:
            streak = AdherenceStreak.objects.get(user=user, medication__id=med['medication__id'])
            current_taken_streak = streak.current_taken_streak
            current_missed_streak = streak.current_missed_streak
            longest_taken_streak = streak.longest_taken_streak
            longest_missed_streak = streak.longest_missed_streak
        except AdherenceStreak.DoesNotExist:
            current_taken_streak = 0
            current_missed_streak = 0
            longest_taken_streak = 0
            longest_missed_streak = 0
        
        medication_adherence.append({
            'medication_id': med['medication__id'],
            'medication_name': med['medication__name'],
            'total_doses': med_total,
            'taken': med_taken,
            'missed': med_missed,
            'skipped': med_skipped,
            'pending': med_pending,
            'adherence_rate': round(med_adherence_rate, 2),
            'current_taken_streak': current_taken_streak,
            'current_missed_streak': current_missed_streak,
            'longest_taken_streak': longest_taken_streak,
            'longest_missed_streak': longest_missed_streak
        })
    
    # Time of day analysis
    time_adherence = defaultdict(lambda: {'taken': 0, 'missed': 0, 'total': 0})
    
    for record in records.exclude(status='pending'):
        hour = record.scheduled_time.hour
        time_adherence[hour]['total'] += 1
        if record.status == 'taken':
            time_adherence[hour]['taken'] += 1
        else:
            time_adherence[hour]['missed'] += 1
    
    time_of_day_data = []
    for hour in range(24):
        data = time_adherence[hour]
        rate = (data['taken'] / data['total'] * 100) if data['total'] > 0 else 0
        time_of_day_data.append({
            'hour': hour,
            'taken': data['taken'],
            'missed': data['missed'],
            'total': data['total'],
            'adherence_rate': round(rate, 2)
        })
    
    # Recent missed doses (last 7 days for immediate attention)
    recent_missed = records.filter(
        status__in=['missed', 'skipped'],
        scheduled_time__gte=timezone.now() - timedelta(days=7)
    ).order_by('-scheduled_time')[:10]
    
    # Pending responses that need attention
    pending_responses = records.filter(
        status='pending',
        scheduled_time__lt=timezone.now()
    ).order_by('scheduled_time')[:10]
    
    # Overdue responses (more than 2 hours late)
    overdue_responses = records.filter(
        status='pending',
        scheduled_time__lt=timezone.now() - timedelta(hours=2)
    ).count()
    
    # Weekly trend (last 4 weeks)
    weekly_data = []
    for week in range(4):
        week_start = timezone.now() - timedelta(weeks=week+1)
        week_end = timezone.now() - timedelta(weeks=week)
        
        week_records = records.filter(
            scheduled_time__gte=week_start,
            scheduled_time__lt=week_end
        )
        
        week_total = week_records.count()
        week_taken = week_records.filter(status='taken').count()
        week_rate = (week_taken / week_total * 100) if week_total > 0 else 0
        
        weekly_data.append({
            'week_number': week + 1,
            'week_start': week_start.date().isoformat(),
            'week_end': week_end.date().isoformat(),
            'total_doses': week_total,
            'taken': week_taken,
            'adherence_rate': round(week_rate, 2)
        })
    
    # Compile comprehensive report
    report_data = {
        'report_period': {
            'start_date': start_date.date().isoformat(),
            'end_date': end_date.date().isoformat(),
            'days_covered': days_back
        },
        'overall_statistics': {
            'total_scheduled_doses': total_records,
            'doses_taken': taken_count,
            'doses_missed': missed_count,
            'doses_skipped': skipped_count,
            'pending_responses': pending_count,
            'overdue_responses': overdue_responses,
            'overall_adherence_rate': round(adherence_rate, 2),
            'completion_rate': round((completed_records / total_records * 100) if total_records > 0 else 0, 2)
        },
        'daily_adherence': daily_adherence,
        'medication_breakdown': medication_adherence,
        'time_of_day_analysis': time_of_day_data,
        'weekly_trends': weekly_data,
        'recent_missed_doses': AdherenceRecordSerializer(recent_missed, many=True).data,
        'pending_responses': AdherenceRecordSerializer(pending_responses, many=True).data,
        'insights': {
            'best_adherence_medication': max(medication_adherence, key=lambda x: x['adherence_rate'])['medication_name'] if medication_adherence else None,
            'worst_adherence_medication': min(medication_adherence, key=lambda x: x['adherence_rate'])['medication_name'] if medication_adherence else None,
            'best_time_of_day': max(time_of_day_data, key=lambda x: x['adherence_rate'])['hour'] if any(t['total'] > 0 for t in time_of_day_data) else None,
            'improvement_trend': 'improving' if len(weekly_data) >= 2 and weekly_data[0]['adherence_rate'] > weekly_data[1]['adherence_rate'] else 'declining' if len(weekly_data) >= 2 else 'stable'
        }
    }
    
    return Response(report_data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_adherence_records(request):
    """
    Synchronize a batch of adherence records from a client.
    
    For each adherence record object:
    - If 'is_deleted' is True and ID exists, deletes the adherence record
    - If ID is provided and 'is_deleted' is False/missing, updates the adherence record
    - If ID is null/missing and 'is_deleted' is False/missing, creates a new adherence record
    """
    data = request.data
    if not isinstance(data, list):
        return Response({"error": "Request body must be a list of adherence record objects."}, status=status.HTTP_400_BAD_REQUEST)

    results = []
    
    try:
        with transaction.atomic():
            for item_data in data:
                adherence_id = item_data.get('id')
                is_deleted = item_data.get('is_deleted', False)
                
                if is_deleted and adherence_id:
                    # DELETE logic
                    try:
                        adherence = AdherenceRecord.objects.get(id=adherence_id, user=request.user)
                        adherence.delete()
                        results.append({'status': 'deleted', 'id': adherence_id})
                    except AdherenceRecord.DoesNotExist:
                        results.append({'status': 'error', 'id': adherence_id, 'errors': 'Adherence record not found for deletion.'})
                elif is_deleted and not adherence_id:
                    # Can't delete without an ID
                    results.append({'status': 'error', 'id': None, 'errors': 'Cannot delete adherence record without ID.'})
                elif adherence_id and not is_deleted:
                    # UPDATE logic
                    try:
                        adherence = AdherenceRecord.objects.get(id=adherence_id, user=request.user)
                        # Remove sync-specific fields that shouldn't be saved to the model
                        clean_data = {k: v for k, v in item_data.items() if k not in ['user', 'is_deleted']}
                        serializer = AdherenceRecordSerializer(instance=adherence, data=clean_data, partial=True)
                        if serializer.is_valid():
                            serializer.save()
                            results.append({'status': 'updated', 'id': adherence.id})
                        else:
                            results.append({'status': 'error', 'id': adherence_id, 'errors': serializer.errors})
                    except AdherenceRecord.DoesNotExist:
                        results.append({'status': 'error', 'id': adherence_id, 'errors': 'Adherence record not found.'})
                elif not adherence_id and not is_deleted:
                    # CREATE logic
                    clean_data = {k: v for k, v in item_data.items() if k not in ['id', 'user', 'is_deleted']}
                    serializer = AdherenceRecordSerializer(data=clean_data)
                    if serializer.is_valid():
                        new_adherence = serializer.save(user=request.user)
                        results.append({'status': 'created', 'id': new_adherence.id})
                    else:
                        results.append({'status': 'error', 'id': None, 'errors': serializer.errors})
            
            has_errors = any(r['status'] == 'error' for r in results)
            if has_errors:
                raise Exception("Errors occurred during sync, rolling back all changes.")

    except Exception as e:
        return Response({
            'error': str(e),
            'details': [r for r in results if r['status'] == 'error']
        }, status=status.HTTP_400_BAD_REQUEST)

    return Response(results, status=status.HTTP_200_OK)