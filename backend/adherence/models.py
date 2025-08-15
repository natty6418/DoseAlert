from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

class AdherenceRecord(models.Model):
    ADHERENCE_STATUS_CHOICES = [
        ('taken', 'Taken'),
        ('missed', 'Missed'),
        ('skipped', 'Skipped'),  # User chose to skip
        ('pending', 'Pending'),  # Waiting for user response
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="adherence_records")
    medication = models.ForeignKey('meds.Medication', on_delete=models.CASCADE, related_name="adherence_records")
    reminder = models.OneToOneField('reminders.Reminder', on_delete=models.CASCADE, related_name="adherence_record")
    
    status = models.CharField(max_length=20, choices=ADHERENCE_STATUS_CHOICES, default='pending')
    scheduled_time = models.DateTimeField()  # When medication was supposed to be taken
    actual_time = models.DateTimeField(null=True, blank=True)  # When it was actually taken (if taken)
    response_time = models.DateTimeField(null=True, blank=True)  # When user responded
    
    # Tracking fields
    is_late = models.BooleanField(default=False)  # Taken more than 30 minutes late
    minutes_late = models.IntegerField(null=True, blank=True)  # How many minutes late
    
    notes = models.TextField(blank=True)  # User notes about taking/missing medication
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-scheduled_time']
        unique_together = ['user', 'reminder']
    
    def save(self, *args, **kwargs):
        # Calculate lateness if taken
        if self.status == 'taken' and self.actual_time:
            time_diff = self.actual_time - self.scheduled_time
            self.minutes_late = int(time_diff.total_seconds() / 60)
            self.is_late = self.minutes_late > 30
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.medication.name} - {self.scheduled_time.date()} ({self.status})"


class AdherenceStreak(models.Model):
    """Track consecutive missed/taken streaks for medications"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="adherence_streaks")
    medication = models.ForeignKey('meds.Medication', on_delete=models.CASCADE, related_name="adherence_streaks")
    
    current_taken_streak = models.IntegerField(default=0)  # Current consecutive taken count
    current_missed_streak = models.IntegerField(default=0)  # Current consecutive missed count
    
    # All-time records
    longest_taken_streak = models.IntegerField(default=0)
    longest_missed_streak = models.IntegerField(default=0)
    
    # Statistics
    total_taken = models.IntegerField(default=0)
    total_missed = models.IntegerField(default=0)
    total_scheduled = models.IntegerField(default=0)
    
    last_updated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'medication']
    
    @property
    def adherence_percentage(self):
        """Calculate adherence percentage"""
        if self.total_scheduled == 0:
            return 0
        return round((self.total_taken / self.total_scheduled) * 100, 2)
    
    def update_streak(self, status):
        """Update streak based on new adherence record"""
        if status == 'taken':
            self.current_taken_streak += 1
            self.current_missed_streak = 0
            self.total_taken += 1
            
            if self.current_taken_streak > self.longest_taken_streak:
                self.longest_taken_streak = self.current_taken_streak
                
        elif status in ['missed', 'skipped']:
            self.current_missed_streak += 1
            self.current_taken_streak = 0
            self.total_missed += 1
            
            if self.current_missed_streak > self.longest_missed_streak:
                self.longest_missed_streak = self.current_missed_streak
        
        self.total_scheduled += 1
        self.save()
    
    def __str__(self):
        return f"{self.medication.name} - {self.adherence_percentage}% adherence"


class AdherenceManager(models.Manager):
    def pending_responses(self):
        """Get adherence records waiting for user response"""
        return self.filter(
            status='pending',
            scheduled_time__lt=timezone.now()
        )
    
    def overdue_responses(self, hours=1):
        """Get adherence records that are overdue for response"""
        cutoff_time = timezone.now() - timedelta(hours=hours)
        return self.filter(
            status='pending',
            scheduled_time__lt=cutoff_time
        )


# Add the custom manager to AdherenceRecord
AdherenceRecord.objects = AdherenceManager()
