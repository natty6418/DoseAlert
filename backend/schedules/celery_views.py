from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from schedules.tasks import deactivate_expired_schedules, process_due_reminders, bulk_deactivate_expired_schedules
from reminders.tasks import cleanup_old_reminders, retry_failed_reminders

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_deactivate_expired_schedules(request):
    """
    Manually trigger the deactivation of expired schedules
    """
    try:
        task = deactivate_expired_schedules.delay()
        return Response({
            'message': 'Task started successfully',
            'task_id': task.id,
            'status': 'started'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_process_due_reminders(request):
    """
    Manually trigger processing of due reminders
    """
    try:
        task = process_due_reminders.delay()
        return Response({
            'message': 'Process due reminders task started successfully',
            'task_id': task.id,
            'status': 'started'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_cleanup_reminders(request):
    """
    Manually trigger cleanup of old reminders
    """
    try:
        task = cleanup_old_reminders.delay()
        return Response({
            'message': 'Cleanup task started successfully',
            'task_id': task.id,
            'status': 'started'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_deactivate_expired(request):
    """
    Manually trigger bulk deactivation of expired schedules (faster)
    """
    try:
        task = bulk_deactivate_expired_schedules.delay()
        return Response({
            'message': 'Bulk deactivation task started successfully',
            'task_id': task.id,
            'status': 'started'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def task_status(request, task_id):
    """
    Check the status of a celery task
    """
    from celery.result import AsyncResult
    
    try:
        task_result = AsyncResult(task_id)
        
        response_data = {
            'task_id': task_id,
            'status': task_result.status,
            'ready': task_result.ready(),
        }
        
        if task_result.ready():
            if task_result.successful():
                response_data['result'] = task_result.result
            else:
                response_data['error'] = str(task_result.result)
        
        return Response(response_data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
