from django.urls import path
from .celery_views import (
    trigger_deactivate_expired_schedules,
    trigger_process_due_reminders,
    trigger_cleanup_reminders,
    bulk_deactivate_expired,
    task_status
)

urlpatterns = [
    path('tasks/deactivate-expired/', trigger_deactivate_expired_schedules, name='trigger-deactivate-expired'),
    path('tasks/process-due-reminders/', trigger_process_due_reminders, name='trigger-process-due-reminders'),
    path('tasks/cleanup-reminders/', trigger_cleanup_reminders, name='trigger-cleanup-reminders'),
    path('tasks/bulk-deactivate/', bulk_deactivate_expired, name='bulk-deactivate-expired'),
    path('tasks/status/<str:task_id>/', task_status, name='task-status'),
]
