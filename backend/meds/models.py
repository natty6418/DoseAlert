
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from django.core.exceptions import ValidationError
from datetime import date
User = get_user_model()

class Medication(models.Model):
    class Unit(models.TextChoices):
        MG = "mg", "mg"
        G = "g", "g"
        ML = "ml", "ml"
        PILLS = "pills", "pills"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="medications")
    
    # Medication specifications stored as separate fields
    name = models.CharField(
        max_length=200,
        validators=[RegexValidator(
            regex=r'^[a-zA-Z0-9\s\-\.]+$',
            message='Name can only contain letters, numbers, spaces, hyphens, and periods.'
        )]
    )
    directions = models.TextField(blank=True, help_text="How to take the medication")
    side_effects = models.TextField(blank=True, help_text="Potential side effects")
    purpose = models.TextField(blank=True, help_text="What the medication is for")
    warnings = models.TextField(blank=True, help_text="Important warnings and precautions")
    
    dosage_amount = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        default=1.00,
        validators=[MinValueValidator(0.01, message="Dosage must be greater than 0")]
    )
    dosage_unit = models.CharField(max_length=20, choices=Unit.choices, default='pills')
    
    notes = models.TextField(blank=True)
    start_date = models.DateField(default=date.today)

    end_date = models.DateField(blank=True, null=True)
    frequency = models.CharField(max_length=120, blank=True)  # e.g., "Once daily", "Twice a week"
    created_at = models.DateTimeField(auto_now_add=True)
    
    def clean(self):
        """Custom validation for the model"""
        super().clean()
        
        # Validate that end_date is after start_date
        if self.end_date and self.start_date and self.end_date <= self.start_date:
            raise ValidationError({
                'end_date': 'End date must be after start date.'
            })
        
        # Validate that start_date is not in the past (optional business rule)
        if self.start_date and self.start_date < date.today():
            raise ValidationError({
                'start_date': 'Start date cannot be in the past.'
            })
    
    def __str__(self):
        return f"{self.name} ({self.user})"
