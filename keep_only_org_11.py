"""
Delete ALL data except Organization ID 11 (ORG-0006)

This will:
- Keep ONLY Organization ID 11 and its branches/agencies/users
- Delete ALL other organizations
- Delete ALL bookings, inventory, finance data (all organizations)

Run with: python keep_only_org_11.py
"""

import os
import django
import sys

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from finance.models import FinancialRecord, Expense, AuditLog, TransactionJournal, ChartOfAccount
from organization.models import Organization, Branch, Agency, WalkInBooking
from django.contrib.auth.models import User

# Try to import optional models
try:
    from packages.models import UmrahPackage
    HAS_PACKAGES = True
except ImportError:
    HAS_PACKAGES = False

try:
    from tickets.models import Hotels, Tickets, HotelRooms, RoomDetails
    HAS_TICKETS = True
except ImportError:
    HAS_TICKETS = False


def keep_only_org_11():
    KEEP_ORG_ID = 11  # ORG-0006 - abdulrafay@gmail.com
    
    print('\n' + '='*70)
    print('CLEANING DATABASE - KEEP ONLY ORGANIZATION ID 11')
    print('='*70)
    
    # Verify the organization exists
    try:
        keep_org = Organization.objects.get(id=KEEP_ORG_ID)
        print(f'\n✅ Found organization to keep:')
        print(f'   ID: {keep_org.id}')
        print(f'   Code: {keep_org.org_code}')
        print(f'   Name: {keep_org.name}')
        print(f'   Email: {keep_org.email}')
    except Organization.DoesNotExist:
        print(f'\n❌ ERROR: Organization ID {KEEP_ORG_ID} not found!')
        return
    
    print('\n' + '='*70)
    print('📊 Current Record Counts:')
    print(f'  Organizations: {Organization.objects.count()}')
    print(f'  Branches: {Branch.objects.count()}')
    print(f'  Agencies: {Agency.objects.count()}')
    print(f'  Users: {User.objects.count()}')
    print(f'  Bookings: {Booking.objects.count()}')
    print(f'  Financial Records: {FinancialRecord.objects.count()}')
    print(f'  Expenses: {Expense.objects.count()}')
    if HAS_PACKAGES:
        print(f'  Umrah Packages: {UmrahPackage.objects.count()}')
    if HAS_TICKETS:
        print(f'  Hotels: {Hotels.objects.count()}')
        print(f'  Tickets: {Tickets.objects.count()}')
    
    print('\n⚠️  WARNING: This will:')
    print(f'  ✅ KEEP Organization ID {KEEP_ORG_ID} and its branches/agencies')
    print('  ❌ DELETE all OTHER organizations')
    print('  ❌ DELETE ALL bookings (all organizations)')
    print('  ❌ DELETE ALL finance data (all organizations)')
    print('  ❌ DELETE ALL inventory (all organizations)')
    print('  ❌ DELETE users NOT associated with org 11')
    
    print('\n' + '='*70)
    confirmation = input(f'Type "DELETE ALL EXCEPT ORG {KEEP_ORG_ID}" to confirm: ')
    
    if confirmation != f"DELETE ALL EXCEPT ORG {KEEP_ORG_ID}":
        print('\n❌ Operation cancelled.')
        return
    
    print('\n🗑️  Deleting data...\n')
    
    # 1. Delete ALL transactional data (for all organizations)
    booking_count = Booking.objects.count()
    Booking.objects.all().delete()
    print(f'✅ Deleted {booking_count} bookings')
    
    fr_count = FinancialRecord.objects.count()
    FinancialRecord.objects.all().delete()
    print(f'✅ Deleted {fr_count} financial records')
    
    exp_count = Expense.objects.count()
    Expense.objects.all().delete()
    print(f'✅ Deleted {exp_count} expenses')
    
    audit_count = AuditLog.objects.count()
    AuditLog.objects.all().delete()
    print(f'✅ Deleted {audit_count} audit logs')
    
    tj_count = TransactionJournal.objects.count()
    TransactionJournal.objects.all().delete()
    print(f'✅ Deleted {tj_count} transaction journals')
    
    coa_count = ChartOfAccount.objects.count()
    ChartOfAccount.objects.all().delete()
    print(f'✅ Deleted {coa_count} chart of accounts')
    
    walkin_count = WalkInBooking.objects.count()
    WalkInBooking.objects.all().delete()
    print(f'✅ Deleted {walkin_count} walk-in bookings')
    
    # Delete specific protected models first (CustomUmrah models)
    if HAS_PACKAGES:
        try:
            from packages.models import CustomUmrahFoodDetails, CustomUmrahZiaratDetails
            
            food_count = CustomUmrahFoodDetails.objects.count()
            CustomUmrahFoodDetails.objects.all().delete()
            print(f'✅ Deleted {food_count} CustomUmrahFoodDetails (protected dependency)')
            
            ziarat_count = CustomUmrahZiaratDetails.objects.count()
            CustomUmrahZiaratDetails.objects.all().delete()
            print(f'✅ Deleted {ziarat_count} CustomUmrahZiaratDetails (protected dependency)')
        except Exception as e:
            print(f'⚠️  Note: {e}')
    
    # Delete ALL package-related data (brute force approach)
    if HAS_PACKAGES:
        try:
            # Get all models from packages app and delete all their data
            from django.apps import apps
            packages_app = apps.get_app_config('packages')
            
            for model in packages_app.get_models():
                count = model.objects.count()
                if count > 0:
                    model.objects.all().delete()
                    print(f'✅ Deleted {count} {model.__name__} records')
        except Exception as e:
            print(f'⚠️  Warning: Error deleting package models: {e}')
    
    # Delete inventory if available
    if HAS_TICKETS:
        room_count = HotelRooms.objects.count()
        HotelRooms.objects.all().delete()
        print(f'✅ Deleted {room_count} hotel rooms')
        
        try:
            room_details_count = RoomDetails.objects.count()
            RoomDetails.objects.all().delete()
            print(f'✅ Deleted {room_details_count} room details')
        except:
            pass
        
        hotel_count = Hotels.objects.count()
        Hotels.objects.all().delete()
        print(f'✅ Deleted {hotel_count} hotels')
        
        ticket_count = Tickets.objects.count()
        Tickets.objects.all().delete()
        print(f'✅ Deleted {ticket_count} tickets')
    
    # 2. Get branches and agencies of org 11 to preserve
    keep_branches = list(Branch.objects.filter(organization_id=KEEP_ORG_ID).values_list('id', flat=True))
    keep_agencies = list(Agency.objects.filter(branch_id__in=keep_branches).values_list('id', flat=True))
    
    print(f'\n📌 Preserving:')
    print(f'  Organization: {KEEP_ORG_ID}')
    print(f'  Branches: {len(keep_branches)}')
    print(f'  Agencies: {len(keep_agencies)}')
    
    # 3. Delete agencies NOT in org 11
    other_agencies = Agency.objects.exclude(id__in=keep_agencies)
    agency_delete_count = other_agencies.count()
    # Remove users association before deleting
    for agency in other_agencies:
        agency.user.clear()
    other_agencies.delete()
    print(f'✅ Deleted {agency_delete_count} agencies from other organizations')
    
    # 4. Delete branches NOT in org 11
    other_branches = Branch.objects.exclude(id__in=keep_branches)
    branch_delete_count = other_branches.count()
    # Remove users association before deleting
    for branch in other_branches:
        branch.user.clear()
    other_branches.delete()
    print(f'✅ Deleted {branch_delete_count} branches from other organizations')
    
    # 5. Delete all OTHER organizations
    other_orgs = Organization.objects.exclude(id=KEEP_ORG_ID)
    org_delete_count = other_orgs.count()
    # Remove users association before deleting
    for org in other_orgs:
        org.user.clear()
    other_orgs.delete()
    print(f'✅ Deleted {org_delete_count} other organizations')
    
    # 6. Delete users NOT associated with org 11
    # Get all users associated with org 11 (through org, branches, or agencies)
    org_users = set(keep_org.user.all().values_list('id', flat=True))
    branch_users = set()
    for branch_id in keep_branches:
        branch = Branch.objects.get(id=branch_id)
        branch_users.update(branch.user.all().values_list('id', flat=True))
    agency_users = set()
    for agency_id in keep_agencies:
        agency = Agency.objects.get(id=agency_id)
        agency_users.update(agency.user.all().values_list('id', flat=True))
    
    keep_users = org_users | branch_users | agency_users
    
    # Keep superusers and staff
    superusers = set(User.objects.filter(is_superuser=True).values_list('id', flat=True))
    keep_users = keep_users | superusers
    
    other_users = User.objects.exclude(id__in=keep_users)
    user_delete_count = other_users.count()
    other_users.delete()
    print(f'✅ Deleted {user_delete_count} users not associated with org {KEEP_ORG_ID}')
    
    print('\n' + '='*70)
    print('✅ CLEANUP COMPLETED!')
    print('='*70)
    
    print(f'\n📊 Remaining Data:')
    print(f'  Organizations: {Organization.objects.count()} (ID {KEEP_ORG_ID} only)')
    print(f'  Branches: {Branch.objects.count()}')
    print(f'  Agencies: {Agency.objects.count()}')
    print(f'  Users: {User.objects.count()}')
    print(f'  Bookings: {Booking.objects.count()} ✨')
    print(f'  Financial Records: {FinancialRecord.objects.count()} ✨')
    if HAS_TICKETS:
        print(f'  Inventory: {Hotels.objects.count()} hotels, {Tickets.objects.count()} tickets ✨')
    
    print('\n✨ Database is now clean with ONLY Organization ID 11!')
    print('='*70)


if __name__ == '__main__':
    keep_only_org_11()
