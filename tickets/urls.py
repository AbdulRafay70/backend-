from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TicketViewSet, HotelsViewSet, HotelRoomsViewSet, HotelCategoryViewSet, BedTypeViewSet
from .hotel_availability_api import HotelAvailabilityAPIView
from .room_assignment_api import RoomAssignmentAPIView, RoomUnassignmentAPIView
from .room_map_api import RoomMapManagementAPIView
from .hotel_floors_api import HotelFloorsListAPIView, HotelFloorDetailAPIView

router = DefaultRouter()
router.register(r'tickets', TicketViewSet, basename='tickets')
router.register(r'hotels', HotelsViewSet, basename='hotels')
router.register(r'hotel-rooms', HotelRoomsViewSet, basename='hotelrooms')
router.register(r'hotel-categories', HotelCategoryViewSet, basename='hotelcategory')
router.register(r'bed-types', BedTypeViewSet, basename='bedtype')


urlpatterns = [
    # Hotel & Accommodation APIs (must come BEFORE router.urls to avoid conflicts)
    path('api/hotel-floors/', HotelFloorsListAPIView.as_view(), name='hotel-floors-list'),
    path('api/hotel-floors/<int:pk>/', HotelFloorDetailAPIView.as_view(), name='hotel-floor-detail'),
    path('api/hotels/availability/', HotelAvailabilityAPIView.as_view(), name='hotel-availability'),
    path('api/hotel-availability/', HotelAvailabilityAPIView.as_view(), name='hotel-availability-alt'),
    path('api/hotels/assign-room/', RoomAssignmentAPIView.as_view(), name='room-assignment'),
    path('api/hotels/unassign-room/', RoomUnassignmentAPIView.as_view(), name='room-unassignment'),
    path('api/hotels/room-map/', RoomMapManagementAPIView.as_view(), name='room-map-management'),
    
    # Router URLs (general CRUD endpoints)
    path('api/', include(router.urls)),
]
