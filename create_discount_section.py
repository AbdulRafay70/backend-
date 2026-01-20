"""
Script to create Discount section for Partners.
Discount Groups: CRUD (4 permissions)
Assign Commission: 1 permission
Run with: python create_discount_section.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension
from finance.models import DiscountGroup

def main():
    print('\n🔧 Creating Discount section for Partners...\n', flush=True)

    try:
        # Get content type
        discount_content_type = ContentType.objects.get_for_model(DiscountGroup)

        created_permissions = []

        # Discount Groups CRUD permissions
        print('Creating Discount Groups CRUD permissions...', flush=True)
        discount_perms = [
            {'codename': 'view_discount_groups_admin', 'name': 'Can view discount groups in admin portal', 'type': 'view'},
            {'codename': 'add_discount_groups_admin', 'name': 'Can add discount groups in admin portal', 'type': 'add'},
            {'codename': 'edit_discount_groups_admin', 'name': 'Can edit discount groups in admin portal', 'type': 'edit'},
            {'codename': 'delete_discount_groups_admin', 'name': 'Can delete discount groups in admin portal', 'type': 'delete'}
        ]

        for perm_data in discount_perms:
            permission, created = Permission.objects.get_or_create(
                codename=perm_data['codename'],
                content_type=discount_content_type,
                defaults={'name': perm_data['name']}
            )
            
            if created:
                print(f'  ✅ Created: {permission.codename}', flush=True)
            else:
                print(f'  ℹ️  Exists: {permission.codename}', flush=True)

            PermissionExtension.objects.get_or_create(
                permission=permission,
                defaults={'type': perm_data['type']}
            )

            created_permissions.append({
                'id': permission.id,
                'codename': permission.codename,
                'name': permission.name
            })

        # Assign Commission to Groups permission
        print('\nCreating Assign Commission to Groups permission...', flush=True)
        commission_perm, created = Permission.objects.get_or_create(
            codename='assign_commission_to_discount_groups_admin',
            content_type=discount_content_type,
            defaults={'name': 'Can assign commission to discount groups in admin portal'}
        )
        
        if created:
            print(f'  ✅ Created: {commission_perm.codename}', flush=True)
        else:
            print(f'  ℹ️  Exists: {commission_perm.codename}', flush=True)

        PermissionExtension.objects.get_or_create(
            permission=commission_perm,
            defaults={'type': 'assign'}
        )

        created_permissions.append({
            'id': commission_perm.id,
            'codename': commission_perm.codename,
            'name': commission_perm.name
        })

        print('\n✅ Successfully created Discount section!', flush=True)
        
        print(f'\n📊 Created Permissions ({len(created_permissions)} total):', flush=True)
        for perm in created_permissions:
            print(f'  • {perm["codename"]} - {perm["name"]} (ID: {perm["id"]})', flush=True)

        print(f'\n💡 Discount section structure:', flush=True)
        print(f'  • Discount Groups: 4 CRUD permissions', flush=True)
        print(f'  • Assign Commission: 1 permission', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
