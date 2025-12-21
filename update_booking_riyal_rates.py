import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking, BookingTransportDetails, BookingPersonDetail
from packages.models import RiyalRate

# Get booking 210
booking = Booking.objects.get(id=210)
print(f"Found booking: {booking.id}")

# Get the riyal rate for the organization
try:
    riyal_rate = RiyalRate.objects.filter(organization=booking.organization).first()
    if riyal_rate:
        print(f"Found riyal rate: {riyal_rate.rate}")
        
        # Update transport details
        transport_details = booking.transport_details.all()
        print(f"\nUpdating {transport_details.count()} transport details...")
        for transport in transport_details:
            transport.riyal_rate = riyal_rate.rate
            transport.save()
            print(f"  ✅ Updated transport {transport.id}: riyal_rate = {riyal_rate.rate}")
        
        # Update person details (visa, food, ziarat)
        person_details = booking.person_details.all()
        print(f"\nUpdating {person_details.count()} person details...")
        for person in person_details:
            # Update visa riyal rate
            person.visa_riyal_rate = riyal_rate.rate
            person.save()
            print(f"  ✅ Updated person {person.id}: visa_riyal_rate = {riyal_rate.rate}")
            
            # Update ziarat details
            ziarat_count = person.ziyarat_details.update(riyal_rate=riyal_rate.rate)
            if ziarat_count > 0:
                print(f"    ✅ Updated {ziarat_count} ziarat details")
            
            # Update food details
            food_count = person.food_details.update(riyal_rate=riyal_rate.rate)
            if food_count > 0:
                print(f"    ✅ Updated {food_count} food details")
        
        print("\n✅ Done updating booking 210 with riyal rates!")
    else:
        print("❌ No riyal rate found for this organization")
        
except Exception as e:
    print(f"❌ Error: {e}")
