from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, LeadViewSet, FollowUpViewSet, LoanCommitmentViewSet

router = DefaultRouter()
router.register(r"customers", CustomerViewSet, basename="customer")
router.register(r"leads", LeadViewSet, basename="lead")
router.register(r"followups", FollowUpViewSet, basename="followup")
router.register(r"loan-commitments", LoanCommitmentViewSet, basename="loancommitment")

urlpatterns = [
    path("", include(router.urls)),
]
