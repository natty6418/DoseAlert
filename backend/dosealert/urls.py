
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from meds.api import MedicationViewSet
from schedules.api import ScheduleViewSet
from reminders.api import ReminderViewSet
from analytics.api import AnalyticsView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r"meds", MedicationViewSet, basename="med")
router.register(r"schedules", ScheduleViewSet, basename="schedule")
router.register(r"reminders", ReminderViewSet, basename="reminder")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path("api/users/", include("users.urls")),
    path("api/celery/", include("schedules.celery_urls")),
    path("api/adherence/", include("adherence.api")),
    path("api/analytics/summary/", AnalyticsView.as_view(), name="analytics-summary"),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
