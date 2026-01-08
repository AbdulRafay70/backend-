"""
Check what the API is actually returning for hotel city data
"""

import os
import sys
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from booking.serializers import BookingSerializer

def check_api_response():
    """Check what the serializer returns for hotel cities"""
    
    print("=" * 80)
    print("CHECKING API RESPONSE FOR HOTEL CITIES")
    print("=" * 80)
    
    # Get one booking with hotels
    booking = Booking.objects.filter(
        status='Delivered',
        hotel_details__isnull=False
    ).first()
    
    if not booking:
        print("❌ No booking found")
        return
    
    print(f"\n📋 Booking: {booking.booking_number}")
    
    # Serialize it
    serializer = BookingSerializer(booking)
    data = serializer.data
    
    # Check hotel details
    if 'hotel_details' in data and data['hotel_details']:
        print(f"\n🏨 Hotel Details in API Response:")
        for i, hotel in enumerate(data['hotel_details']):
            print(f"\n   Hotel {i+1}:")
            print(f"   - Name: {hotel.get('hotel', {}).get('name', 'N/A')}")
            print(f"   - City: {hotel.get('hotel', {}).get('city', 'N/A')}")
            print(f"   - City type: {type(hotel.get('hotel', {}).get('city', 'N/A'))}")
            print(f"   - Check-in: {hotel.get('check_in_date', 'N/A')}")
            print(f"   - Check-out: {hotel.get('check_out_date', 'N/A')}")
            
            # Print full hotel object
            print(f"\n   Full hotel object:")
            print(f"   {json.dumps(hotel.get('hotel', {}), indent=6)}")
    
    print(f"\n{'='*80}")
    print("✅ API RESPONSE CHECK COMPLETE")
    print(f"{'='*80}")

if __name__ == '__main__':
    check_api_response()
