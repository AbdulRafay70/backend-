"""
Script to create Payments category with multiple sub-sections.
Ledger: 1 permission (view)
Payments: 3 permissions (add, approve, reject)
Bank Account: CRUD (4 permissions)
Pending Payments: 2 permissions (view, add remarks)
Booking History: 5 permissions (view bookings by type)
Total: 15 permissions
Run with: python create_payments_category.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission, Group
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension

def main():
    print('\n🔧 Creating Payments category with sub-sections...\n', flush=True)

    try:
        # Use Group content type for payments permissions
        group_content_type = ContentType.objects.get_for_model(Group)

        created_permissions = []

        # 1. Ledger - 1 permission
        print('Section 1: Creating Ledger permission...', flush=True)
        ledger_perm, created = Permission.objects.get_or_create(
            codename='view_ledger_admin',
            content_type=group_content_type,
            defaults={'name': 'Can view ledger in admin portal'}
        )
        if created:
            print(f'  ✅ Created: {ledger_perm.codename}', flush=True)
        else:
            print(f'  ℹ️  Exists: {ledger_perm.codename}', flush=True)
        PermissionExtension.objects.get_or_create(permission=ledger_perm, defaults={'type': 'view'})
        created_permissions.append({'id': ledger_perm.id, 'codename': ledger_perm.codename, 'section': 'Ledger'})

        # 2. Payments - 3 permissions
        print('\nSection 2: Creating Payments permissions...', flush=True)
        payments_perms = [
            {'codename': 'add_payments_finance_admin', 'name': 'Can add payments in admin portal', 'type': 'add'},
            {'codename': 'approve_payments_admin', 'name': 'Can approve payments in admin portal', 'type': 'approve'},
            {'codename': 'reject_payments_admin', 'name': 'Can reject payments in admin portal', 'type': 'reject'}
        ]
        for perm_data in payments_perms:
            permission, created = Permission.objects.get_or_create(
                codename=perm_data['codename'],
                content_type=group_content_type,
                defaults={'name': perm_data['name']}
            )
            if created:
                print(f'  ✅ Created: {permission.codename}', flush=True)
            else:
                print(f'  ℹ️  Exists: {permission.codename}', flush=True)
            PermissionExtension.objects.get_or_create(permission=permission, defaults={'type': perm_data['type']})
            created_permissions.append({'id': permission.id, 'codename': permission.codename, 'section': 'Payments'})

        # 3. Bank Account - CRUD (4 permissions)
        print('\nSection 3: Creating Bank Account CRUD permissions...', flush=True)
        bank_perms = [
            {'codename': 'view_bank_account_admin', 'name': 'Can view bank account in admin portal', 'type': 'view'},
            {'codename': 'add_bank_account_admin', 'name': 'Can add bank account in admin portal', 'type': 'add'},
            {'codename': 'edit_bank_account_admin', 'name': 'Can edit bank account in admin portal', 'type': 'edit'},
            {'codename': 'delete_bank_account_admin', 'name': 'Can delete bank account in admin portal', 'type': 'delete'}
        ]
        for perm_data in bank_perms:
            permission, created = Permission.objects.get_or_create(
                codename=perm_data['codename'],
                content_type=group_content_type,
                defaults={'name': perm_data['name']}
            )
            if created:
                print(f'  ✅ Created: {permission.codename}', flush=True)
            else:
                print(f'  ℹ️  Exists: {permission.codename}', flush=True)
            PermissionExtension.objects.get_or_create(permission=permission, defaults={'type': perm_data['type']})
            created_permissions.append({'id': permission.id, 'codename': permission.codename, 'section': 'Bank Account'})

        # 4. Pending Payments - 2 permissions
        print('\nSection 4: Creating Pending Payments permissions...', flush=True)
        pending_perms = [
            {'codename': 'view_pending_payments_admin', 'name': 'Can view pending payments in admin portal', 'type': 'view'},
            {'codename': 'add_remarks_pending_payments_admin', 'name': 'Can add remarks to pending payments in admin portal', 'type': 'add'}
        ]
        for perm_data in pending_perms:
            permission, created = Permission.objects.get_or_create(
                codename=perm_data['codename'],
                content_type=group_content_type,
                defaults={'name': perm_data['name']}
            )
            if created:
                print(f'  ✅ Created: {permission.codename}', flush=True)
            else:
                print(f'  ℹ️  Exists: {permission.codename}', flush=True)
            PermissionExtension.objects.get_or_create(permission=permission, defaults={'type': perm_data['type']})
            created_permissions.append({'id': permission.id, 'codename': permission.codename, 'section': 'Pending Payments'})

        # 5. Booking History - 5 view permissions
        print('\nSection 5: Creating Booking History permissions...', flush=True)
        booking_perms = [
            {'codename': 'view_booking_history_admin', 'name': 'Can view booking history in admin portal', 'type': 'view'},
            {'codename': 'view_agent_bookings_admin', 'name': 'Can view agent bookings in admin portal', 'type': 'view'},
            {'codename': 'view_org_bookings_admin', 'name': 'Can view organization bookings in admin portal', 'type': 'view'},
            {'codename': 'view_branch_bookings_admin', 'name': 'Can view branch bookings in admin portal', 'type': 'view'},
            {'codename': 'view_employee_bookings_admin', 'name': 'Can view employee bookings in admin portal', 'type': 'view'}
        ]
        for perm_data in booking_perms:
            permission, created = Permission.objects.get_or_create(
                codename=perm_data['codename'],
                content_type=group_content_type,
                defaults={'name': perm_data['name']}
            )
            if created:
                print(f'  ✅ Created: {permission.codename}', flush=True)
            else:
                print(f'  ℹ️  Exists: {permission.codename}', flush=True)
            PermissionExtension.objects.get_or_create(permission=permission, defaults={'type': perm_data['type']})
            created_permissions.append({'id': permission.id, 'codename': permission.codename, 'section': 'Booking History'})

        print('\n✅ Successfully created Payments category!', flush=True)
        
        print(f'\n📊 Created Permissions by Section:', flush=True)
        for section in ['Ledger', 'Payments', 'Bank Account', 'Pending Payments', 'Booking History']:
            section_perms = [p for p in created_permissions if p['section'] == section]
            print(f'\n{section} ({len(section_perms)} permissions):', flush=True)
            for perm in section_perms:
                print(f'  • {perm["codename"]} (ID: {perm["id"]})', flush=True)

        print(f'\n💡 Total: {len(created_permissions)} permissions created', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
