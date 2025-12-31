"""
Check if trip_details are being serialized in the booking API response.
"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from rest_framework.renderers import JSONRenderer

# Import the viewset to use the same serializer
from booking.views import BookingViewSet

print("=" * 60)
print("CHECKING API RESPONSE STRUCTURE")
print("=" * 60)

booking = Booking.objects.filter(status__in=['Delivered', 'Approved']).first()

if booking:
    print(f"\n📦 Booking: {booking.booking_number}")
    
    # Use the viewset's serializer
    from booking.serializers import BookingSerializer
    
    serializer = BookingSerializer(booking)
    data = serializer.data
    
    print("\n📋 Full booking data keys:")
    print(list(data.keys()))
    
    if 'ticket_details' in data and data['ticket_details']:
        print("\n✈️ ticket_details structure:")
        ticket = data['ticket_details'][0]
        print(f"Keys: {list(ticket.keys())}")
        
        if 'trip_details' in ticket:
            print(f"\n✅ trip_details found! Count: {len(ticket['trip_details'])}")
            if ticket['trip_details']:
                print("\nFirst trip_details:")
                print(json.dumps(ticket['trip_details'][0], indent=2, default=str))
        else:
            print("\n❌ trip_details NOT found in ticket_details!")
            print("Available fields:", list(ticket.keys()))
    else:
        print("\n❌ No ticket_details in booking")
    
    print("\n" + "=" * 60)
