"""
Sync all existing leads to customer database.
This updates all customer records created from leads with the correct data.
Run with: python manage.py shell < sync_leads_to_customers.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from leads.models import Lead
from customers.models import Customer

# Get all leads
leads = Lead.objects.all()
print(f"Found {leads.count()} leads to sync")

synced = 0
created = 0
skipped = 0

for lead in leads:
    if not lead.customer_full_name and not lead.contact_number and not lead.email:
        skipped += 1
        continue
    
    # Try to find existing customer by phone or email
    customer = None
    if lead.contact_number:
        customer = Customer.objects.filter(phone=lead.contact_number).first()
    elif lead.email:
        customer = Customer.objects.filter(email=lead.email).first()
    
    # Prepare customer data
    customer_data = {
        'full_name': lead.customer_full_name or 'Unknown',
        'phone': lead.contact_number,
        'email': lead.email,
        'passport_number': lead.passport_number,
        'source': 'LeadsApp',
        'branch': lead.branch,
        'organization': lead.organization,
        'service_type': lead.interested_in or 'General',
        'is_active': True,
    }
    
    if customer:
        # Update existing customer
        for key, value in customer_data.items():
            if value:  # Only update non-empty values
                setattr(customer, key, value)
        customer.save()
        synced += 1
        print(f"✓ Updated customer {customer.id} from lead {lead.id}: {customer.full_name}")
    else:
        # Create new customer
        customer = Customer.objects.create(**customer_data)
        created += 1
        print(f"✓ Created customer {customer.id} from lead {lead.id}: {customer.full_name}")

print(f"\nSync complete!")
print(f"  Created: {created}")
print(f"  Updated: {synced}")
print(f"  Skipped: {skipped}")
