"""
Script to verify hotel sub-component permissions were created.
Run with: python verify_hotel_subcomponent_permissions.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission

def main():
    print('\n📊 Verifying Hotel Sub-Component Permissions...\n', flush=True)

    try:
        # Check for availability permissions
        availability_perms = Permission.objects.filter(codename__contains='availability_admin')
        print(f'✅ Availability Permissions: {availability_perms.count()}', flush=True)
        for perm in availability_perms:
            print(f'   • {perm.codename} - {perm.name}', flush=True)

        # Check for outsourcing permissions
        outsourcing_perms = Permission.objects.filter(codename__contains='outsourcing_admin')
        print(f'\n✅ Outsourcing Permissions: {outsourcing_perms.count()}', flush=True)
        for perm in outsourcing_perms:
            print(f'   • {perm.codename} - {perm.name}', flush=True)

        # Check for floor management permissions
        floor_perms = Permission.objects.filter(codename__contains='floor_management_admin')
        print(f'\n✅ Floor Management Permissions: {floor_perms.count()}', flush=True)
        for perm in floor_perms:
            print(f'   • {perm.codename} - {perm.name}', flush=True)

        total = availability_perms.count() + outsourcing_perms.count() + floor_perms.count()
        print(f'\n📊 Total Sub-Component Permissions: {total}', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
