"""
Delete delete_loan_admin permission from database.
Loans should be editable but not deletable.
"""
from django.contrib.auth.models import Permission

def run():
    # Find and delete delete_loan_admin permission
    try:
        delete_perm = Permission.objects.get(codename='delete_loan_admin')
        print(f"Found permission: {delete_perm.codename} - {delete_perm.name}")
        delete_perm.delete()
        print("✓ Deleted delete_loan_admin permission")
    except Permission.DoesNotExist:
        print("✗ delete_loan_admin permission not found")
    
    print("\nDone! Delete loan permission has been removed.")
    print("Users can now only view, add, and edit loans (if they have corresponding permissions).")

if __name__ == '__main__':
    run()
