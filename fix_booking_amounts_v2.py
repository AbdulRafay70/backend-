"""
Properly update booking visa and ticket amounts with fresh objects.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking, BookingPersonDetail
from organization.models import Organization

org = Organization.objects.get(id=11)

print("="*80)
print("UPDATING BOOKING VISA AND TICKET AMOUNTS (FIXED)")
print("="*80)

bookings = Booking.objects.filter(organization=org).order_by('-id')[:6]
print(f"\nFound {bookings.count()} bookings")

for booking in bookings:
    # Refresh from database
    booking.refresh_from_db()
    
    print(f"\n{'='*80}")
    print(f"Booking #{booking.id} - {booking.booking_number}")
    
    # Get passengers
    passengers = BookingPersonDetail.objects.filter(booking=booking)
    
    # Calculate visa amounts from passengers
    total_visa = float(sum(p.visa_price for p in passengers if p.visa_price))
    
    # Calculate ticket amounts from passengers  
    total_ticket = float(sum(p.ticket_price for p in passengers if p.ticket_price))
    
    print(f"  Calculated: Visa={total_visa:,}, Ticket={total_ticket:,}")
    
    # Update ALL visa fields
    booking.total_visa_amount = total_visa
    booking.total_visa_amount_pkr = total_visa
    booking.visa_rate = total_visa
    booking.visa_rate_in_pkr = total_visa
    
    # Update ALL ticket fields
    booking.total_ticket_amount = total_ticket
    booking.total_ticket_amount_pkr = total_ticket
    
    # Recalculate total
    booking.total_amount = (
        total_visa +
        total_ticket +
        float(booking.total_hotel_amount or 0) +
        float(booking.total_transport_amount or 0) +
        float(booking.total_food_amount_pkr or 0) +
        float(booking.total_ziyarat_amount_pkr or 0)
    )
    booking.total_in_pkr = booking.total_amount
    booking.pending_payment = booking.total_amount - float(booking.paid_payment or 0)
    
    # Save with update_fields to be explicit
    booking.save(update_fields=[
        'total_visa_amount', 'total_visa_amount_pkr', 'visa_rate', 'visa_rate_in_pkr',
        'total_ticket_amount', 'total_ticket_amount_pkr',
        'total_amount', 'total_in_pkr', 'pending_payment'
    ])
    
    # Verify
    booking.refresh_from_db()
    print(f"  ✅ Saved: Visa={booking.total_visa_amount:,}, Ticket={booking.total_ticket_amount:,}")
    print(f"  Total: {booking.total_amount:,} PKR")

print(f"\n{'='*80}")
print("✅ ALL BOOKINGS UPDATED AND VERIFIED!")
print(f"{'='*80}")
