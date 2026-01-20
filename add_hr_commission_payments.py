"""
Script to add Commission and Payments sub-sections to HR category.
Commission: CRUD (4 permissions)
Payments: CRUD (4 permissions)
Total: 8 permissions
Run with: python add_hr_commission_payments.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension
from hr.models import MovementLog

def main():
    print('\n🔧 Adding Commission and Payments to HR category...\n', flush=True)

    try:
        # Use MovementLog content type for HR permissions
        hr_content_type = ContentType.objects.get_for_model(MovementLog)

        created_permissions = []

        # Commission CRUD permissions
        print('Creating Commission CRUD permissions...', flush=True)
        commission_perms = [
            {'codename': 'view_hr_commission_admin', 'name': 'Can view commission in admin portal', 'type': 'view'},
            {'codename': 'add_hr_commission_admin', 'name': 'Can add commission in admin portal', 'type': 'add'},
            {'codename': 'edit_hr_commission_admin', 'name': 'Can edit commission in admin portal', 'type': 'edit'},
            {'codename': 'delete_hr_commission_admin', 'name': 'Can delete commission in admin portal', 'type': 'delete'}
        ]

        for perm_data in commission_perms:
            permission, created = Permission.objects.get_or_create(
                codename=perm_data['codename'],
                content_type=hr_content_type,
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
                'name': permission.name,
                'section': 'Commission'
            })

        # Payments CRUD permissions
        print('\nCreating Payments CRUD permissions...', flush=True)
        payments_perms = [
            {'codename': 'view_hr_payments_admin', 'name': 'Can view payments in admin portal', 'type': 'view'},
            {'codename': 'add_hr_payments_admin', 'name': 'Can add payments in admin portal', 'type': 'add'},
            {'codename': 'edit_hr_payments_admin', 'name': 'Can edit payments in admin portal', 'type': 'edit'},
            {'codename': 'delete_hr_payments_admin', 'name': 'Can delete payments in admin portal', 'type': 'delete'}
        ]

        for perm_data in payments_perms:
            permission, created = Permission.objects.get_or_create(
                codename=perm_data['codename'],
                content_type=hr_content_type,
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
                'name': permission.name,
                'section': 'Payments'
            })

        print('\n✅ Successfully added Commission and Payments to HR!', flush=True)
        
        print(f'\n📊 Created Permissions ({len(created_permissions)} total):', flush=True)
        
        print(f'\n💰 Commission (4 permissions):', flush=True)
        for perm in [p for p in created_permissions if p['section'] == 'Commission']:
            print(f'  • {perm["codename"]} (ID: {perm["id"]})', flush=True)

        print(f'\n💵 Payments (4 permissions):', flush=True)
        for perm in [p for p in created_permissions if p['section'] == 'Payments']:
            print(f'  • {perm["codename"]} (ID: {perm["id"]})', flush=True)

        print(f'\n💡 HR now has 9 sub-sections:', flush=True)
        print(f'  • Employees, Attendance, Movements, Commission (existing)', flush=True)
        print(f'  • Punctuality, Approvals', flush=True)
        print(f'  • Commission (NEW - 4 CRUD)', flush=True)
        print(f'  • Payments (NEW - 4 CRUD)', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
