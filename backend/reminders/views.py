from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from .models import Reminder
from .serializers import ReminderSerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_reminders(request):
    """
    Synchronize a batch of reminders from a client.
    
    For each reminder object:
    - If 'is_deleted' is True and ID exists, deletes the reminder
    - If ID is provided and 'is_deleted' is False/missing, updates the reminder
    - If ID is null/missing and 'is_deleted' is False/missing, creates a new reminder
    """
    data = request.data
    if not isinstance(data, list):
        return Response({"error": "Request body must be a list of reminder objects."}, status=status.HTTP_400_BAD_REQUEST)

    results = []
    
    try:
        with transaction.atomic():
            for item_data in data:
                reminder_id = item_data.get('id')
                is_deleted = item_data.get('is_deleted', False)
                
                if is_deleted and reminder_id:
                    # DELETE logic
                    try:
                        reminder = Reminder.objects.get(id=reminder_id, schedule__user=request.user)
                        reminder.delete()
                        results.append({'status': 'deleted', 'id': reminder_id})
                    except Reminder.DoesNotExist:
                        results.append({'status': 'error', 'id': reminder_id, 'errors': 'Reminder not found for deletion.'})
                elif is_deleted and not reminder_id:
                    # Can't delete without an ID
                    results.append({'status': 'error', 'id': None, 'errors': 'Cannot delete reminder without ID.'})
                elif reminder_id and not is_deleted:
                    # UPDATE logic
                    try:
                        reminder = Reminder.objects.get(id=reminder_id, schedule__user=request.user)
                        # Remove sync-specific fields that shouldn't be saved to the model
                        clean_data = {k: v for k, v in item_data.items() if k not in ['user', 'is_deleted']}
                        serializer = ReminderSerializer(instance=reminder, data=clean_data, partial=True)
                        if serializer.is_valid():
                            serializer.save()
                            results.append({'status': 'updated', 'id': reminder.id})
                        else:
                            results.append({'status': 'error', 'id': reminder_id, 'errors': serializer.errors})
                    except Reminder.DoesNotExist:
                        results.append({'status': 'error', 'id': reminder_id, 'errors': 'Reminder not found.'})
                elif not reminder_id and not is_deleted:
                    # CREATE logic
                    clean_data = {k: v for k, v in item_data.items() if k not in ['id', 'user', 'is_deleted']}
                    serializer = ReminderSerializer(data=clean_data)
                    if serializer.is_valid():
                        # Ensure the schedule belongs to the user before creating
                        schedule = serializer.validated_data['schedule']
                        if schedule.user != request.user:
                            results.append({'status': 'error', 'id': None, 'errors': {'schedule': 'Schedule does not belong to user.'}})
                            continue
                        
                        new_reminder = serializer.save()
                        results.append({'status': 'created', 'id': new_reminder.id})
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
