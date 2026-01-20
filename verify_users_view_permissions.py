"""
Script to verify and list all view_*_users_admin permissions.
Run with: python verify_users_view_permissions.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission

def main():
    print('\n🔍 Verifying view_*_users_admin permissions...\n', flush=True)

    try:
        # Expected permissions
        expected_perms = [
            'view_add_users_admin',
            'view_super_admin_users_admin',
            'view_admin_users_admin',
            'view_agent_users_admin',
            'view_area_agent_users_admin',
            'view_employee_users_admin',
            'view_branch_users_admin'
        ]

        print('📋 Checking for expected permissions:\n', flush=True)
        found_count = 0
        missing = []

        for codename in expected_perms:
            try:
                perm = Permission.objects.get(codename=codename)
                print(f'✅ Found: {codename} (ID: {perm.id})', flush=True)
                found_count += 1
            except Permission.DoesNotExist:
                print(f'❌ MISSING: {codename}', flush=True)
                missing.append(codename)

        print(f'\n📊 Summary:', flush=True)
        print(f'  • Found: {found_count}/{len(expected_perms)}', flush=True)
        print(f'  • Missing: {len(missing)}', flush=True)

        if missing:
            print(f'\n⚠️  Missing permissions:', flush=True)
            for m in missing:
                print(f'  • {m}', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
