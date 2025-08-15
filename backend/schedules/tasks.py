from celery import shared_task
from django.core.management import call_command
from django.utils import timezone
from .models import Schedule
from datetime import date

@shared_task
def deactivate_expired_schedules():
    """
    Celery task to deactivate schedules for medications that have passed their end date
    """
    # Find schedules with expired medications that are still active
    expired_schedules = Schedule.objects.filter(
        medication__end_date__lt=date.today(),
        active=True
    ).select_related('medication', 'user')
    
    count = expired_schedules.count()
    
    if count == 0:
        return "No expired schedules found."
    
    # Deactivate expired schedules
    for schedule in expired_schedules:
        schedule.active = False
        schedule.save()
    
    return f"Successfully deactivated {count} expired schedules."

@shared_task
def generate_daily_reminders():
    """
    Generate reminders for all active schedules for the next 7 days
    """
    active_schedules = Schedule.objects.active()
    total_reminders = 0
    
    for schedule in active_schedules:
        initial_count = schedule.reminders.count()
        schedule.create_initial_reminders()
        new_count = schedule.reminders.count()
        total_reminders += (new_count - initial_count)
    
    return f"Generated {total_reminders} new reminders for {active_schedules.count()} active schedules"

@shared_task
def regenerate_all_reminders():
    """
    Regenerate all future reminders for active schedules
    """
    active_schedules = Schedule.objects.active()
    
    for schedule in active_schedules:
        schedule.regenerate_reminders(days_ahead=7)
    
    return f"Regenerated reminders for {active_schedules.count()} active schedules"

@shared_task
def process_due_reminders():
    """
    Process reminders that are due to be sent (within the next 5 minutes)
    """
    from reminders.models import Reminder
    from datetime import timedelta
    
    # Get reminders that are due soon (within 5 minutes) and still pending
    now = timezone.now()
    upcoming_time = now + timedelta(minutes=5)
    
    due_reminders = Reminder.objects.filter(
        scheduled_at__lte=upcoming_time,
        scheduled_at__gte=now - timedelta(minutes=5),  # Don't process very old ones
        status="pending"
    ).select_related('medication', 'schedule')
    
    processed_count = 0
    for reminder in due_reminders:
        # Here you would integrate with your notification system
        # For now, just mark as "sent"
        reminder.status = "sent"
        reminder.sent_at = timezone.now()
        reminder.save()
        processed_count += 1
    
    return f"Processed {processed_count} due reminders."

@shared_task
def bulk_deactivate_expired_schedules():
    """
    Alternative bulk update approach for better performance
    """
    count = Schedule.objects.filter(
        medication__end_date__lt=date.today(),
        active=True
    ).update(active=False)
    
    return f"Bulk deactivated {count} expired schedules."
