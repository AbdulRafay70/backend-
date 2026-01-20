"""
Script to check if booking history permissions exist in the database.
Run with: python check_booking_history_permissions.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission

def main():
    print('\n🔍 Checking Booking History permissions...\n', flush=True)

    booking_perms = [
        'view_booking_history_admin',
        'view_agent_bookings_admin',
        'view_org_bookings_admin',
        'view_branch_bookings_admin',
        'view_employee_bookings_admin'
    ]

    found_count = 0
    for codename in booking_perms:
        try:
            perm = Permission.objects.get(codename=codename)
            print(f'✅ Found: {codename} (ID: {perm.id})', flush=True)
            found_count += 1
        except Permission.DoesNotExist:
            print(f'❌ NOT FOUND: {codename}', flush=True)

    print(f'\n📊 Summary: {found_count}/5 booking history permissions found', flush=True)

if __name__ == '__main__':
    main()
