from celery import shared_task
from django.utils import timezone
from .models import Reminder
from datetime import timedelta

@shared_task
def cleanup_old_reminders():
    """
    Clean up old reminders (older than 30 days)
    """
    cutoff_date = timezone.now() - timedelta(days=30)
    
    deleted_count = Reminder.objects.filter(
        created_at__lt=cutoff_date,
        status__in=['sent', 'failed']
    ).delete()[0]
    
    return f"Cleaned up {deleted_count} old reminders."

@shared_task
def retry_failed_reminders():
    """
    Retry sending failed reminders
    """
    failed_reminders = Reminder.objects.filter(
        status='failed',
        scheduled_at__gte=timezone.now() - timedelta(hours=24)  # Only retry recent failures
    )
    
    retry_count = 0
    for reminder in failed_reminders:
        # Add your reminder sending logic here
        # For now, just mark as pending to retry
        reminder.status = 'pending'
        reminder.save()
        retry_count += 1
    
    return f"Queued {retry_count} failed reminders for retry."
