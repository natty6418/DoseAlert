from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import sync_meds
from .viewsets import MedicationViewSet

router = DefaultRouter()
router.register(r'', MedicationViewSet, basename='meds')

urlpatterns = [
    path('sync/', sync_meds, name='sync-meds'),
    path('', include(router.urls)),
]
