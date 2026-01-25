import os
import django
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage, UmrahPackageHotelDetails, UmrahPackageTransportDetails
from tickets.models import Hotels
from booking.models import VehicleType

def test_calc():
    print("--- START DEBUG PRICE CALCULATION ---")
    # 1. Create Package
    # set admin/superuser as created_by if needed, or None
    pkg = UmrahPackage.objects.create(
        title="Debug Price Auto", 
        adault_visa_selling_price=100.0,
        organization_id=11 # Assuming org 11 exists
    )
    print(f"Created Package {pkg.id}")

    # 2. Add Hotel Detail
    hotel = Hotels.objects.first()
    if not hotel:
        print("ERROR: No hotels found in DB!")
        return

    hd = UmrahPackageHotelDetails.objects.create(
        package=pkg,
        hotel=hotel,
        number_of_nights=5,
        sharing_bed_selling_price=50.0, # 50*5 = 250
        double_bed_selling_price=100.0,  # 100*5 = 500
        quaint_bed_selling_price=10.0
    )
    print(f"Created Hotel Detail {hd.id} with prices: Sharing=50*5, Double=100*5")

    # 3. Add Transport Detail
    vt = VehicleType.objects.first()
    td = UmrahPackageTransportDetails.objects.create(
        package=pkg,
        transport_sector=vt,
        transport_selling_price=500.0
    )
    print(f"Created Transport Detail {td.id} with price 500")

    # 4. Trigger Calculation
    print("Triggering calculate_and_save_prices()...")
    pkg.calculate_and_save_prices()
    
    # 5. Check Result
    pkg.refresh_from_db()
    print(f"Sharing Price: {pkg.sharing_selling_price} (Expect 250(Hotel) + 500(Trans) + 100(Visa) = 850)")
    print(f"Double Price: {pkg.double_selling_price} (Expect 500(Hotel) + 500(Trans) + 100(Visa) = 1100)")
    print(f"Quint Price: {pkg.quaint_selling_price} (Expect 50(Hotel) + 500 + 100 = 650)")

if __name__ == "__main__":
    test_calc()
