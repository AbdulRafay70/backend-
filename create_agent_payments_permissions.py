"""
Script to create agent Payments permissions with 3 sub-sections.
Ledger: 1 view permission
Add Deposit: 1 add payment permission
Bank Account: CRUD (4 permissions)
Total: 6 agent permissions
Run with: python create_agent_payments_permissions.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission, Group
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension

def main():
    print('\n🔧 Creating agent Payments permissions with 3 sub-sections...\n', flush=True)

    try:
        # Use Group content type
        group_content_type = ContentType.objects.get_for_model(Group)

        created_permissions = []

        # 1. Ledger - 1 view permission
        print('Section 1: Creating Ledger permission for agent...', flush=True)
        perm, created = Permission.objects.get_or_create(
            codename='view_ledger_agent',
            content_type=group_content_type,
            defaults={'name': 'Can view ledger in agent portal'}
        )
        if created:
            print(f'  ✅ Created: {perm.codename} (ID: {perm.id})', flush=True)
        else:
            print(f'  ℹ️  Exists: {perm.codename} (ID: {perm.id})', flush=True)
        PermissionExtension.objects.get_or_create(permission=perm, defaults={'type': 'view'})
        created_permissions.append({'id': perm.id, 'codename': perm.codename, 'section': 'Ledger'})

        # 2. Add Deposit - 1 add payment permission
        print('\nSection 2: Creating Add Deposit permission for agent...', flush=True)
        perm, created = Permission.objects.get_or_create(
            codename='add_deposit_payment_agent',
            content_type=group_content_type,
            defaults={'name': 'Can add deposit payment in agent portal'}
        )
        if created:
            print(f'  ✅ Created: {perm.codename} (ID: {perm.id})', flush=True)
        else:
            print(f'  ℹ️  Exists: {perm.codename} (ID: {perm.id})', flush=True)
        PermissionExtension.objects.get_or_create(permission=perm, defaults={'type': 'add'})
        created_permissions.append({'id': perm.id, 'codename': perm.codename, 'section': 'Add Deposit'})

        # 3. Bank Account - CRUD (4 permissions)
        print('\nSection 3: Creating Bank Account CRUD permissions for agent...', flush=True)
        bank_perms = [
            {'codename': 'view_bank_account_agent', 'name': 'Can view bank account in agent portal', 'type': 'view'},
            {'codename': 'add_bank_account_agent', 'name': 'Can add bank account in agent portal', 'type': 'add'},
            {'codename': 'edit_bank_account_agent', 'name': 'Can edit bank account in agent portal', 'type': 'edit'},
            {'codename': 'delete_bank_account_agent', 'name': 'Can delete bank account in agent portal', 'type': 'delete'}
        ]
        for perm_data in bank_perms:
            permission, created = Permission.objects.get_or_create(
                codename=perm_data['codename'],
                content_type=group_content_type,
                defaults={'name': perm_data['name']}
            )
            if created:
                print(f'  ✅ Created: {permission.codename} (ID: {permission.id})', flush=True)
            else:
                print(f'  ℹ️  Exists: {permission.codename} (ID: {permission.id})', flush=True)
            PermissionExtension.objects.get_or_create(permission=permission, defaults={'type': perm_data['type']})
            created_permissions.append({'id': permission.id, 'codename': permission.codename, 'section': 'Bank Account'})

        print('\n✅ Successfully created agent Payments permissions!', flush=True)
        
        print(f'\n📊 Created Permissions by Section:', flush=True)
        for section in ['Ledger', 'Add Deposit', 'Bank Account']:
            section_perms = [p for p in created_permissions if p['section'] == section]
            print(f'\n{section} ({len(section_perms)} permission{"s" if len(section_perms) > 1 else ""}):', flush=True)
            for perm in section_perms:
                print(f'  • {perm["codename"]} (ID: {perm["id"]})', flush=True)

        print(f'\n💡 Total: {len(created_permissions)} agent permissions created', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
