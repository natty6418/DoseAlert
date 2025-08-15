
from rest_framework import serializers
from .models import Medication

class MedicationSerializer(serializers.ModelSerializer):
    # Include related schedules (which contain reminder information)
    schedules = serializers.StringRelatedField(many=True, read_only=True)
    
    class Meta:
        model = Medication
        fields = "__all__"
        read_only_fields = ("userId","created_at")
