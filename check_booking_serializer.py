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
    
    # 1. Check ticket_details
    if 'ticket_details' in data and data['ticket_details']:
        td = data['ticket_details'][0]
        print(f"\n✅ ticket_details found. Keys: {list(td.keys())}")
        
        if 'ticket' in td:
            ticket_val = td['ticket']
            if isinstance(ticket_val, dict):
                print(f"  ✅ 'ticket' field is a DICT (Full Object): {list(ticket_val.keys())}")
                if 'flight_number' in ticket_val:
                    print(f"    Flight: {ticket_val['flight_number']}")
                if 'trip_details' in ticket_val:
                     print(f"    Trip Details Count: {len(ticket_val['trip_details'])}")
            elif ticket_val is None:
                print(f"  ⚠️ 'ticket' field is None (might be expected if no ticket linked)")
            else:
                print(f"  ❌ 'ticket' field is NOT a dict. Type: {type(ticket_val)}")
        else:
            print(f"  ❌ 'ticket' field MISSING in ticket_details")
    else:
        print(f"\n⚠️ No ticket_details in this booking")

    # 2. Check person_details (should NOT have ticket)
    if 'person_details' in data and data['person_details']:
        pd = data['person_details'][0]
        print(f"\n👤 Person Details found. Keys: {list(pd.keys())}")
        
        if 'ticket' not in pd:
            print(f"  ✅ 'ticket' field successfully REMOVED from person_details")
        else:
            print(f"  ❌ 'ticket' field STILL PRESENT in person_details")
    else:
        print(f"\n⚠️ No person_details in this booking")
print(f"\n{'='*80}")
