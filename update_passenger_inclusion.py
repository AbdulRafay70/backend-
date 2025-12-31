"""
Update passenger details to show visa and ticket inclusion status.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking, BookingPersonDetail
from organization.models import Organization

org = Organization.objects.get(id=11)

print("="*80)
print("UPDATING PASSENGER VISA AND TICKET INCLUSION STATUS")
print("="*80)

# Get all bookings
bookings = Booking.objects.filter(organization=org).order_by('-id')[:6]
print(f"\nFound {bookings.count()} bookings")

total_updated = 0

for booking in bookings:
    print(f"\n{'='*80}")
    print(f"Booking #{booking.id} - {booking.booking_number}")
    print(f"  Status: {booking.status}")
    
    # Get all passengers for this booking
    passengers = BookingPersonDetail.objects.filter(booking=booking)
    print(f"  Passengers: {passengers.count()}")
    
    for passenger in passengers:
        # Update visa and ticket inclusion
        passenger.is_visa_included = True
        passenger.ticket_included = True
        
        # Set visa price based on age group
        if passenger.age_group == 'adult':
            passenger.visa_price = booking.umrah_package.adault_visa_selling_price if booking.umrah_package else 25000
        elif passenger.age_group == 'child':
            passenger.visa_price = booking.umrah_package.child_visa_selling_price if booking.umrah_package else 15000
        else:  # infant
            passenger.visa_price = booking.umrah_package.infant_visa_selling_price if booking.umrah_package else 5000
        
        # Set ticket price (placeholder)
        if passenger.age_group == 'adult':
            passenger.ticket_price = 50000
        elif passenger.age_group == 'child':
            passenger.ticket_price = 30000
        else:  # infant
            passenger.ticket_price = 10000
        
        passenger.save()
        total_updated += 1
    
    print(f"  ✅ Updated {passengers.count()} passengers")

print(f"\n{'='*80}")
print(f"✅ UPDATED {total_updated} PASSENGERS!")
print(f"{'='*80}")

# Show summary
print("\n📋 PASSENGER SUMMARY:")
for booking in bookings:
    passengers = BookingPersonDetail.objects.filter(booking=booking)
    print(f"\nBooking #{booking.id} ({booking.booking_number}):")
    print(f"  Status: {booking.status}")
    for p in passengers:
        print(f"    - {p.first_name} {p.last_name} ({p.age_group})")
        print(f"      Visa: {'✅ Included' if p.is_visa_included else '❌ Not Included'} - {p.visa_price:,} PKR")
        print(f"      Ticket: {'✅ Included' if p.ticket_included else '❌ Not Included'} - {p.ticket_price:,} PKR")
