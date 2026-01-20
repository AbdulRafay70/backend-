"""
Script to create Markup Rules and Commission Rules sections for Partners.
Markup Rules: Add Group CRUD (4) + Assign Value CRUD (4) = 8 permissions
Commission Rules: Add Group CRUD (4) + Assign Value CRUD (4) = 8 permissions
Total: 16 permissions
Run with: python create_markup_commission_sections.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission, Group
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension

def main():
    print('\n🔧 Creating Markup Rules and Commission Rules sections for Partners...\n', flush=True)

    try:
        # Use Group content type
        group_content_type = ContentType.objects.get_for_model(Group)

        created_permissions = []

        # ===== MARKUP RULES SECTION =====
        print('Section 1: Creating Markup Rules permissions...', flush=True)
        
        # Markup - Add Group CRUD
        print('\n  Creating Markup Add Group CRUD permissions...', flush=True)
        markup_group_perms = [
            {'codename': 'view_markup_add_group_admin', 'name': 'Can view markup add group in admin portal', 'type': 'view'},
            {'codename': 'add_markup_add_group_admin', 'name': 'Can add markup add group in admin portal', 'type': 'add'},
            {'codename': 'edit_markup_add_group_admin', 'name': 'Can edit markup add group in admin portal', 'type': 'edit'},
            {'codename': 'delete_markup_add_group_admin', 'name': 'Can delete markup add group in admin portal', 'type': 'delete'}
        ]

        for perm_data in markup_group_perms:
            permission, created = Permission.objects.get_or_create(
                codename=perm_data['codename'],
                content_type=group_content_type,
                defaults={'name': perm_data['name']}
            )
            
            if created:
                print(f'    ✅ Created: {permission.codename}', flush=True)
            else:
                print(f'    ℹ️  Exists: {permission.codename}', flush=True)

            PermissionExtension.objects.get_or_create(
                permission=permission,
                defaults={'type': perm_data['type']}
            )

            created_permissions.append({
                'id': permission.id,
                'codename': permission.codename,
                'name': permission.name,
                'section': 'Markup Rules'
            })

        # Markup - Assign Value CRUD
        print('\n  Creating Markup Assign Value CRUD permissions...', flush=True)
        markup_value_perms = [
            {'codename': 'view_markup_assign_value_admin', 'name': 'Can view markup assign value in admin portal', 'type': 'view'},
            {'codename': 'add_markup_assign_value_admin', 'name': 'Can add markup assign value in admin portal', 'type': 'add'},
            {'codename': 'edit_markup_assign_value_admin', 'name': 'Can edit markup assign value in admin portal', 'type': 'edit'},
            {'codename': 'delete_markup_assign_value_admin', 'name': 'Can delete markup assign value in admin portal', 'type': 'delete'}
        ]

        for perm_data in markup_value_perms:
            permission, created = Permission.objects.get_or_create(
                codename=perm_data['codename'],
                content_type=group_content_type,
                defaults={'name': perm_data['name']}
            )
            
            if created:
                print(f'    ✅ Created: {permission.codename}', flush=True)
            else:
                print(f'    ℹ️  Exists: {permission.codename}', flush=True)

            PermissionExtension.objects.get_or_create(
                permission=permission,
                defaults={'type': perm_data['type']}
            )

            created_permissions.append({
                'id': permission.id,
                'codename': permission.codename,
                'name': permission.name,
                'section': 'Markup Rules'
            })

        # ===== COMMISSION RULES SECTION =====
        print('\n\nSection 2: Creating Commission Rules permissions...', flush=True)
        
        # Commission - Add Group CRUD
        print('\n  Creating Commission Add Group CRUD permissions...', flush=True)
        commission_group_perms = [
            {'codename': 'view_commission_add_group_admin', 'name': 'Can view commission add group in admin portal', 'type': 'view'},
            {'codename': 'add_commission_add_group_admin', 'name': 'Can add commission add group in admin portal', 'type': 'add'},
            {'codename': 'edit_commission_add_group_admin', 'name': 'Can edit commission add group in admin portal', 'type': 'edit'},
            {'codename': 'delete_commission_add_group_admin', 'name': 'Can delete commission add group in admin portal', 'type': 'delete'}
        ]

        for perm_data in commission_group_perms:
            permission, created = Permission.objects.get_or_create(
                codename=perm_data['codename'],
                content_type=group_content_type,
                defaults={'name': perm_data['name']}
            )
            
            if created:
                print(f'    ✅ Created: {permission.codename}', flush=True)
            else:
                print(f'    ℹ️  Exists: {permission.codename}', flush=True)

            PermissionExtension.objects.get_or_create(
                permission=permission,
                defaults={'type': perm_data['type']}
            )

            created_permissions.append({
                'id': permission.id,
                'codename': permission.codename,
                'name': permission.name,
                'section': 'Commission Rules'
            })

        # Commission - Assign Value CRUD
        print('\n  Creating Commission Assign Value CRUD permissions...', flush=True)
        commission_value_perms = [
            {'codename': 'view_commission_assign_value_admin', 'name': 'Can view commission assign value in admin portal', 'type': 'view'},
            {'codename': 'add_commission_assign_value_admin', 'name': 'Can add commission assign value in admin portal', 'type': 'add'},
            {'codename': 'edit_commission_assign_value_admin', 'name': 'Can edit commission assign value in admin portal', 'type': 'edit'},
            {'codename': 'delete_commission_assign_value_admin', 'name': 'Can delete commission assign value in admin portal', 'type': 'delete'}
        ]

        for perm_data in commission_value_perms:
            permission, created = Permission.objects.get_or_create(
                codename=perm_data['codename'],
                content_type=group_content_type,
                defaults={'name': perm_data['name']}
            )
            
            if created:
                print(f'    ✅ Created: {permission.codename}', flush=True)
            else:
                print(f'    ℹ️  Exists: {permission.codename}', flush=True)

            PermissionExtension.objects.get_or_create(
                permission=permission,
                defaults={'type': perm_data['type']}
            )

            created_permissions.append({
                'id': permission.id,
                'codename': permission.codename,
                'name': permission.name,
                'section': 'Commission Rules'
            })

        print('\n\n✅ Successfully created Markup Rules and Commission Rules sections!', flush=True)
        
        print(f'\n📊 Created Permissions ({len(created_permissions)} total):', flush=True)
        
        print(f'\n📈 Markup Rules (8 permissions):', flush=True)
        for perm in [p for p in created_permissions if p['section'] == 'Markup Rules']:
            print(f'  • {perm["codename"]} (ID: {perm["id"]})', flush=True)

        print(f'\n💼 Commission Rules (8 permissions):', flush=True)
        for perm in [p for p in created_permissions if p['section'] == 'Commission Rules']:
            print(f'  • {perm["codename"]} (ID: {perm["id"]})', flush=True)

        print(f'\n💡 Structure:', flush=True)
        print(f'  • Markup Rules: Add Group CRUD (4) + Assign Value CRUD (4) = 8', flush=True)
        print(f'  • Commission Rules: Add Group CRUD (4) + Assign Value CRUD (4) = 8', flush=True)
        print(f'\n💡 Total Partners permissions now: 70', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
