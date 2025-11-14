from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PromotionContactViewSet, PromotionContactBulkSubscribeAPIView

router = DefaultRouter()
router.register(r"contacts", PromotionContactViewSet, basename="promotion-contact")

urlpatterns = [
    path("", include(router.urls)),
    path("bulk-subscribe/", PromotionContactBulkSubscribeAPIView.as_view(), name="promotion-bulk-subscribe"),
]
