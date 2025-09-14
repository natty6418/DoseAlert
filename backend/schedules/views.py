from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from .models import Schedule
from .serializers import ScheduleSerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_schedules(request):
    """
    Synchronize a batch of schedules from a client.
    
    For each schedule object:
    - If 'is_deleted' is True and ID exists, deletes the schedule
    - If ID is provided and 'is_deleted' is False/missing, updates the schedule
    - If ID is null/missing and 'is_deleted' is False/missing, creates a new schedule
    """
    data = request.data
    if not isinstance(data, list):
        return Response({"error": "Request body must be a list of schedule objects."}, status=status.HTTP_400_BAD_REQUEST)

    results = []
    
    try:
        with transaction.atomic():
            for item_data in data:
                schedule_id = item_data.get('id')
                is_deleted = item_data.get('is_deleted', False)
                
                if is_deleted and schedule_id:
                    # DELETE logic
                    try:
                        schedule = Schedule.objects.get(id=schedule_id, user=request.user)
                        schedule.delete()
                        results.append({'status': 'deleted', 'id': schedule_id})
                    except Schedule.DoesNotExist:
                        results.append({'status': 'error', 'id': schedule_id, 'errors': 'Schedule not found for deletion.'})
                elif is_deleted and not schedule_id:
                    # Can't delete without an ID
                    results.append({'status': 'error', 'id': None, 'errors': 'Cannot delete schedule without ID.'})
                elif schedule_id and not is_deleted:
                    # UPDATE logic
                    try:
                        schedule = Schedule.objects.get(id=schedule_id, user=request.user)
                        # Remove sync-specific fields that shouldn't be saved to the model
                        clean_data = {k: v for k, v in item_data.items() if k not in ['user', 'is_deleted']}
                        serializer = ScheduleSerializer(instance=schedule, data=clean_data, partial=True)
                        if serializer.is_valid():
                            serializer.save()
                            results.append({'status': 'updated', 'id': schedule.id})
                        else:
                            results.append({'status': 'error', 'id': schedule_id, 'errors': serializer.errors})
                    except Schedule.DoesNotExist:
                        results.append({'status': 'error', 'id': schedule_id, 'errors': 'Schedule not found.'})
                elif not schedule_id and not is_deleted:
                    # CREATE logic
                    clean_data = {k: v for k, v in item_data.items() if k not in ['id', 'user', 'is_deleted']}
                    serializer = ScheduleSerializer(data=clean_data)
                    if serializer.is_valid():
                        new_schedule = serializer.save(user=request.user)
                        results.append({'status': 'created', 'id': new_schedule.id})
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
