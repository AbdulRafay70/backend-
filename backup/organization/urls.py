from django.urls import path, include
from .views import OrganizationViewSet, BranchViewSet,AgencyViewSet, OrganizationLinkViewSet, AgencyProfileView, ResellRequestViewSet
from .views import RuleCreateView, RuleListView, RuleUpdateView, RuleDeleteView
from .views import WalkInCreateView, WalkInListView, WalkInUpdateStatusView, WalkInSummaryView
from rest_framework import routers


router = routers.DefaultRouter()
router.register(r"organizations", OrganizationViewSet, basename="organizations")
router.register(r"branches", BranchViewSet, basename="branches")
router.register(r"agencies", AgencyViewSet, basename="agencies")
router.register(r"organization-links", OrganizationLinkViewSet, basename="organization-links")
router.register(r"resell-requests", ResellRequestViewSet, basename="resell-requests")


urlpatterns = [
    path("api/", include(router.urls)),
    path("api/agency/profile", AgencyProfileView.as_view(), name="agency-profile"),
    path("api/rules/create", RuleCreateView.as_view(), name="rules-create"),
    path("api/rules/list", RuleListView.as_view(), name="rules-list"),
    path("api/rules/update/<int:id>", RuleUpdateView.as_view(), name="rules-update"),
    path("api/rules/delete/<int:id>", RuleDeleteView.as_view(), name="rules-delete"),
    # Walk-in booking endpoints
    path("api/walkin/create", WalkInCreateView.as_view(), name="walkin-create"),
    path("api/walkin/list", WalkInListView.as_view(), name="walkin-list"),
    path("api/walkin/update-status/<int:booking_id>", WalkInUpdateStatusView.as_view(), name="walkin-update-status"),
    path("api/walkin/summary", WalkInSummaryView.as_view(), name="walkin-summary"),
]