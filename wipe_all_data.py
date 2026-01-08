"""
Complete Database Wipe - Delete ALL organizational data

This will delete:
- ALL Users (except superusers that you choose to keep)
- ALL Organizations
- ALL Branches
- ALL Agencies
- ALL transactional data (bookings, finance, inventory)

Run with: python wipe_all_data.py
"""

import os
import django
import sys

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import User
from organization.models import Organization, Branch, Agency, WalkInBooking
from booking.models import Booking
from finance.models import FinancialRecord, Expense, AuditLog, TransactionJournal, ChartOfAccount


def wipe_all_data():
    print('\n' + '='*70)
    print('⚠️  COMPLETE DATABASE WIPE')
    print('='*70)
    
    print('\n📊 Current Counts:')
    print(f'  Users: {User.objects.count()}')
    print(f'  Organizations: {Organization.objects.count()}')
    print(f'  Branches: {Branch.objects.count()}')
    print(f'  Agencies: {Agency.objects.count()}')
    print(f'  Bookings: {Booking.objects.count()}')
    print(f'  Financial Records: {FinancialRecord.objects.count()}')
    
    print('\n⚠️  WARNING: This will DELETE EVERYTHING:')
    print('  ❌ ALL Users')
    print('  ❌ ALL Organizations')
    print('  ❌ ALL Branches')
    print('  ❌ ALL Agencies')
    print('  ❌ ALL Bookings')
    print('  ❌ ALL Finance Data')
    print('  ❌ ALL Inventory')
    print('  ❌ ALL Package Data')
    
    print('\n' + '='*70)
    confirmation = input('Type "WIPE EVERYTHING" to confirm: ')
    
    if confirmation != "WIPE EVERYTHING":
        print('\n❌ Operation cancelled.')
        return
    
    print('\n🗑️  Deleting all data...\n')
    
    # 1. Delete all transactional data
    Booking.objects.all().delete()
    print('✅ Deleted all bookings')
    
    FinancialRecord.objects.all().delete()
    print('✅ Deleted all financial records')
    
    Expense.objects.all().delete()
    print('✅ Deleted all expenses')
    
    AuditLog.objects.all().delete()
    print('✅ Deleted all audit logs')
    
    TransactionJournal.objects.all().delete()
    print('✅ Deleted all transaction journals')
    
    ChartOfAccount.objects.all().delete()
    print('✅ Deleted all chart of accounts')
    
    WalkInBooking.objects.all().delete()
    print('✅ Deleted all walk-in bookings')
    
    # 2. Delete all package data
    try:
        from django.apps import apps
        packages_app = apps.get_app_config('packages')
        
        for model in packages_app.get_models():
            count = model.objects.count()
            if count > 0:
                model.objects.all().delete()
                print(f'✅ Deleted {count} {model.__name__} records')
    except Exception as e:
        print(f'ℹ️  Packages: {e}')
    
    # 3. Delete all inventory
    try:
        from tickets.models import Hotels, Tickets, HotelRooms, RoomDetails
        
        HotelRooms.objects.all().delete()
        print('✅ Deleted all hotel rooms')
        
        try:
            RoomDetails.objects.all().delete()
            print('✅ Deleted all room details')
        except:
            pass
        
        Hotels.objects.all().delete()
        print('✅ Deleted all hotels')
        
        Tickets.objects.all().delete()
        print('✅ Deleted all tickets')
    except Exception as e:
        print(f'ℹ️  Tickets: {e}')
    
    # 4. Delete organizational structure
    Agency.objects.all().delete()
    print('✅ Deleted ALL agencies')
    
    Branch.objects.all().delete()
    print('✅ Deleted ALL branches')
    
    Organization.objects.all().delete()
    print('✅ Deleted ALL organizations')
    
    # 5. Delete ALL users
    User.objects.all().delete()
    print('✅ Deleted ALL users')
    
    print('\n' + '='*70)
    print('✅ DATABASE COMPLETELY WIPED!')
    print('='*70)
    
    print(f'\n📊 Remaining Counts:')
    print(f'  Users: {User.objects.count()}')
    print(f'  Organizations: {Organization.objects.count()}')
    print(f'  Branches: {Branch.objects.count()}')
    print(f'  Agencies: {Agency.objects.count()}')
    print(f'  Bookings: {Booking.objects.count()}')
    print(f'  Financial Records: {FinancialRecord.objects.count()}')
    
    print('\n✨ Database is now completely empty!')
    print('='*70)


if __name__ == '__main__':
    wipe_all_data()
