from packages.models import UmrahPackageTransportDetails
from booking.models import Sector

# Find all transport details using org 8 sectors
transport_details = UmrahPackageTransportDetails.objects.filter(transport_sector__organization_id=8)

print(f"\n{'='*60}")
print(f"Found {transport_details.count()} transport details using org 8 sectors")
print(f"{'='*60}\n")

for td in transport_details[:20]:
    package_code = td.package.package_code if td.package else "None"
    sector_id = td.transport_sector_id
    sector = td.transport_sector
    sector_route = f"{sector.departure_city} → {sector.arrival_city}" if sector else "Unknown"
    
    print(f"Package: {package_code}")
    print(f"  Sector ID: {sector_id} ({sector_route})")
    print()
