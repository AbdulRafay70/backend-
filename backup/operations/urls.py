from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RoomMapViewSet, 
    HotelOperationViewSet, 
    TransportOperationViewSet, 
    FoodOperationViewSet,
    AirportOperationViewSet,
    ZiyaratOperationViewSet,
    PaxDetailViewSet
)
from .views import HotelRoomMapAPIView

router = DefaultRouter()
router.register(r'room-map', RoomMapViewSet, basename='room-map')
router.register(r'daily/hotels', HotelOperationViewSet, basename='daily-hotels')
router.register(r'daily/transport', TransportOperationViewSet, basename='daily-transport')
router.register(r'daily/food', FoodOperationViewSet, basename='daily-food')
router.register(r'daily/airport', AirportOperationViewSet, basename='daily-airport')
router.register(r'daily/ziyarats', ZiyaratOperationViewSet, basename='daily-ziyarats')
router.register(r'pax', PaxDetailViewSet, basename='pax')

urlpatterns = [
    path('', include(router.urls)),
    path('hotels/room-map', HotelRoomMapAPIView.as_view(), name='hotel-room-map'),
]
