"""
Fix booking visa and ticket amounts to display properly in invoice.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking, BookingPersonDetail
from organization.models import Organization

org = Organization.objects.get(id=11)

print("="*80)
print("FIXING BOOKING VISA AND TICKET AMOUNTS")
print("="*80)

bookings = Booking.objects.filter(organization=org).order_by('-id')[:6]
print(f"\nFound {bookings.count()} bookings")

for booking in bookings:
    print(f"\n{'='*80}")
    print(f"Booking #{booking.id} - {booking.booking_number}")
    
    # Get passengers
    passengers = BookingPersonDetail.objects.filter(booking=booking)
    
    # Calculate visa amounts from passengers
    total_visa = sum(p.visa_price for p in passengers if p.visa_price)
    
    # Calculate ticket amounts from passengers
    total_ticket = sum(p.ticket_price for p in passengers if p.ticket_price)
    
    # Update booking
    booking.total_visa_amount = total_visa
    booking.total_visa_amount_pkr = total_visa
    booking.total_ticket_amount = total_ticket
    booking.total_ticket_amount_pkr = total_ticket
    
    # Recalculate total
    booking.total_amount = (
        total_visa +
        total_ticket +
        (booking.total_hotel_amount or 0) +
        (booking.total_transport_amount or 0) +
        (booking.total_food_amount_pkr or 0) +
        (booking.total_ziyarat_amount_pkr or 0)
    )
    booking.total_in_pkr = booking.total_amount
    booking.pending_payment = booking.total_amount - (booking.paid_payment or 0)
    
    booking.save()
    
    print(f"  ✅ Updated amounts:")
    print(f"     Visa: {total_visa:,} PKR ({passengers.count()} passengers)")
    print(f"     Ticket: {total_ticket:,} PKR")
    print(f"     Hotel: {booking.total_hotel_amount:,} PKR")
    print(f"     Transport: {booking.total_transport_amount:,} PKR")
    print(f"     Food: {booking.total_food_amount_pkr:,} PKR")
    print(f"     Ziyarat: {booking.total_ziyarat_amount_pkr:,} PKR")
    print(f"     TOTAL: {booking.total_amount:,} PKR")

print(f"\n{'='*80}")
print("✅ ALL BOOKINGS UPDATED!")
print(f"{'='*80}")

# Summary
print("\n📋 FINAL BOOKING SUMMARY:")
for booking in bookings:
    passengers = BookingPersonDetail.objects.filter(booking=booking)
    print(f"\nBooking #{booking.id} ({booking.booking_number}):")
    print(f"  Status: {booking.status}")
    print(f"  Passengers: {booking.total_adult}A + {booking.total_child}C + {booking.total_infant}I")
    print(f"  Visa: {booking.total_visa_amount:,} PKR")
    print(f"  Ticket: {booking.total_ticket_amount:,} PKR")
    print(f"  Total: {booking.total_amount:,} PKR")
    print(f"  Passenger Details:")
    for p in passengers:
        print(f"    - {p.first_name} {p.last_name} ({p.age_group}): Visa {p.visa_price:,}, Ticket {p.ticket_price:,}")
