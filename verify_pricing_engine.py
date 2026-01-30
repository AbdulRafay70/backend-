
import os
import django
import sys
from decimal import Decimal

# Setup Django Environment
sys.path.append('d:\\Saerpk\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import User
from organization.models import Organization, Branch, Agency
from booking.models import Markup, DiscountGroup, Discount, AllowedReseller, OrganizationLink as BookingOrgLink
from packages.models import UmrahPackage
from tickets.models import Hotels
from organization.pricing_utils import calculate_final_price

def run_tests():
    print("Starting Pricing Engine Verification...\n")
    
    # --- SETUP ---
    # 1. Create Owner & Reseller Orgs
    owner_org, _ = Organization.objects.get_or_create(name="Owner Org Inc", defaults={})
    reseller_org, _ = Organization.objects.get_or_create(name="Reseller Agency", defaults={})
    
    # 2. Assign Markup to Reseller (Reseller Controls Markup)
    # Markup uses organization_id (Integer) NOT ForeignKey
    markup_group, _ = Markup.objects.get_or_create(
        organization_id=reseller_org.id, 
        name="Standard Reseller Markup",
        defaults={
            'applies_to': 'umrah_package',
            'umrah_package_markup': 500, # +500 Markup
            'ticket_markup': 100,
            'hotel_per_night_markup': 50
        }
    )
    # Ensure values are correct (in case it existed)
    markup_group.umrah_package_markup = 500
    markup_group.ticket_markup = 100
    markup_group.hotel_per_night_markup = 50
    markup_group.save()
    reseller_org.markup_group = markup_group
    reseller_org.save()

    # 3. Create Discount Group (Owner Controls Discount)
    discount_group, _ = DiscountGroup.objects.get_or_create(
        organization=owner_org,
        name="Owner B2B Discount",
        defaults={'is_active': True}
    )
    
    # Create distinct discount Rules
    # Package Discount
    Discount.objects.get_or_create(
        discount_group=discount_group,
        things='umrah_package',
        defaults={
            'umrah_package_discount_amount': 200,
            'organization': owner_org  # Required field
        } 
    )
    # Update to ensure
    d_pkg = Discount.objects.get(discount_group=discount_group, things='umrah_package')
    d_pkg.umrah_package_discount_amount = 200
    d_pkg.save()

    # 4. Link Reseller to Owner via AllowedReseller (with Discount Group)
    # AllowedReseller links to BookingOrgLink (wrapper around org_id)
    
    # Check if a BookingOrgLink exists for this owner
    booking_link = BookingOrgLink.objects.filter(organization_id=owner_org.id).first()
    if not booking_link:
        booking_link = BookingOrgLink.objects.create(organization_id=owner_org.id)
        
    allowed_reseller, created = AllowedReseller.objects.get_or_create(
        inventory_owner_company=booking_link,
        reseller_company=reseller_org,
        defaults={
            'requested_status_by_reseller': 'ACCEPTED',
            'discount_group': discount_group
        }
    )
    allowed_reseller.requested_status_by_reseller = 'ACCEPTED'
    allowed_reseller.discount_group = discount_group
    allowed_reseller.save()

    # 5. Create Dummy Request Objects
    class MockUser:
        is_authenticated = True
        agencies = Agency.objects.filter(branch__organization=reseller_org)
        organizations = Organization.objects.filter(id=reseller_org.id)
    
    class MockRequest:
        user = MockUser()
    
    req = MockRequest()
    
    # --- TESTS ---
    
    # TEST 1: Umrah Package (Markup - Discount)
    # Base: 1000
    # Markup: +500
    # Discount: -200
    # Expected: 1300
    
    print("Test 1: Umrah Package Pricing...")
    
    pkg = UmrahPackage.objects.create(
        organization=owner_org,
        title="Test Pricing Pkg",
        sharing_selling_price=1000,
        sharing_purchase_price=800,
        reselling_allowed=True,
        inventory_owner_organization_id=owner_org.id
    )
    
    data = {
        'package_selling_prices': {
            'sharing': 1000,
            'double': 2000
        },
        'package_purchase_prices': { # Should NOT change
            'sharing': 800
        }
    }
    
    final_data = calculate_final_price(req, data, 'package', pkg)
    
    final_sharing = final_data['package_selling_prices']['sharing']
    final_purchase = final_data['package_purchase_prices']['sharing']
    
    print(f"   Base: 1000, Markup: +500, Discount: -200 -> Expected: 1300")
    print(f"   Result: {final_sharing}")
    
    if final_sharing == 1300:
        print("   SUCCESS")
    else:
        print(f"   FAILED (Got {final_sharing})")
        sys.exit(1)
        
    if final_purchase == 800:
        print("   Purchase Price Preserved")
    else:
        print("   Purchase Price Modified!")
        sys.exit(1)

    # TEST 2: Ownership Check (Malicious/Wrong Discount Group)
    print("\nTest 2: Discount Ownership Security...")
    
    # Reset Data
    data = {
        'package_selling_prices': {
            'sharing': 1000,
            'double': 2000
        },
        'package_purchase_prices': {
            'sharing': 800
        }
    }
    
    # Create a discount group owned by Reseller (Should be ignored)
    fake_discount_group = DiscountGroup.objects.create(
        organization=reseller_org, # Wrong owner
        name="Hacker Discount"
    )
    allowed_reseller.discount_group = fake_discount_group
    allowed_reseller.save()
    
    # Re-run pipeline
    final_data_2 = calculate_final_price(req, data, 'package', pkg)
    final_sharing_2 = final_data_2['package_selling_prices']['sharing']
    
    print(f"   Discount owned by Reseller (Should be ignored). Expected: 1500")
    print(f"   Result: {final_sharing_2}")
    
    if final_sharing_2 == 1500:
        print("   SECURITY CHECK PASSED")
    else:
        print(f"   SECURITY CHECK FAILED (Got {final_sharing_2})")
        sys.exit(1)
        
    # Restore valid discount
    allowed_reseller.discount_group = discount_group
    allowed_reseller.save()

    # TEST 3: Reselling Not Allowed
    print("\nTest 3: Reselling Forbidden...")
    
    # Reset Data
    data = {
        'package_selling_prices': {
            'sharing': 1000,
            'double': 2000
        },
        'package_purchase_prices': {
            'sharing': 800
        }
    }
    
    pkg.reselling_allowed = False
    pkg.save()
    
    # Expected: Base Prices returned (or handled as restricted).
    # Pipeline currently returns DATA untouched.
    final_data_3 = calculate_final_price(req, data, 'package', pkg)
    final_sharing_3 = final_data_3['package_selling_prices']['sharing']
    
    print(f"   Reselling disabled. Expected: 1000 (Base Price)")
    print(f"   Result: {final_sharing_3}")
    
    if final_sharing_3 == 1000:
        print("   PERMISSION CHECK PASSED")
    else:
        print(f"   FAILED (Got {final_sharing_3})")
        sys.exit(1)

    # Cleanup
    pkg.delete()
    print("\nVerification Complete")

if __name__ == "__main__":
    run_tests()
