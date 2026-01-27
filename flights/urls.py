"""
Flight API URLs
"""
from django.urls import path
from .views import (
    FlightSearchView,
    FlightAuthTestView,
    ClearAuthCacheView
    , FlightWarmupView
)

app_name = 'flights'

urlpatterns = [
    path('search/', FlightSearchView.as_view(), name='flight-search'),
    path('auth/test/', FlightAuthTestView.as_view(), name='auth-test'),
    path('auth/clear-cache/', ClearAuthCacheView.as_view(), name='clear-auth-cache'),
    path('auth/warmup/', FlightWarmupView.as_view(), name='auth-warmup'),
]
