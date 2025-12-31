"""
Script to add flight/ticket details to existing Umrah packages.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage
from tickets.models import Ticket
from organization.models import Organization

# Get organization 11
org = Organization.objects.get(id=11)

print("="*80)
print("ADDING FLIGHT DETAILS TO PACKAGES")
print("="*80)

# Get all packages
packages = UmrahPackage.objects.filter(organization=org).order_by('id')
print(f"\nFound {packages.count()} packages")

# Get all tickets
tickets = Ticket.objects.filter(organization=org).order_by('id')
print(f"Found {tickets.count()} tickets")

if tickets.count() == 0:
    print("\n❌ No tickets found! Please create tickets first.")
    exit(1)

# Assign tickets to packages
updated_count = 0
for idx, package in enumerate(packages):
    # Assign ticket in round-robin fashion
    ticket = tickets[idx % tickets.count()]
    
    # Update package with ticket
    package.ticket = ticket
    package.save()
    
    print(f"\n✓ {package.title}")
    print(f"  Assigned ticket: {ticket.ticket_number}")
    print(f"  Airline: {ticket.airline.name if ticket.airline else 'N/A'}")
    
    updated_count += 1

print("\n" + "="*80)
print(f"✅ Updated {updated_count} packages with flight details!")
print("="*80)
