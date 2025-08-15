
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from reminders.models import Reminder

class AnalyticsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        total = Reminder.objects.filter(schedule__user=request.user).count()
        sent = Reminder.objects.filter(schedule__user=request.user, status="sent").count()
        return Response({"total_reminders": total, "sent_reminders": sent})
