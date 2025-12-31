"""
Check what the booking API serializer is returning for ticket details.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from booking.serializers import BookingSerializer
from organization.models import Organization

org = Organization.objects.get(id=11)

print("="*80)
print("CHECKING BOOKING API SERIALIZER OUTPUT")
print("="*80)

# Get one booking
booking = Booking.objects.filter(organization=org, umrah_package__isnull=False).order_by('-id').first()

if booking:
    print(f"\n📦 Booking: {booking.booking_number}")
    print(f"Package: {booking.umrah_package.title}")
    
    # Serialize it
    serializer = BookingSerializer(booking)
    data = serializer.data
    
    print(f"\n📋 Serialized Data Keys:")
    print(f"  - umrah_package exists: {'umrah_package' in data}")
    
    if 'umrah_package' in data and data['umrah_package']:
        pkg = data['umrah_package']
        print(f"\n  Package Keys: {list(pkg.keys())}")
        
        if 'ticket_details' in pkg:
            print(f"\n  ✅ ticket_details in package: {len(pkg['ticket_details'])} items")
            
            if len(pkg['ticket_details']) > 0:
                td = pkg['ticket_details'][0]
                print(f"\n  First ticket_detail keys: {list(td.keys())}")
                
                if 'ticket' in td:
                    ticket = td['ticket']
                    print(f"\n  Ticket keys: {list(ticket.keys())}")
                    
                    if 'trip_details' in ticket:
                        print(f"\n  ✅ trip_details in ticket: {len(ticket['trip_details'])} items")
                        
                        if len(ticket['trip_details']) > 0:
                            trip = ticket['trip_details'][0]
                            print(f"\n  First trip keys: {list(trip.keys())}")
                            print(f"  Trip type: {trip.get('trip_type')}")
                            print(f"  Flight: {trip.get('flight_number')}")
                    else:
                        print(f"\n  ❌ NO trip_details in ticket")
                else:
                    print(f"\n  ❌ NO ticket in ticket_detail")
        else:
            print(f"\n  ❌ NO ticket_details in package")

print(f"\n{'='*80}")
