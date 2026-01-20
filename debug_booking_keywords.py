"""
Script to check which keywords are in the booking history permission codenames.
This will help us understand why they're not being categorized correctly.
Run with: python debug_booking_keywords.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission

def main():
    print('\n🔍 Debugging Booking History permission keywords...\n', flush=True)

    booking_perms = [
        'view_booking_history_admin',
        'view_agent_bookings_admin',
        'view_org_bookings_admin',
        'view_branch_bookings_admin',
        'view_employee_bookings_admin'
    ]

    # Keywords that map to different categories
    payments_keywords = ['booking_history', 'agent_bookings', 'org_bookings', 'branch_bookings', 'employee_bookings']
    
    for codename in booking_perms:
        try:
            perm = Permission.objects.get(codename=codename)
            print(f'Permission: {codename}', flush=True)
            
            # Check which keywords it contains
            matched_keywords = []
            for keyword in payments_keywords:
                if keyword in codename:
                    matched_keywords.append(keyword)
            
            print(f'  Matched Payments keywords: {matched_keywords}', flush=True)
            print(f'  Content Type: {perm.content_type}', flush=True)
            print(f'  ID: {perm.id}\n', flush=True)
            
        except Permission.DoesNotExist:
            print(f'❌ NOT FOUND: {codename}\n', flush=True)

if __name__ == '__main__':
    main()
