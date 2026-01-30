
import os
import django
import sys

# Setup Django Environment
sys.path.append('d:\\Saerpk\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from organization.models import Organization, OrganizationLink
from booking.models import AllowedReseller, DiscountGroup
from tickets.models import Hotels
from packages.models import UmrahPackage

def inspect_discount_setup(reseller_id=8, owner_id=11):
    print(f"--- Inspecting Discount Setup for Reseller {reseller_id} & Owner {owner_id} ---")
    
    try:
        reseller = Organization.objects.get(id=reseller_id)
        print(f"Reseller: {reseller.name} (ID: {reseller.id})")
        
        # Check Organization-level Discount Group
        dg_org = getattr(reseller, 'discount_group', None)
        if dg_org:
            print(f"  Organization.discount_group: {dg_org.name} (ID: {dg_org.id})")
            print(f"    Owner: {dg_org.organization_id}")
            print(f"    Is Active: {dg_org.is_active}")
            # Check rules
            for d in dg_org.discounts.all():
                print(f"    Rule: {d.things}, Pkg Amount: {d.umrah_package_discount_amount}")
        else:
            print("  Organization.discount_group: None")
            
        print("-" * 30)

        # Check AllowedReseller Link
        # Needs to find link first.
        # Note: AllowedReseller links OrganizationLink -> Reseller
        # We need to find OrgLink where organization_id = owner_id
        
        # Try importing Booking OrganizationLink
        from booking.models import OrganizationLink as BookingOrgLink
        
        links = BookingOrgLink.objects.filter(organization_id=owner_id)
        print(f"Found {links.count()} BookingOrgLinks for Owner {owner_id}")
        
        allowed_resellers = AllowedReseller.objects.filter(
            reseller_company=reseller,
            inventory_owner_company__in=links
        )
        
        if allowed_resellers.exists():
            for ar in allowed_resellers:
                print(f"AllowedReseller Link Found (ID: {ar.id})")
                print(f"  Status: {ar.requested_status_by_reseller}")
                dg_link = ar.discount_group
                if dg_link:
                    print(f"  Link.discount_group: {dg_link.name} (ID: {dg_link.id})")
                    print(f"    Owner: {dg_link.organization_id}")
                else:
                    print("  Link.discount_group: None")
        else:
             print("No AllowedReseller link found!")

        print("-" * 30)
        
        # Check Item Ownership (Example Package)
        # Find any package owned by 11
        pkg = UmrahPackage.objects.filter(inventory_owner_organization_id=owner_id).first()
        if pkg:
            print(f"Sample Package: {pkg.title} (ID: {pkg.id})")
            print(f"  Owner: {pkg.inventory_owner_organization_id}")
            print(f"  Reselling Allowed: {pkg.reselling_allowed}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_discount_setup()
