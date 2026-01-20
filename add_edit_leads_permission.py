"""
Add edit_leads_admin permission to database.
This permission controls whether users can edit leads and see the Actions column.
"""
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from leads.models import Lead

def run():
    # Get the Lead content type
    try:
        lead_content_type = ContentType.objects.get(app_label='leads', model='lead')
    except ContentType.DoesNotExist:
        print("✗ Lead content type not found")
        return
    
    # Create edit_leads_admin permission
    permission, created = Permission.objects.get_or_create(
        codename='edit_leads_admin',
        content_type=lead_content_type,
        defaults={'name': 'Can edit leads in admin portal'}
    )
    
    if created:
        print(f"✓ Created permission: {permission.codename} - {permission.name}")
    else:
        print(f"ℹ Permission already exists: {permission.codename} - {permission.name}")
    
    print("\nDone! edit_leads_admin permission is now available.")
    print("Users with this permission can see and use the Actions column in Leads table.")

if __name__ == '__main__':
    run()
