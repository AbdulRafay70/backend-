 import os
import django
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage, UmrahPackageHotelDetails, UmrahPackageTransportDetails, UmrahPackageTicketDetails
from tickets.models import Hotels, Ticket
from booking.models import VehicleType

def test_full_calc():
    print("--- START FULL CALCULATION TEST ---")
    
    # 1. Create Package with Extras
    # Visa = 100
    # Food = 50
    # Ziyarat (Makkah+Madinah) = 30 + 30 = 60
    # Total Extras (Pre-Ticket/Transport) = 210
    pkg = UmrahPackage.objects.create(
        title="Full Calc Auto", 
        adault_visa_selling_price=100.0,
        food_selling_price=50.0,
        makkah_ziyarat_selling_price=30.0,
        madinah_ziyarat_selling_price=30.0,
        organization_id=11
    )
    print(f"Created Package {pkg.id}. Base Extras (Visa+Food+Ziyarat) = 210.")

    # 2. Add Hotel Detail
    # 50 * 5 = 250
    hotel = Hotels.objects.first()
    if hotel:
        UmrahPackageHotelDetails.objects.create(
            package=pkg, hotel=hotel, number_of_nights=5,
            sharing_bed_selling_price=50.0 # 250 Total
        )
        print("Added Hotel: 50 * 5 = 250")

    # 3. Add Transport Detail
    # 500
    vt = VehicleType.objects.first()
    if vt:
        UmrahPackageTransportDetails.objects.create(
            package=pkg, transport_sector=vt, transport_selling_price=500.0
        )
        print("Added Transport: 500")

    # 4. Add Ticket Detail
    # Ticket = 1000
    # Removed invalid fields, using only known fields
    ticket = Ticket.objects.create(
        flight_type="Round Trip", 
        airline_name="Test Air", 
        adult_price=1000.0, 
        organization_id=11
    )
    UmrahPackageTicketDetails.objects.create(package=pkg, ticket=ticket)
    print("Added Ticket: 1000")

    # EXPECTED TOTAL for Sharing:
    # Hotel (250) + Transport (500) + Extras (210) + Ticket (1000) = 1960
    
    # 5. Trigger Calculation
    pkg.calculate_and_save_prices()
    
    # 6. Check Result
    pkg.refresh_from_db()
    
    print(f"CALCULATED SHARING PRICE: {pkg.sharing_selling_price}")
    
    expected = 250 + 500 + 210 + 1000
    if pkg.sharing_selling_price == expected:
        print(f"SUCCESS: Match Expected ({expected})")
    else:
        print(f"FAILURE: Expected {expected}, Got {pkg.sharing_selling_price}")
    
    # Cleanup 
    # UmrahPackage.objects.all().delete() # Can uncomment if user wants immediate cleanup

if __name__ == "__main__":
    test_full_calc()
