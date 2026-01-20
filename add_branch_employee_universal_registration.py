"""
Script to add Branch and Employee add permissions to Universal Registration.
Run with: python add_branch_employee_universal_registration.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension
from organization.models import Branch
from django.contrib.auth.models import User

def main():
    print('\n🔧 Adding Branch and Employee add permissions to Universal Registration...\n', flush=True)

    try:
        # Get content types
        branch_content_type = ContentType.objects.get_for_model(Branch)
        user_content_type = ContentType.objects.get_for_model(User)

        created_permissions = []

        # Create Branch add permission
        print('Creating Branch add permission...', flush=True)
        branch_perm, created = Permission.objects.get_or_create(
            codename='add_branch_admin',
            content_type=branch_content_type,
            defaults={'name': 'Can add branch in admin portal'}
        )
        
        if created:
            print(f'  ✅ Created: {branch_perm.codename}', flush=True)
        else:
            print(f'  ℹ️  Exists: {branch_perm.codename}', flush=True)

        PermissionExtension.objects.get_or_create(
            permission=branch_perm,
            defaults={'type': 'add'}
        )
        created_permissions.append({'id': branch_perm.id, 'codename': branch_perm.codename, 'name': branch_perm.name})

        # Create Employee add permission
        print('\nCreating Employee add permission...', flush=True)
        employee_perm, created = Permission.objects.get_or_create(
            codename='add_employee_admin',
            content_type=user_content_type,
            defaults={'name': 'Can add employee in admin portal'}
        )
        
        if created:
            print(f'  ✅ Created: {employee_perm.codename}', flush=True)
        else:
            print(f'  ℹ️  Exists: {employee_perm.codename}', flush=True)

        PermissionExtension.objects.get_or_create(
            permission=employee_perm,
            defaults={'type': 'add'}
        )
        created_permissions.append({'id': employee_perm.id, 'codename': employee_perm.codename, 'name': employee_perm.name})

        print('\n✅ Successfully added Branch and Employee permissions!', flush=True)
        
        print(f'\n📊 Universal Registration Permissions ({len(created_permissions)} new):', flush=True)
        for perm in created_permissions:
            print(f'  • {perm["codename"]} - {perm["name"]} (ID: {perm["id"]})', flush=True)

        print(f'\n💡 Note: Universal Registration now has 4 add permissions total:', flush=True)
        print(f'  🏢 Organization', flush=True)
        print(f'  🏛️ Agency', flush=True)
        print(f'  🏪 Branch (NEW)', flush=True)
        print(f'  👨‍💼 Employee (NEW)', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
