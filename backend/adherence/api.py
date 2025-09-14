from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AdherenceRecordViewSet,
    AdherenceStreakViewSet,
    record_adherence,
    adherence_summary,
    adherence_report,
    sync_adherence_records
)

# Create router for viewsets
router = DefaultRouter()
router.register(r'records', AdherenceRecordViewSet, basename='adherence-records')
router.register(r'streaks', AdherenceStreakViewSet, basename='adherence-streaks')

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # Custom endpoints
    path('respond/', record_adherence, name='record-adherence'),
    path('summary/', adherence_summary, name='adherence-summary'),
    path('report/', adherence_report, name='adherence-report'),
    path('sync/', sync_adherence_records, name='sync-adherence'),
]
