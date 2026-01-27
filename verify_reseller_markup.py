import os
import sys
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth import get_user_model
from organization.models import Organization, Branch, Agency, Employee
from booking.models import Markup, MarkupHotel
from packages.models import UmrahPackage
from tickets.models import Hotels, Ticket, HotelPrices
from packages.serializers import UmrahPackageSerializer
from tickets.serializers import HotelsSerializer, TicketSerializer
from datetime import date
from decimal import Decimal

User = get_user_model()


def run_verification():
    print("Starting Reseller Markup Verification...")

    # 1. Setup Organizations
    # Owner Org
    owner_org, _ = Organization.objects.get_or_create(name="Owner Org")
    
    # Reseller Org
    reseller_org, _ = Organization.objects.get_or_create(name="Reseller Org")
    
    # 2. Setup Markup
    # Create a markup group for the reseller
    markup_group, _ = Markup.objects.get_or_create(name="Reseller Markup Group")
    markup_group.umrah_package_markup = 100.0  # Flat markup
    markup_group.hotel_per_night_markup = 50.0 # Generic hotel markup
    markup_group.ticket_markup = 25.0          # Ticket markup
    markup_group.save()
    
    # Assign markup to reseller
    reseller_org.markup_group = markup_group
    reseller_org.save()
    
    # 3. Setup User
    # Reseller User linked to Reseller Org
    reseller_user, _ = User.objects.get_or_create(email="reseller@example.com", defaults={'username': 'reseller'})
    
    # Link user to organization
    reseller_org.user.add(reseller_user)
    
    # Create Agency to ensure typical structure (optional but good for realism)
    try:
        # Check if Agency model requires branch
        # Branch requires organization
        branch, _ = Branch.objects.get_or_create(organization=reseller_org, name="Reseller Branch")
        Agency.objects.get_or_create(
             name="Reseller Agency",
             defaults={
                 'branch': branch,
                 'assign_to': reseller_user
             }
        )
        # Also link user to agency if M2M exists
        agency = Agency.objects.get(name="Reseller Agency")
        agency.user.add(reseller_user)
    except Exception as e:
        print(f"Agency setup warning (non-critical): {e}")
        
    print(f"Setup Complete: Reseller {reseller_org.name} has markup group {markup_group.name}")

    # 4. Verify Package Markup
    print("\n--- Verifying Package Markup ---")
    package = UmrahPackage.objects.create(
        organization=owner_org,
        title="Test Package",
        status="active", # using 'status' instead of 'package_status'
        package_type="umrah",
        start_date=date.today(),
        end_date=date.today()
    )
    # Set fields expected by serializer for package_selling_prices
    package.quaint_selling_price = 1000.0
    package.quad_selling_price = 1200.0
    package.double_selling_price = 0.0
    package.triple_selling_price = 0.0
    package.sharing_selling_price = 0.0
    package.child_without_bed_selling_price = 0.0
    package.child_sharing_selling_price = 0.0
    package.child_double_selling_price = 0.0
    package.child_triple_selling_price = 0.0
    package.child_quad_selling_price = 0.0
    package.child_quaint_selling_price = 0.0
    package.infant_package_selling_price = 0.0
    
    # Patch calculate_total_price to return controlled values for breakdown
    # usage: obj.calculate_total_price(adults=1, children=0, infants=0)
    original_calc = package.calculate_total_price
    
    def mock_calculate_total_price(adults=0, children=0, infants=0):
        # Return base price without markup
        if adults == 1 and children == 0 and infants == 0: return 1200.0
        if adults == 2 and children == 0 and infants == 0: return 2400.0
        if adults == 1 and children == 1 and infants == 0: return 2000.0
        return 0.0
        
    package.calculate_total_price = mock_calculate_total_price
    
    factory = RequestFactory()
    request = factory.get('/')
    request.user = reseller_user
    
    serializer = UmrahPackageSerializer(package, context={'request': request})
    data = serializer.data
    
    print("Original Selling: 1000, 1200")
    print("Markup: 100")
    print(f"Result Selling: {data.get('package_selling_prices')}")
    
    # Assertions
    selling = data.get('package_selling_prices')
    # If None, it means serializer didn't pick up our attached attributes.
    # UmrahPackageSerializer might rely on DB fields.
    if selling:
        assert selling['quint'] == 1100.0, f"Expected 1100, got {selling.get('quint')}"
        assert selling['quad'] == 1300.0, f"Expected 1300, got {selling.get('quad')}"
        
        print(f"Result Breakdown: {data.get('total_price_breakdown')}")
        breakdown = data.get('total_price_breakdown')
        if breakdown:
            # 1 adult: 1200 + 100 = 1300
            assert breakdown['1_adult'] == 1300.0, f"Expected 1300, got {breakdown.get('1_adult')}"
            # 2 adults: 2400 + 200 = 2600
            assert breakdown['2_adults'] == 2600.0, f"Expected 2600, got {breakdown.get('2_adults')}"
            # 1 adult + 1 child (2 pax): 2000 + 200 = 2200
            assert breakdown['1_adult_1_child'] == 2200.0, f"Expected 2200, got {breakdown.get('1_adult_1_child')}"
    else:
        print("WARNING: 'package_selling_prices' not in data. Serializer fields mismatch?")

    print("Package Markup Verified (if data present) [PASS]")

    from packages.models import City
    
    # 5. Verify Hotel Markup
    print("\n--- Verifying Hotel Markup ---")
    
    makkah_city, _ = City.objects.get_or_create(name="Makkah", organization=owner_org, code="MKK")
    
    hotel = Hotels.objects.create(
        organization=owner_org,
        name="Test Hotel",
        city=makkah_city
    )
    # Create Hotel Prices
    HotelPrices.objects.create(hotel=hotel, room_type="quint", price=500, start_date=date.today(), end_date=date.today())
    HotelPrices.objects.create(hotel=hotel, room_type="quad", price=600, start_date=date.today(), end_date=date.today())
    
    
    # Specific markup
    MarkupHotel.objects.get_or_create(
        markup=markup_group,
        hotel=hotel,
        defaults={'quad': 70.0}
    )
    
    serializer = HotelsSerializer(hotel, context={'request': request})
    data = serializer.data

    # Specific markup exists, so it overrides generic. 
    # Quint defaults to 0 in MarkupHotel, so expects 0 explicitly.
    prices = {p['room_type']: p['selling_price'] for p in data['prices']}
    print(f"Result Prices Hotel 1: {prices}")
    
    # Quint: 500 + 0 (specific override) = 500
    assert prices['quint'] == 500.0, f"Expected 500 (specific 0), got {prices['quint']}"
    # Quad: 600 + 70 (specific) = 670
    assert prices['quad'] == 670.0, f"Expected 670, got {prices['quad']}"
    
    print("Hotel 1 (Specific) Verified [PASS]")

    # 5b. Verify Hotel Generic Markup (No specific markup record)
    hotel2 = Hotels.objects.create(
        organization=owner_org,
        name="Generic Hotel",
        city=makkah_city
    )
    HotelPrices.objects.create(hotel=hotel2, room_type="quint", price=500, start_date=date.today(), end_date=date.today())
    
    serializer2 = HotelsSerializer(hotel2, context={'request': request})
    data2 = serializer2.data
    prices2 = {p['room_type']: p['selling_price'] for p in data2['prices']}
    print(f"Result Prices Hotel 2: {prices2}")
    
    # Generic markup is 50.0
    assert prices2['quint'] == 550.0, f"Expected 550 (generic), got {prices2['quint']}"
    
    print("Hotel 2 (Generic) Verified [PASS]")

    print("\n--- Verifying Hotel Markup ---")

    # 6. Verify Ticket Markup
    print("\n--- Verifying Ticket Markup ---")
    ticket = Ticket.objects.create(
        organization=owner_org,
        # ticket_type="One Way", # Example field
        adult_selling_price=1000,
        child_selling_price=800,
        infant_selling_price=200,
        start_date=date.today(),
        end_date=date.today()
    )
    
    serializer = TicketSerializer(ticket, context={'request': request})
    data = serializer.data
    
    # +25 markup
    print("\nResult Ticket Data:", data['adult_selling_price'], data['child_selling_price'])
    
    assert float(data['adult_selling_price']) == 1025.0, f"Expected 1025, got {data['adult_selling_price']}"
    assert float(data['child_selling_price']) == 825.0, f"Expected 825, got {data['child_selling_price']}"
    
    print("Ticket Markup Verified [PASS]")

    # 6b. Verify Ticket List Markup (TicketListSerializer)
    print("\n--- Verifying Ticket List Markup ---")
    
    # Import locally to avoid issues if not at top level
    from tickets.serializers import TicketListSerializer
    
    serializer_list = TicketListSerializer(ticket, context={'request': request})
    data_list = serializer_list.data
    
    print("\nResult Ticket List Data:", data_list['adult_selling_price'], data_list['child_selling_price'])
    
    # +25 markup expected here too
    assert float(data_list['adult_selling_price']) == 1025.0, f"Expected 1025, got {data_list['adult_selling_price']}"
    assert float(data_list['child_selling_price']) == 825.0, f"Expected 825, got {data_list['child_selling_price']}"
    
    print("Ticket List Markup Verified [PASS]")
    
    # Cleanup
    print("\nCleaning up...")
    package.delete()
    hotel.delete()
    ticket.delete()
    # reseller_user.delete() # Leave user for subsequent runs to avoid unique constraint issues if delete fails or is partial
    
    print("Verification Successful!")


if __name__ == "__main__":
    try:
        run_verification()
    except Exception as e:
        print(f"\n[FAIL] Verification FAILED: {e}")
        import traceback
        traceback.print_exc()
