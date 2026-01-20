"""
Script to add Passport Leads permissions to CRM (admin only).
CRUD permissions: view, add, edit, delete
Run with: python add_passport_leads_permissions.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension
from leads.models import Lead

def main():
    print('\n🔧 Adding Passport Leads permissions to CRM...\n', flush=True)

    try:
        # Use Lead model as content type
        lead_content_type = ContentType.objects.get_for_model(Lead)

        # Define CRUD permissions for Passport Leads
        permissions_to_create = [
            {
                'codename': 'view_passport_leads_admin',
                'name': 'Can view passport leads in admin portal',
                'type': 'view'
            },
            {
                'codename': 'add_passport_leads_admin',
                'name': 'Can add passport leads in admin portal',
                'type': 'add'
            },
            {
                'codename': 'edit_passport_leads_admin',
                'name': 'Can edit passport leads in admin portal',
                'type': 'edit'
            },
            {
                'codename': 'delete_passport_leads_admin',
                'name': 'Can delete passport leads in admin portal',
                'type': 'delete'
            }
        ]

        created_permissions = []

        for perm_data in permissions_to_create:
            # Create or get the permission
            permission, created = Permission.objects.get_or_create(
                codename=perm_data['codename'],
                content_type=lead_content_type,
                defaults={'name': perm_data['name']}
            )
            
            if created:
                print(f'✅ Created: {permission.codename}', flush=True)
            else:
                print(f'ℹ️  Exists: {permission.codename}', flush=True)

            # Create permission extension
            perm_ext, ext_created = PermissionExtension.objects.get_or_create(
                permission=permission,
                defaults={'type': perm_data['type']}
            )

            created_permissions.append({
                'id': permission.id,
                'codename': permission.codename,
                'name': permission.name,
                'type': perm_data['type']
            })

        print('\n✅ Successfully created Passport Leads permissions!', flush=True)
        print(f'\n📊 Passport Leads - {len(created_permissions)} permissions:', flush=True)
        for perm in created_permissions:
            print(f'  • [{perm["type"].upper()}] {perm["name"]} (ID: {perm["id"]})', flush=True)

        print(f'\n💡 Note: These are admin-only CRUD permissions.', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
