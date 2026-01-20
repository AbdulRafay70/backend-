"""
Delete all leads from the database.
Run with: python manage.py shell < delete_all_leads.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from leads.models import Lead

# Delete all leads
lead_count = Lead.objects.count()
print(f"Found {lead_count} leads in the database")

if lead_count > 0:
    confirm = input(f"Are you sure you want to delete all {lead_count} leads? (yes/no): ")
    if confirm.lower() == 'yes':
        Lead.objects.all().delete()
        print(f"✓ Successfully deleted all {lead_count} leads")
    else:
        print("✗ Deletion cancelled")
else:
    print("No leads found in the database")
