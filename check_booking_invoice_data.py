"""
Check booking data to see what the invoice page is reading.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking, BookingPersonDetail
from organization.models import Organization

org = Organization.objects.get(id=11)

# Get the specific booking mentioned (BK-20251228-294A)
booking = Booking.objects.filter(booking_number='BK-20251228-294A').first()

if booking:
    print("="*80)
    print(f"BOOKING: {booking.booking_number}")
    print("="*80)
    
    print(f"\n📊 BOOKING FIELDS:")
    print(f"  total_pax: {booking.total_pax}")
    print(f"  total_adult: {booking.total_adult}")
    print(f"  total_child: {booking.total_child}")
    print(f"  total_infant: {booking.total_infant}")
    
    print(f"\n💰 VISA AMOUNTS:")
    print(f"  total_visa_amount: {booking.total_visa_amount}")
    print(f"  total_visa_amount_pkr: {booking.total_visa_amount_pkr}")
    print(f"  total_visa_amount_sar: {booking.total_visa_amount_sar}")
    print(f"  visa_rate: {booking.visa_rate}")
    print(f"  visa_rate_in_pkr: {booking.visa_rate_in_pkr}")
    print(f"  visa_rate_in_sar: {booking.visa_rate_in_sar}")
    
    print(f"\n✈️ TICKET AMOUNTS:")
    print(f"  total_ticket_amount: {booking.total_ticket_amount}")
    print(f"  total_ticket_amount_pkr: {booking.total_ticket_amount_pkr}")
    
    print(f"\n🏨 OTHER AMOUNTS:")
    print(f"  total_hotel_amount: {booking.total_hotel_amount}")
    print(f"  total_transport_amount: {booking.total_transport_amount}")
    print(f"  total_food_amount_pkr: {booking.total_food_amount_pkr}")
    print(f"  total_ziyarat_amount_pkr: {booking.total_ziyarat_amount_pkr}")
    print(f"  total_amount: {booking.total_amount}")
    
    # Check passengers
    passengers = BookingPersonDetail.objects.filter(booking=booking)
    print(f"\n👥 PASSENGERS ({passengers.count()}):")
    for p in passengers:
        print(f"  - {p.first_name} {p.last_name} ({p.age_group})")
        print(f"    Visa: {p.visa_price} PKR (included: {p.is_visa_included})")
        print(f"    Ticket: {p.ticket_price} PKR (included: {p.ticket_included})")
    
    print(f"\n{'='*80}")
    print("DIAGNOSIS:")
    print("The invoice page might be looking at 'visa_rate' or 'visa_rate_in_pkr'")
    print("instead of 'total_visa_amount_pkr'")
    print("="*80)
else:
    print("Booking not found!")
