"""
Delete edit_leads_admin and delete_leads_admin permissions from database.
Organization users should only view leads, not edit or delete them.
"""
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType

def run():
    # Find and delete edit_leads_admin permission
    try:
        edit_perm = Permission.objects.get(codename='edit_leads_admin')
        print(f"Found permission: {edit_perm.codename} - {edit_perm.name}")
        edit_perm.delete()
        print("✓ Deleted edit_leads_admin permission")
    except Permission.DoesNotExist:
        print("✗ edit_leads_admin permission not found")
    
    # Find and delete delete_leads_admin permission
    try:
        delete_perm = Permission.objects.get(codename='delete_leads_admin')
        print(f"Found permission: {delete_perm.codename} - {delete_perm.name}")
        delete_perm.delete()
        print("✓ Deleted delete_leads_admin permission")
    except Permission.DoesNotExist:
        print("✗ delete_leads_admin permission not found")
    
    print("\nDone! Edit and delete lead permissions have been removed.")
    print("Users can now only view and add leads (if they have add_leads_admin permission).")

if __name__ == '__main__':
    run()
