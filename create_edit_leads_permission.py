"""
Simple script to create edit_leads_admin permission.
Run with: python manage.py shell < create_edit_leads_permission.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType

# Get or create the content type for Lead model
try:
    from leads.models import Lead
    lead_ct = ContentType.objects.get_for_model(Lead)
    
    # Create the permission
    perm, created = Permission.objects.get_or_create(
        codename='edit_leads_admin',
        content_type=lead_ct,
        defaults={'name': 'Can edit leads in admin portal'}
    )
    
    if created:
        print(f"✓ Created permission: {perm.codename} - {perm.name}")
    else:
        print(f"ℹ Permission already exists: {perm.codename} - {perm.name}")
        
except Exception as e:
    print(f"✗ Error: {e}")
