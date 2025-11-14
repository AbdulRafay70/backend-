from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PaxMovementViewSet,
    AirportTransferViewSet,
    TransportViewSet,
    ZiyaratViewSet,
    FoodServiceViewSet,
    PaxDetailsViewSet
)

router = DefaultRouter()
router.register(r'pax-movements', PaxMovementViewSet, basename='pax-movements')
router.register(r'daily/airport', AirportTransferViewSet, basename='airport-transfer')
router.register(r'daily/transport', TransportViewSet, basename='transport')
router.register(r'daily/ziyarats', ZiyaratViewSet, basename='ziyarat')
router.register(r'daily/food', FoodServiceViewSet, basename='food-service')
router.register(r'pax/details', PaxDetailsViewSet, basename='pax-details')

urlpatterns = [
    path('', include(router.urls)),
]
