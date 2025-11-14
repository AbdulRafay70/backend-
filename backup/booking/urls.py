from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import BookingViewSet,PaymentViewSet, SectorViewSet,BigSectorViewSet, VehicleTypeViewSet, InternalNoteViewSet, BankAccountViewSet, OrganizationLinkViewSet, AllowedResellerViewSet, DiscountGroupViewSet, MarkupViewSet
from .views import HotelOutsourcingViewSet, PublicBookingStatusAPIView, PaxSummaryAPIView, AdminPublicBookingViewSet
from .views import HotelPaxSummaryAPIView, TransportPaxSummaryAPIView, FlightPaxSummaryAPIView
from .views import PublicBookingCreateAPIView, PublicBookingPaymentCreateAPIView, AdminApprovePaymentAPIView
from .views import get_ticket_price, get_inventory_price  # Import the new views

router = DefaultRouter()
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'sectors', SectorViewSet, basename='sector')
router.register(r'big-sectors', BigSectorViewSet, basename='big-sector')
router.register(r'vehicle-types', VehicleTypeViewSet, basename='vehicle-types')
router.register(r'internal-notes', InternalNoteViewSet, basename="internal-notes")
router.register(r'organization-links', OrganizationLinkViewSet, basename='organization-link')
router.register(r'allowed-resellers', AllowedResellerViewSet, basename='allowed-resellers')
router.register(r'discount-groups', DiscountGroupViewSet, basename="discount-groups")
router.register(r'bank-accounts', BankAccountViewSet, basename='bank-accounts')
router.register(r"markups", MarkupViewSet, basename="markup")
router.register(r'hotel-outsourcing', HotelOutsourcingViewSet, basename='hotel-outsourcing')
router.register(r'admin/public-bookings', AdminPublicBookingViewSet, basename='admin-public-bookings')
urlpatterns = [
    path('api/', include(router.urls)),
    
    # Public booking status endpoints (no auth)
    path('api/public/booking-status/<str:booking_no>/', PublicBookingStatusAPIView.as_view(), name='public-booking-status-by-number'),
    path('api/public/booking-status/', PublicBookingStatusAPIView.as_view(), name='public-booking-status-by-ref'),
    # Public create endpoints for booking & payments
    path('api/public/bookings/', PublicBookingCreateAPIView.as_view(), name='public-booking-create'),
    path('api/public/bookings/payments/', PublicBookingPaymentCreateAPIView.as_view(), name='public-booking-payment-create'),
    # Admin actions for payments
    path('api/admin/payments/<int:payment_id>/approve/', AdminApprovePaymentAPIView.as_view(), name='admin-payment-approve'),
    path('api/pax-summary/', PaxSummaryAPIView.as_view(), name='pax-summary'),
    path('api/pax-summary/hotel-status/', HotelPaxSummaryAPIView.as_view(), name='pax-summary-hotel'),
    path('api/pax-summary/transport-status/', TransportPaxSummaryAPIView.as_view(), name='pax-summary-transport'),
    path('api/pax-summary/flight-status/', FlightPaxSummaryAPIView.as_view(), name='pax-summary-flight'),
    
    # AJAX endpoint for dynamic ticket price updates
    path('admin/booking/get-ticket-price/', get_ticket_price, name='get-ticket-price'),
    
    # AJAX endpoint for dynamic inventory price updates (hotel, transport, visa, package, ticket)
    path('admin/booking/get-inventory-price/', get_inventory_price, name='get-inventory-price'),
]
