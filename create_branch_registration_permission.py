"""
Script to create add branch registration permission for Universal Registration.
This is for registering physical branches, not branch users.
Run with: python create_branch_registration_permission.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension
from organization.models import Branch

def main():
    print('\n🔧 Creating branch registration permission for Universal Registration...\n', flush=True)

    try:
        # Get Branch content type
        branch_content_type = ContentType.objects.get_for_model(Branch)

        # Create add_branch_registration_admin permission
        print('Creating add branch registration permission...', flush=True)
        branch_perm, created = Permission.objects.get_or_create(
            codename='add_branch_registration_admin',
            content_type=branch_content_type,
            defaults={'name': 'Can add branch registration in admin portal'}
        )
        
        if created:
            print(f'  ✅ Created: {branch_perm.codename}', flush=True)
        else:
            print(f'  ℹ️  Exists: {branch_perm.codename}', flush=True)

        PermissionExtension.objects.get_or_create(
            permission=branch_perm,
            defaults={'type': 'add'}
        )

        print('\n✅ Successfully created branch registration permission!', flush=True)
        
        print(f'\n📊 Permission Details:', flush=True)
        print(f'  • Codename: {branch_perm.codename}', flush=True)
        print(f'  • Name: {branch_perm.name}', flush=True)
        print(f'  • ID: {branch_perm.id}', flush=True)

        print(f'\n💡 Universal Registration now has 3 add permissions:', flush=True)
        print(f'  🏢 Organization (add_organization_admin)', flush=True)
        print(f'  🏛️ Agency (add_agency_admin)', flush=True)
        print(f'  🏪 Branch Registration (add_branch_registration_admin) ← NEW', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
