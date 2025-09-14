from django.db import models
from django.contrib.auth import get_user_model
from schedules.models import Schedule
from meds.models import Medication  # Assuming the app name is medications
from datetime import datetime
User = get_user_model()

class Reminder(models.Model):
    schedule = models.ForeignKey(Schedule, on_delete=models.CASCADE, related_name="reminders")
    medication = models.ForeignKey(Medication, on_delete=models.CASCADE, related_name="reminders", null=True, blank=True)  # Direct link
    scheduled_at = models.DateTimeField(default=datetime.now)      # next fire time (computed)
    sent_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=32, default="pending")  # pending/sent/failed
    def __str__(self): 
        medication_name = self.medication.name if self.medication else self.schedule.medication.name
        return f"Reminder for {medication_name} at {self.scheduled_at} ({self.status})"
