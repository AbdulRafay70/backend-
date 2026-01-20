"""
Script to delete old commission_admin and payments_admin permissions from Finance.
These were replaced by hr_commission_admin and hr_payments_admin for HR.
Run with: python delete_old_finance_commission_payments.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission

def main():
    print('\n🔧 Deleting old commission and payments permissions from Finance...\n', flush=True)

    try:
        # Delete old commission_admin permissions
        print('Deleting old commission_admin permissions...', flush=True)
        commission_perms_to_delete = [
            'view_commission_admin',
            'add_commission_admin',
            'edit_commission_admin',
            'delete_commission_admin'
        ]

        deleted_count = 0
        for codename in commission_perms_to_delete:
            try:
                perm = Permission.objects.get(codename=codename)
                perm.delete()
                print(f'  ❌ Deleted: {codename}', flush=True)
                deleted_count += 1
            except Permission.DoesNotExist:
                print(f'  ⚠️  Not found: {codename}', flush=True)

        # Delete old payments_admin permissions
        print('\nDeleting old payments_admin permissions...', flush=True)
        payments_perms_to_delete = [
            'view_payments_admin',
            'add_payments_admin',
            'edit_payments_admin',
            'delete_payments_admin'
        ]

        for codename in payments_perms_to_delete:
            try:
                perm = Permission.objects.get(codename=codename)
                perm.delete()
                print(f'  ❌ Deleted: {codename}', flush=True)
                deleted_count += 1
            except Permission.DoesNotExist:
                print(f'  ⚠️  Not found: {codename}', flush=True)

        print(f'\n✅ Successfully deleted {deleted_count} old permissions!', flush=True)
        print(f'\n💡 These permissions were replaced by:', flush=True)
        print(f'  • hr_commission_admin (in HR category)', flush=True)
        print(f'  • hr_payments_admin (in HR category)', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
