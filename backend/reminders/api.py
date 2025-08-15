
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from .models import Reminder
from .serializers import ReminderSerializer

class ReminderViewSet(ModelViewSet):
    serializer_class = ReminderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # only those tied to the user's schedules
        return Reminder.objects.filter(schedule__user=self.request.user).select_related("schedule").order_by("-scheduled_at")
