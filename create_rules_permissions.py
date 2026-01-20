"""
Script to create CRUD permissions for Rules Management (admin only).
Run with: python create_rules_permissions.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension
from organization.models import Rule

def main():
    print('\n🔧 Creating CRUD permissions for Rules Management (Admin only)...\n', flush=True)

    try:
        # Get content type for Rule model
        rule_content_type = ContentType.objects.get_for_model(Rule)

        # Define admin-only permissions for rules management
        permissions_to_create = [
            {
                'codename': 'view_rule_admin',
                'name': 'Can view rules in admin portal',
                'type': 'view'
            },
            {
                'codename': 'add_rule_admin',
                'name': 'Can add rules in admin portal',
                'type': 'add'
            },
            {
                'codename': 'edit_rule_admin',
                'name': 'Can edit rules in admin portal',
                'type': 'edit'
            },
            {
                'codename': 'delete_rule_admin',
                'name': 'Can delete rules in admin portal',
                'type': 'delete'
            },
        ]

        created_permissions = []

        for perm_data in permissions_to_create:
            # Create or get the permission
            permission, created = Permission.objects.get_or_create(
                codename=perm_data['codename'],
                content_type=rule_content_type,
                defaults={'name': perm_data['name']}
            )
            
            if created:
                print(f'✅ Created permission: {permission.name} ({permission.codename})', flush=True)
            else:
                print(f'ℹ️  Permission already exists: {permission.name} ({permission.codename})', flush=True)

            # Create permission extension
            perm_ext, ext_created = PermissionExtension.objects.get_or_create(
                permission=permission,
                defaults={'type': perm_data['type']}
            )
            
            if ext_created:
                print(f'   ✅ Created permission extension (type: {perm_data["type"]})', flush=True)

            created_permissions.append({
                'id': permission.id,
                'codename': permission.codename,
                'name': permission.name,
                'type': perm_data['type']
            })

        print('\n✅ Successfully created all rules management permissions!', flush=True)
        print(f'\n📊 Admin Permissions ({len(created_permissions)} total):', flush=True)
        for perm in created_permissions:
            print(f'  • [{perm["type"].upper()}] {perm["name"]}', flush=True)
            print(f'    Codename: {perm["codename"]} | ID: {perm["id"]}', flush=True)

        print(f'\n💡 Note: These are admin-only permissions. View permission will be automatically checked when add/edit/delete is selected.', flush=True)
        print(f'💡 No agent permissions created for rules as requested.', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
