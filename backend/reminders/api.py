from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from .models import Reminder
from .serializers import ReminderSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from .views import sync_reminders

class ReminderViewSet(ModelViewSet):
    serializer_class = ReminderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Reminder.objects.filter(schedule__user=self.request.user).select_related("schedule").order_by("-scheduled_at")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        schedule = serializer.validated_data.get('schedule')
        medication = schedule.medication if schedule else None
        instance = serializer.save(medication=medication)
        response_serializer = self.get_serializer(instance)
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['delete'])
    def delete_all(self, request):
        reminders = self.get_queryset()
        reminders.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

router = DefaultRouter()
router.register(r'', ReminderViewSet, basename='reminders')

urlpatterns = [
    path('sync/', sync_reminders, name='sync-reminders'),
    path('', include(router.urls)),
]