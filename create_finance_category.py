"""
Script to create Finance category with 8 sub-sections.
Recent Transactions: 1 view permission
Profit & Loss Reports: 1 view permission
Financial Ledger: 1 view permission
Expense Management: CRUD (4 permissions)
Manual Posting: CRUD (4 permissions)
Tax Reports (FBR): 1 view permission
Balance Sheet: 1 view permission
Audit Trail: 1 view permission
Total: 16 permissions
Run with: python create_finance_category.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission, Group
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension

def main():
    print('\n🔧 Creating Finance category with 8 sub-sections...\n', flush=True)

    try:
        # Use Group content type for finance permissions
        group_content_type = ContentType.objects.get_for_model(Group)

        created_permissions = []

        # 1. Recent Transactions - 1 view permission
        print('Section 1: Creating Recent Transactions permission...', flush=True)
        perm, created = Permission.objects.get_or_create(
            codename='view_recent_transactions_admin',
            content_type=group_content_type,
            defaults={'name': 'Can view recent transactions in admin portal'}
        )
        if created:
            print(f'  ✅ Created: {perm.codename}', flush=True)
        else:
            print(f'  ℹ️  Exists: {perm.codename}', flush=True)
        PermissionExtension.objects.get_or_create(permission=perm, defaults={'type': 'view'})
        created_permissions.append({'id': perm.id, 'codename': perm.codename, 'section': 'Recent Transactions'})

        # 2. Profit & Loss Reports - 1 view permission
        print('\nSection 2: Creating Profit & Loss Reports permission...', flush=True)
        perm, created = Permission.objects.get_or_create(
            codename='view_profit_loss_reports_admin',
            content_type=group_content_type,
            defaults={'name': 'Can view profit & loss reports in admin portal'}
        )
        if created:
            print(f'  ✅ Created: {perm.codename}', flush=True)
        else:
            print(f'  ℹ️  Exists: {perm.codename}', flush=True)
        PermissionExtension.objects.get_or_create(permission=perm, defaults={'type': 'view'})
        created_permissions.append({'id': perm.id, 'codename': perm.codename, 'section': 'Profit & Loss Reports'})

        # 3. Financial Ledger - 1 view permission
        print('\nSection 3: Creating Financial Ledger permission...', flush=True)
        perm, created = Permission.objects.get_or_create(
            codename='view_financial_ledger_admin',
            content_type=group_content_type,
            defaults={'name': 'Can view financial ledger in admin portal'}
        )
        if created:
            print(f'  ✅ Created: {perm.codename}', flush=True)
        else:
            print(f'  ℹ️  Exists: {perm.codename}', flush=True)
        PermissionExtension.objects.get_or_create(permission=perm, defaults={'type': 'view'})
        created_permissions.append({'id': perm.id, 'codename': perm.codename, 'section': 'Financial Ledger'})

        # 4. Expense Management - CRUD (4 permissions)
        print('\nSection 4: Creating Expense Management CRUD permissions...', flush=True)
        expense_perms = [
            {'codename': 'view_expense_management_admin', 'name': 'Can view expense management in admin portal', 'type': 'view'},
            {'codename': 'add_expense_management_admin', 'name': 'Can add expense management in admin portal', 'type': 'add'},
            {'codename': 'edit_expense_management_admin', 'name': 'Can edit expense management in admin portal', 'type': 'edit'},
            {'codename': 'delete_expense_management_admin', 'name': 'Can delete expense management in admin portal', 'type': 'delete'}
        ]
        for perm_data in expense_perms:
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
            created_permissions.append({'id': permission.id, 'codename': permission.codename, 'section': 'Expense Management'})

        # 5. Manual Posting - CRUD (4 permissions)
        print('\nSection 5: Creating Manual Posting CRUD permissions...', flush=True)
        posting_perms = [
            {'codename': 'view_manual_posting_admin', 'name': 'Can view manual posting in admin portal', 'type': 'view'},
            {'codename': 'add_manual_posting_admin', 'name': 'Can add manual posting in admin portal', 'type': 'add'},
            {'codename': 'edit_manual_posting_admin', 'name': 'Can edit manual posting in admin portal', 'type': 'edit'},
            {'codename': 'delete_manual_posting_admin', 'name': 'Can delete manual posting in admin portal', 'type': 'delete'}
        ]
        for perm_data in posting_perms:
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
            created_permissions.append({'id': permission.id, 'codename': permission.codename, 'section': 'Manual Posting'})

        # 6. Tax Reports (FBR) - 1 view permission
        print('\nSection 6: Creating Tax Reports (FBR) permission...', flush=True)
        perm, created = Permission.objects.get_or_create(
            codename='view_tax_reports_fbr_admin',
            content_type=group_content_type,
            defaults={'name': 'Can view tax reports (FBR) in admin portal'}
        )
        if created:
            print(f'  ✅ Created: {perm.codename}', flush=True)
        else:
            print(f'  ℹ️  Exists: {perm.codename}', flush=True)
        PermissionExtension.objects.get_or_create(permission=perm, defaults={'type': 'view'})
        created_permissions.append({'id': perm.id, 'codename': perm.codename, 'section': 'Tax Reports (FBR)'})

        # 7. Balance Sheet - 1 view permission
        print('\nSection 7: Creating Balance Sheet permission...', flush=True)
        perm, created = Permission.objects.get_or_create(
            codename='view_balance_sheet_admin',
            content_type=group_content_type,
            defaults={'name': 'Can view balance sheet in admin portal'}
        )
        if created:
            print(f'  ✅ Created: {perm.codename}', flush=True)
        else:
            print(f'  ℹ️  Exists: {perm.codename}', flush=True)
        PermissionExtension.objects.get_or_create(permission=perm, defaults={'type': 'view'})
        created_permissions.append({'id': perm.id, 'codename': perm.codename, 'section': 'Balance Sheet'})

        # 8. Audit Trail - 1 view permission
        print('\nSection 8: Creating Audit Trail permission...', flush=True)
        perm, created = Permission.objects.get_or_create(
            codename='view_audit_trail_admin',
            content_type=group_content_type,
            defaults={'name': 'Can view audit trail in admin portal'}
        )
        if created:
            print(f'  ✅ Created: {perm.codename}', flush=True)
        else:
            print(f'  ℹ️  Exists: {perm.codename}', flush=True)
        PermissionExtension.objects.get_or_create(permission=perm, defaults={'type': 'view'})
        created_permissions.append({'id': perm.id, 'codename': perm.codename, 'section': 'Audit Trail'})

        print('\n✅ Successfully created Finance category!', flush=True)
        
        print(f'\n📊 Created Permissions by Section:', flush=True)
        for section in ['Recent Transactions', 'Profit & Loss Reports', 'Financial Ledger', 'Expense Management', 'Manual Posting', 'Tax Reports (FBR)', 'Balance Sheet', 'Audit Trail']:
            section_perms = [p for p in created_permissions if p['section'] == section]
            print(f'\n{section} ({len(section_perms)} permission{"s" if len(section_perms) > 1 else ""}):', flush=True)
            for perm in section_perms:
                print(f'  • {perm["codename"]} (ID: {perm["id"]})', flush=True)

        print(f'\n💡 Total: {len(created_permissions)} permissions created', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
