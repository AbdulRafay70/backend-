from django.urls import path
from .views import (
    LeadCreateAPIView,
    LeadListAPIView,
    LeadDetailAPIView,
    LeadUpdateAPIView,
    FollowUpCreateAPIView,
    LoanPromiseAPIView,
    LeadSearchAPIView,
    convert_lead,
    mark_lost,
    TodayFollowupsView,
    OverdueLoansView,
    AdminFollowUpViewSet,
)
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'admin/followups', AdminFollowUpViewSet, basename='admin-followups')

urlpatterns = [
    path("create/", LeadCreateAPIView.as_view(), name="leads-create"),
    path("list/", LeadListAPIView.as_view(), name="leads-list"),
    path("detail/<int:pk>/", LeadDetailAPIView.as_view(), name="leads-detail"),
    path("update/<int:pk>/", LeadUpdateAPIView.as_view(), name="leads-update"),
    path("followup/", FollowUpCreateAPIView.as_view(), name="leads-followup"),
    path("loan-promise/", LoanPromiseAPIView.as_view(), name="leads-loan-promise"),
    path("search/", LeadSearchAPIView.as_view(), name="leads-search"),
    path("convert/<int:pk>/", convert_lead, name="leads-convert"),
    path("lost/<int:pk>/", mark_lost, name="leads-lost"),
    path("followup/today/", TodayFollowupsView.as_view(), name="leads-followup-today"),
    path("overdue-loans/", OverdueLoansView.as_view(), name="leads-overdue-loans"),
]

# include router URLs (admin followups)
urlpatterns += router.urls

