import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking, BookingTransportDetails, BookingTransportSector, Sector

# Get booking 210
booking = Booking.objects.get(id=210)
print(f"Found booking: {booking.id}")

# Get transport details
transport_details = booking.transport_details.all()
print(f"Found {transport_details.count()} transport details")

for transport in transport_details:
    print(f"\nProcessing transport detail ID: {transport.id}")
    
    # Get sector details
    sector_details = transport.sector_details.all()
    print(f"Found {sector_details.count()} sector details")
    
    for sector_detail in sector_details:
        print(f"  Sector {sector_detail.sector_no}: small_sector_id={sector_detail.small_sector_id}")
        
        # Get the actual small sector from database
        try:
            small_sector = Sector.objects.get(id=sector_detail.small_sector_id)
            
            # Update the sector detail with sector type info
            sector_detail.sector_type = small_sector.sector_type
            sector_detail.is_airport_pickup = small_sector.is_airport_pickup
            sector_detail.is_airport_drop = small_sector.is_airport_drop
            sector_detail.is_hotel_to_hotel = small_sector.is_hotel_to_hotel
            sector_detail.save()
            
            print(f"  ✅ Updated: {small_sector.sector_type}")
            
        except Sector.DoesNotExist:
            print(f"  ❌ Small sector {sector_detail.small_sector_id} not found")

print("\n✅ Done updating booking 210!")
