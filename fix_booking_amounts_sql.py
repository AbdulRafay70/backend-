"""
Update booking amounts using direct SQL to bypass save() method.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking, BookingPersonDetail
from organization.models import Organization
from django.db import connection

org = Organization.objects.get(id=11)

print("="*80)
print("UPDATING BOOKING AMOUNTS VIA SQL")
print("="*80)

bookings = Booking.objects.filter(organization=org).order_by('-id')[:6]

for booking in bookings:
    print(f"\n{'='*80}")
    print(f"Booking #{booking.id} - {booking.booking_number}")
    
    # Get passengers
    passengers = BookingPersonDetail.objects.filter(booking=booking)
    
    # Calculate amounts
    total_visa = float(sum(p.visa_price for p in passengers if p.visa_price))
    total_ticket = float(sum(p.ticket_price for p in passengers if p.ticket_price))
    
    # Calculate total
    total_amount = (
        total_visa +
        total_ticket +
        float(booking.total_hotel_amount or 0) +
        float(booking.total_transport_amount or 0) +
        float(booking.total_food_amount_pkr or 0) +
        float(booking.total_ziyarat_amount_pkr or 0)
    )
    
    # Direct SQL update
    with connection.cursor() as cursor:
        cursor.execute("""
            UPDATE booking_booking
            SET total_visa_amount = %s,
                total_visa_amount_pkr = %s,
                visa_rate = %s,
                visa_rate_in_pkr = %s,
                total_ticket_amount = %s,
                total_ticket_amount_pkr = %s,
                total_amount = %s,
                total_in_pkr = %s,
                pending_payment = %s
            WHERE id = %s
        """, [
            total_visa, total_visa, total_visa, total_visa,
            total_ticket, total_ticket,
            total_amount, total_amount, total_amount,
            booking.id
        ])
    
    print(f"  ✅ Updated via SQL:")
    print(f"     Visa: {total_visa:,} PKR")
    print(f"     Ticket: {total_ticket:,} PKR")
    print(f"     Total: {total_amount:,} PKR")
    
    # Verify
    booking.refresh_from_db()
    print(f"  ✓ Verified: Visa={booking.total_visa_amount:,}, Ticket={booking.total_ticket_amount:,}")

print(f"\n{'='*80}")
print("✅ ALL BOOKINGS UPDATED VIA SQL!")
print(f"{'='*80}")
