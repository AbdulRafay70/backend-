"""
Verify booking amounts in database and display detailed breakdown
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking

def verify_booking_data():
    """Verify and display booking data"""
    
    print("=" * 70)
    print("BOOKING DATA VERIFICATION")
    print("=" * 70)
    
    # Get the specific booking mentioned
    booking = Booking.objects.filter(booking_number='PKG83719').first()
    
    if not booking:
        print("❌ Booking PKG83719 not found!")
        return
    
    print(f"\n📋 Booking: {booking.booking_number}")
    print(f"   Type: {booking.booking_type}")
    print(f"   Status: {booking.status}")
    print(f"   Total Pax: {booking.total_pax}")
    
    print(f"\n💰 AMOUNTS IN DATABASE:")
    print(f"   total_visa_amount_pkr:      {booking.total_visa_amount_pkr}")
    print(f"   total_ticket_amount_pkr:    {booking.total_ticket_amount_pkr}")
    print(f"   total_hotel_amount_pkr:     {booking.total_hotel_amount_pkr}")
    print(f"   total_transport_amount_pkr: {booking.total_transport_amount_pkr}")
    print(f"   total_food_amount_pkr:      {booking.total_food_amount_pkr}")
    print(f"   total_ziyarat_amount_pkr:   {booking.total_ziyarat_amount_pkr}")
    print(f"   total_amount:               {booking.total_amount}")
    print(f"   total_in_pkr:               {booking.total_in_pkr}")
    
    print(f"\n📊 RELATED DETAILS:")
    print(f"   Hotel Details: {booking.hotel_details.count()}")
    print(f"   Ticket Details: {booking.ticket_details.count()}")
    print(f"   Transport Details: {booking.transport_details.count()}")
    print(f"   Person Details: {booking.person_details.count()}")
    
    # Check person details for visa
    print(f"\n🎫 PERSON DETAILS (Visa):")
    for person in booking.person_details.all():
        print(f"   - {person.first_name} {person.last_name}: Visa PKR {person.visa_price} ({person.age_group})")
    
    # Check if package is linked
    if booking.umrah_package:
        print(f"\n📦 PACKAGE INFO:")
        print(f"   Package: {booking.umrah_package.title}")
        print(f"   Package Code: {booking.umrah_package.package_code}")
    
    print("\n" + "=" * 70)
    
    # Now test the serializer
    print("\n🔍 TESTING SERIALIZER OUTPUT:")
    from booking.serializers import BookingSerializer
    serializer = BookingSerializer(booking)
    data = serializer.data
    
    print(f"\n   Serialized total_visa_amount_pkr: {data.get('total_visa_amount_pkr')}")
    print(f"   Serialized total_ticket_amount_pkr: {data.get('total_ticket_amount_pkr')}")
    print(f"   Serialized total_hotel_amount_pkr: {data.get('total_hotel_amount_pkr')}")
    print(f"   Serialized total_in_pkr: {data.get('total_in_pkr')}")
    
    print("\n" + "=" * 70)

if __name__ == '__main__':
    verify_booking_data()
