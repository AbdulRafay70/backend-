"""
Quick test script to check organization approval process
Run with: python manage.py shell < test_approval.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from universal.models import UniversalRegistration
from organization.models import Organization

print("\n" + "="*60)
print("CHECKING UNIVERSAL REGISTRATIONS AND ORGANIZATIONS")
print("="*60)

print("\n--- Pending Universal Registrations (Organizations) ---")
pending = UniversalRegistration.objects.filter(
    type='organization', 
    status='pending'
).order_by('-created_at')[:5]

for r in pending:
    print(f"  ID: {r.id}")
    print(f"  Name: {r.name}")
    print(f"  Email: {r.email}")
    print(f"  Phone: {r.contact_no}")
    print(f"  Status: {r.status}")
    print(f"  Organization ID: {r.organization_id}")
    print("-" * 40)

print("\n--- Active Universal Registrations (Organizations) ---")
active = UniversalRegistration.objects.filter(
    type='organization', 
    status='active'
).order_by('-created_at')[:5]

for r in active:
    print(f"  ID: {r.id}")
    print(f"  Name: {r.name}")
    print(f"  Email: {r.email}")
    print(f"  Phone: {r.contact_no}")
    print(f"  Status: {r.status}")
    print(f"  Organization ID: {r.organization_id}")
    print("-" * 40)

print("\n--- All Organizations in Database ---")
orgs = Organization.objects.all().order_by('-id')[:10]

for o in orgs:
    print(f"  ID: {o.id}")
    print(f"  Code: {o.org_code}")
    print(f"  Name: {o.name}")
    print(f"  Email: {o.email}")
    print(f"  Phone: {o.phone_number}")
    print("-" * 40)

print("\nTotal Pending Organizations:", pending.count())
print("Total Active Organizations:", active.count())
print("Total Organizations:", Organization.objects.count())
print("="*60 + "\n")
