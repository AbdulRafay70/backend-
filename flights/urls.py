"""
Flight API URLs
"""
from django.urls import path
from .views import (
    FlightSearchView,
    FlightAuthTestView,
    ClearAuthCacheView,
    FlightWarmupView,
    ValidateFareView,
    CreateBookingView,
    SaveBookingView,
    ListBookingsView,
    BookingDetailView,
    FareRulesView,
    RetrievePNRView,
    UpdatePassportView,
    BrandedFaresView
    , AIQSTokenView
)

app_name = 'flights'

urlpatterns = [
    path('search/', FlightSearchView.as_view(), name='flight-search'),
    path('auth/test/', FlightAuthTestView.as_view(), name='auth-test'),
    path('auth/clear-cache/', ClearAuthCacheView.as_view(), name='clear-auth-cache'),
    path('auth/warmup/', FlightWarmupView.as_view(), name='auth-warmup'),
    path('validate/', ValidateFareView.as_view(), name='validate-fare'),
    path('aiqs-token/', AIQSTokenView.as_view(), name='aiqs-token'),
    path('book/', CreateBookingView.as_view(), name='create-booking'),
    path('bookings/save/', SaveBookingView.as_view(), name='save-booking'),
    path('bookings/', ListBookingsView.as_view(), name='list-bookings'),
    path('bookings/<str:booking_ref_id>/', BookingDetailView.as_view(), name='booking-detail'),
    path('fare-rules/', FareRulesView.as_view(), name='fare-rules'),
    path('retrievePNR/', RetrievePNRView.as_view(), name='retrieve-pnr'),
    path('updatePassport/', UpdatePassportView.as_view(), name='update-passport'),
    path('branded-fares/', BrandedFaresView.as_view(), name='branded-fares'),
]
