"""
Create BookingTicketDetails for bookings that don't have them.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking, BookingTicketDetails

print("=" * 60)
print("CREATING BOOKING TICKET DETAILS")
print("=" * 60)

# Get bookings without ticket_details
bookings = Booking.objects.filter(status__in=['Delivered', 'Approved'])

for booking in bookings:
    print(f"\n📦 Booking: {booking.booking_number}")
    
    # Check if booking already has ticket_details
    if booking.ticket_details.exists():
        print(f"   ✅ Already has {booking.ticket_details.count()} ticket details")
        continue
    
    # Check if booking has umrah_package with tickets
    if not booking.umrah_package:
        print("   ⚠️  No umrah_package found")
        continue
    
    package = booking.umrah_package
    package_tickets = package.ticket_details.all()
    
    if not package_tickets.exists():
        print("   ⚠️  Package has no ticket details")
        continue
    
    # Get the first ticket from package
    package_ticket_detail = package_tickets.first()
    ticket = package_ticket_detail.ticket
    
    print(f"   📋 Found package ticket: {ticket.ticket_number}")
    
    # Create BookingTicketDetails with minimal required fields
    booking_ticket = BookingTicketDetails.objects.create(
        booking=booking,
        ticket=ticket,
        pnr=f"PNR{booking.booking_number[-4:]}",
        trip_type="Round Trip",
        departure_stay_type="Direct",
        return_stay_type="Direct",
        seats=booking.total_pax,
        adult_price=0,
        child_price=0,
        infant_price=0,
        is_meal_included=False,
        is_refundable=False,
        weight=23,
        pieces=1,
        is_umrah_seat=True,
        status="Confirmed"
    )
    
    print(f"   ✅ Created BookingTicketDetails with PNR: {booking_ticket.pnr}")

print("\n" + "=" * 60)
print("✅ Booking ticket details created!")
print("Now refresh the Pax Movement page - passengers should have flight data!")
