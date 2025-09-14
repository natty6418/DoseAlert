from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from analytics.api import AnalyticsView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse

router = DefaultRouter()


def custom_bad_request(request, exception):
    return JsonResponse({'error': 'Bad Request', 'details': str(exception)}, status=400)

handler400 = custom_bad_request

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path("api/meds/", include("meds.api")),
    path("api/schedules/", include("schedules.api")),
    path("api/reminders/", include("reminders.api")),
    path("api/users/", include("users.urls")),
    path("api/adherence/", include("adherence.api")),
    path("api/analytics/summary/", AnalyticsView.as_view(), name="analytics-summary"),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]