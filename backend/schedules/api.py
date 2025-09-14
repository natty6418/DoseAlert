from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viewsets import ScheduleViewSet
from .views import sync_schedules

router = DefaultRouter()
router.register(r'', ScheduleViewSet, basename='schedules')

urlpatterns = [
    path('sync/', sync_schedules, name='sync-schedules'),
    path('', include(router.urls)),
]
