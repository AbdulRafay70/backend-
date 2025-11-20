from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TicketViewSet, HotelsViewSet, HotelRoomsViewSet, HotelCategoryViewSet
from .hotel_availability_api import HotelAvailabilityAPIView
from .room_assignment_api import RoomAssignmentAPIView, RoomUnassignmentAPIView
from .room_map_api import RoomMapManagementAPIView

router = DefaultRouter()
router.register(r'tickets', TicketViewSet, basename='tickets')
router.register(r'hotels', HotelsViewSet, basename='hotels')
router.register(r'hotel-rooms', HotelRoomsViewSet, basename='hotelrooms')
router.register(r'hotel-categories', HotelCategoryViewSet, basename='hotelcategory')

urlpatterns = [
    path('api/', include(router.urls)),  # ✅ your app's API is now under /api/
    
    # Hotel & Accommodation APIs
    path('api/hotels/availability/', HotelAvailabilityAPIView.as_view(), name='hotel-availability'),
    path('api/hotels/assign-room/', RoomAssignmentAPIView.as_view(), name='room-assignment'),
    path('api/hotels/unassign-room/', RoomUnassignmentAPIView.as_view(), name='room-unassignment'),
    path('api/hotels/room-map/', RoomMapManagementAPIView.as_view(), name='room-map-management'),
]
