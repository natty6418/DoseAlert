from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import AdherenceRecord, AdherenceStreak
from reminders.models import Reminder

@shared_task
def auto_mark_missed_medications():
    """
    Automatically mark medications as missed if no response after 1 hour from scheduled time
    """
    cutoff_time = timezone.now() - timedelta(hours=1)
    
    # Find reminders that should have been taken but no adherence response
    overdue_reminders = Reminder.objects.filter(
        scheduled_at__lt=cutoff_time,
        status='pending'
    ).select_related('schedule__medication', 'schedule__user')
    
    processed_count = 0
    
    for reminder in overdue_reminders:
        try:
            # Check if adherence record already exists
            adherence_record, created = AdherenceRecord.objects.get_or_create(
                user=reminder.schedule.user,
                reminder=reminder,
                defaults={
                    'medication': reminder.schedule.medication,
                    'scheduled_time': reminder.scheduled_at,
                    'status': 'missed',
                    'response_time': timezone.now(),
                    'notes': 'Automatically marked as missed - no response within 1 hour'
                }
            )
            
            # If record already exists but is still pending, mark as missed
            if not created and adherence_record.status == 'pending':
                adherence_record.status = 'missed'
                adherence_record.response_time = timezone.now()
                adherence_record.notes = 'Automatically marked as missed - no response within 1 hour'
                adherence_record.save()
            
            # Update adherence streak
            streak, created = AdherenceStreak.objects.get_or_create(
                user=reminder.schedule.user,
                medication=reminder.schedule.medication
            )
            streak.update_streak('missed')
            
            # Update reminder status
            reminder.status = 'failed'
            reminder.save()
            
            processed_count += 1
            
        except Exception as e:
            # Log the error but continue processing other reminders
            print(f"Error processing reminder {reminder.id}: {str(e)}")
            continue
    
    return f"Processed {processed_count} overdue reminders"

@shared_task
def generate_adherence_insights():
    """
    Generate adherence insights and patterns for analytics
    """
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    insights = []
    
    for user in User.objects.filter(is_active=True):
        streaks = AdherenceStreak.objects.filter(user=user)
        
        if streaks.exists():
            total_taken = sum(streak.total_taken for streak in streaks)
            total_scheduled = sum(streak.total_scheduled for streak in streaks)
            adherence_rate = (total_taken / total_scheduled * 100) if total_scheduled > 0 else 0
            
            # Count medications with poor adherence (< 80%)
            poor_adherence_meds = streaks.filter(
                current_streak__lt=3,
                total_taken__lt=0.8 * timezone.now().date().day  # Rough estimate
            ).count()
            
            insights.append({
                'user_id': user.id,
                'adherence_rate': round(adherence_rate, 2),
                'total_medications': streaks.count(),
                'poor_adherence_count': poor_adherence_meds,
                'longest_streak': max([streak.longest_streak for streak in streaks], default=0)
            })
    
    return f"Generated insights for {len(insights)} users"
