from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ServiceChargeRuleViewSet, HotelServiceChargeViewSet

router = DefaultRouter()
router.register(r'service-charges', ServiceChargeRuleViewSet, basename='servicechargerule')
router.register(r'hotel-charges', HotelServiceChargeViewSet, basename='hotelservicecharge')

urlpatterns = [
    path('', include(router.urls)),
]
