from rest_framework import serializers
from .models import AdherenceRecord, AdherenceStreak

class AdherenceRecordSerializer(serializers.ModelSerializer):
    medication_name = serializers.CharField(source='medication.name', read_only=True)
    reminder_id = serializers.IntegerField(source='reminder.id', read_only=True)
    
    class Meta:
        model = AdherenceRecord
        fields = [
            'id', 'medication', 'medication_name', 'reminder', 'reminder_id',
            'status', 'scheduled_time', 'actual_time', 'response_time',
            'is_late', 'minutes_late', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ('user', 'is_late', 'minutes_late', 'created_at', 'updated_at')

class AdherenceResponseSerializer(serializers.Serializer):
    """Serializer for user responses about medication adherence"""
    reminder_id = serializers.IntegerField()
    status = serializers.ChoiceField(choices=[
        ('taken', 'Taken'),
        ('missed', 'Missed'),
        ('skipped', 'Skipped')
    ])
    actual_time = serializers.DateTimeField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, max_length=500)
    
    def validate_reminder_id(self, value):
        """Validate that the reminder exists and belongs to the user"""
        from reminders.models import Reminder
        
        try:
            reminder = Reminder.objects.get(id=value)
        except Reminder.DoesNotExist:
            raise serializers.ValidationError("Reminder not found.")
        
        # Check if adherence record already exists
        if hasattr(reminder, 'adherence_record'):
            adherence = reminder.adherence_record
            if adherence.status != 'pending':
                raise serializers.ValidationError("Response already recorded for this reminder.")
        
        return value

class AdherenceStreakSerializer(serializers.ModelSerializer):
    medication_name = serializers.CharField(source='medication.name', read_only=True)
    adherence_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = AdherenceStreak
        fields = [
            'id', 'medication', 'medication_name',
            'current_taken_streak', 'current_missed_streak',
            'longest_taken_streak', 'longest_missed_streak',
            'total_taken', 'total_missed', 'total_scheduled',
            'adherence_percentage', 'last_updated', 'created_at'
        ]
        read_only_fields = ('user', 'last_updated', 'created_at')

class AdherenceSummarySerializer(serializers.Serializer):
    """Summary of adherence for a user"""
    total_medications = serializers.IntegerField()
    pending_responses = serializers.IntegerField()
    overdue_responses = serializers.IntegerField()
    overall_adherence_percentage = serializers.FloatField()
    recent_records = AdherenceRecordSerializer(many=True)
    streaks = AdherenceStreakSerializer(many=True)
