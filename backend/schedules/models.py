
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from meds.models import Medication
from datetime import date
User = get_user_model()

class ScheduleManager(models.Manager):
    def active(self):
        """Get schedules that are active AND not expired"""
        return self.filter(
            active=True
        ).exclude(
            medication__end_date__lt=date.today()
        )
    
    def expired(self):
        """Get schedules with expired medications"""
        return self.filter(
            medication__end_date__lt=date.today()
        )

class Schedule(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="schedules")
    medication = models.ForeignKey(Medication, on_delete=models.CASCADE, related_name="schedules")
    # simple: times per day; expand to RRULE later
    time_of_day = models.TimeField()      # e.g., 08:00
    days_of_week = models.CharField(max_length=32, default="Mon,Tue,Wed,Thu,Fri,Sat,Sun")
    timezone = models.CharField(max_length=64, default="UTC")
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    objects = ScheduleManager()
    
    @property
    def is_medication_expired(self):
        """Check if the medication has passed its end date"""
        if self.medication.end_date:
            return date.today() > self.medication.end_date
        return False
    
    @property
    def is_effectively_active(self):
        """Check if schedule is effectively active (active AND not expired)"""
        return self.active and not self.is_medication_expired
    
    def get_scheduled_weekdays(self):
        """Parse days_of_week string and return list of weekday numbers"""
        # Parse days of week (e.g., "Mon,Wed,Fri" -> ["Mon", "Wed", "Fri"])
        scheduled_days = [day.strip() for day in self.days_of_week.split(',')]
        
        # Map day names to weekday numbers (Monday=0, Sunday=6)
        day_mapping = {
            'Mon': 0, 'Tue': 1, 'Wed': 2, 'Thu': 3, 
            'Fri': 4, 'Sat': 5, 'Sun': 6
        }
        
        # Convert to weekday numbers
        return [day_mapping[day] for day in scheduled_days if day in day_mapping]
    
    def is_scheduled_for_date(self, date):
        """Check if this schedule should run on the given date"""
        scheduled_weekdays = self.get_scheduled_weekdays()
        return date.weekday() in scheduled_weekdays
    
    def save(self, *args, **kwargs):
        """Override save to automatically deactivate expired schedules and create reminders"""
        is_new = self.pk is None  # Check if this is a new schedule
        
        # Deactivate if medication is expired
        if self.is_medication_expired:
            self.active = False
        
        super().save(*args, **kwargs)
        
        # if is_new and self.active and not self.is_medication_expired:
        #     self.create_initial_reminders()
    
    def create_initial_reminders(self):
        """Create reminders for this schedule"""
        from reminders.models import Reminder
        from datetime import timedelta
        
        # Generate reminders for the next 14 days (to ensure we get all scheduled days)
        today = timezone.now().date()
        
        for i in range(14):
            reminder_date = today + timedelta(days=i)
            
            # Check if this day matches our schedule
            if self.is_scheduled_for_date(reminder_date):
                # Skip if reminder already exists for this date
                existing_reminder = Reminder.objects.filter(
                    schedule=self,
                    scheduled_at__date=reminder_date
                ).exists()
                
                if not existing_reminder:
                    # Create reminder for the scheduled time on this date
                    scheduled_datetime = timezone.datetime.combine(
                        reminder_date, 
                        self.time_of_day
                    )
                    scheduled_datetime = timezone.make_aware(scheduled_datetime)
                    
                    # Only create reminder if it's in the future
                    if scheduled_datetime > timezone.now():
                        Reminder.objects.create(
                            schedule=self,
                            medication=self.medication,  # Add direct medication reference
                            scheduled_at=scheduled_datetime,
                            status="pending"
                        )
    
    def regenerate_reminders(self, days_ahead=14):
        """Regenerate reminders for this schedule (useful when schedule is updated)"""
        from reminders.models import Reminder
        from datetime import timedelta
        
        # Delete future pending reminders for this schedule
        Reminder.objects.filter(
            schedule=self,
            scheduled_at__gt=timezone.now(),
            status="pending"
        ).delete()
        
        # Create new reminders if schedule is active
        if self.active and not self.is_medication_expired:
            today = timezone.now().date()
            
            for i in range(days_ahead):
                reminder_date = today + timedelta(days=i)
                
                # Check if this day matches our schedule
                if self.is_scheduled_for_date(reminder_date):
                    scheduled_datetime = timezone.datetime.combine(
                        reminder_date, 
                        self.time_of_day
                    )
                    scheduled_datetime = timezone.make_aware(scheduled_datetime)
                    
                    # Only create reminder if it's in the future
                    if scheduled_datetime > timezone.now():
                        Reminder.objects.create(
                            schedule=self,
                            medication=self.medication,  # Add direct medication reference
                            scheduled_at=scheduled_datetime,
                            status="pending"
                        )
    
    def __str__(self): 
        if self.is_medication_expired:
            status = "EXPIRED"
        elif self.active:
            status = "ACTIVE"
        else:
            status = "INACTIVE"
        return f"{self.medication.name} @ {self.time_of_day} ({status})"
