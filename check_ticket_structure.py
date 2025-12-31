"""
Check the actual structure of ticket_details returned by the API.
"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from booking.serializers import BookingSerializer

print("=" * 60)
print("CHECKING TICKET_DETAILS STRUCTURE IN API")
print("=" * 60)

booking = Booking.objects.filter(status__in=['Delivered', 'Approved']).first()

if booking:
    print(f"\n📦 Booking: {booking.booking_number}")
    
    serializer = BookingSerializer(booking)
    data = serializer.data
    
    print("\n📋 ticket_details structure:")
    if 'ticket_details' in data and data['ticket_details']:
        ticket_detail = data['ticket_details'][0]
        print(json.dumps(ticket_detail, indent=2, default=str))
    else:
        print("   No ticket_details found")
    
    print("\n" + "=" * 60)
