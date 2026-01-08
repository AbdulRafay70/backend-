"""
Create Umrah packages using the API to ensure correct data structure.
This matches what the Add Package form would send.
"""
import os
import django
import requests
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from tickets.models import Hotels, Ticket
from organization.models import Organization
from django.contrib.auth.models import User

# Get organization 11
org = Organization.objects.get(id=11)

# Get a user for authentication (get first superuser)
user = User.objects.filter(is_superuser=True).first()

# Get hotels
makkah_hotels = list(Hotels.objects.filter(organization=org, city__name='Makkah').order_by('id')[:3])
madinah_hotels = list(Hotels.objects.filter(organization=org, city__name='Madinah').order_by('id')[:2])

# Get tickets
tickets = list(Ticket.objects.filter(organization=org).order_by('id')[:6])

print("="*80)
print("CREATING PACKAGES VIA API")
print("="*80)
print(f"\nMakkah hotels: {len(makkah_hotels)}")
print(f"Madinah hotels: {len(madinah_hotels)}")
print(f"Tickets: {len(tickets)}")

# Package configurations
packages_config = [
    {
        'title': '3 Star Economy Umrah Package',
        'rules': 'Standard terms. Cancellation 15 days before departure.',
        'total_seats': 50,
        'makkah_hotel_idx': 0,
        'madinah_hotel_idx': 0,
        'ticket_idx': 0,
    },
    {
        'title': '4 Star Standard Umrah Package',
        'rules': 'Premium package. Free cancellation 30 days before.',
        'total_seats': 40,
        'makkah_hotel_idx': 1,
        'madinah_hotel_idx': 1,
        'ticket_idx': 1,
    },
    {
        'title': '5 Star Premium Umrah Package',
        'rules': 'Luxury package. Flexible cancellation policy.',
        'total_seats': 30,
        'makkah_hotel_idx': 2,
        'madinah_hotel_idx': 0,
        'ticket_idx': 2,
    },
]

from django.core.management import call_command
from io import StringIO

# Get or create token for API authentication
from rest_framework_simplejwt.tokens import RefreshToken

if user:
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    
    print(f"\nUsing user: {user.username}")
    print(f"Token generated: {access_token[:20]}...")
    
    base_date = datetime.now().date()
    
    for idx, config in enumerate(packages_config):
        if config['makkah_hotel_idx'] >= len(makkah_hotels):
            print(f"\nSkipping {config['title']} - Makkah hotel not available")
            continue
        if config['madinah_hotel_idx'] >= len(madinah_hotels):
            print(f"\nSkipping {config['title']} - Madinah hotel not available")
            continue
        if config['ticket_idx'] >= len(tickets):
            print(f"\nSkipping {config['title']} - Ticket not available")
            continue
        
        makkah_hotel = makkah_hotels[config['makkah_hotel_idx']]
        madinah_hotel = madinah_hotels[config['madinah_hotel_idx']]
        ticket = tickets[config['ticket_idx']]
        
        # Create package payload matching the Add Package form structure
        payload = {
            'title': config['title'],
            'rules': config['rules'],
            'total_seats': config['total_seats'],
            'package_type': 'umrah',
            'status': 'active',
            'organization': org.id,
            'inventory_owner_organization_id': org.id,
            
            # Visa pricing
            'adault_visa_selling_price': 25000,
            'adault_visa_purchase_price': 20000,
            'child_visa_selling_price': 15000,
            'child_visa_purchase_price': 12000,
            'infant_visa_selling_price': 5000,
            'infant_visa_purchase_price': 4000,
            
            # Food, Ziyarat, Transport
            'food_selling_price': 1500,
            'food_purchase_price': 1000,
            'makkah_ziyarat_selling_price': 15000,
            'makkah_ziyarat_purchase_price': 12000,
            'madinah_ziyarat_selling_price': 12000,
            'madinah_ziyarat_purchase_price': 10000,
            'transport_selling_price': 20000,
            'transport_purchase_price': 15000,
            
            # Hotel details array
            'hotel_details': [
                {
                    'hotel': makkah_hotel.id,
                    'check_in_date': str(base_date),
                    'number_of_nights': 7,
                    'check_out_date': str(base_date + timedelta(days=7)),
                    'sharing_bed_selling_price': 8000,
                    'sharing_bed_purchase_price': 6400,
                    'quaint_bed_selling_price': 7000,
                    'quaint_bed_purchase_price': 5600,
                    'quad_bed_selling_price': 6500,
                    'quad_bed_purchase_price': 5200,
                    'triple_bed_selling_price': 6000,
                    'triple_bed_purchase_price': 4800,
                    'double_bed_selling_price': 5500,
                    'double_bed_purchase_price': 4400,
                },
                {
                    'hotel': madinah_hotel.id,
                    'check_in_date': str(base_date + timedelta(days=7)),
                    'number_of_nights': 7,
                    'check_out_date': str(base_date + timedelta(days=14)),
                    'sharing_bed_selling_price': 7000,
                    'sharing_bed_purchase_price': 5600,
                    'quaint_bed_selling_price': 6000,
                    'quaint_bed_purchase_price': 4800,
                    'quad_bed_selling_price': 5500,
                    'quad_bed_purchase_price': 4400,
                    'triple_bed_selling_price': 5000,
                    'triple_bed_purchase_price': 4000,
                    'double_bed_selling_price': 4500,
                    'double_bed_purchase_price': 3600,
                },
            ],
            
            # Ticket details array
            'ticket_details': [
                {
                    'ticket': ticket.id,
                    'quantity': 1,
                }
            ],
            
            # Transport details
            'transport_details': [],
            
            # Discount details
            'discount_details': [],
            
            # Room types
            'is_quaint_active': True,
            'is_sharing_active': True,
            'is_quad_active': True,
            'is_triple_active': True,
            'is_double_active': True,
            
            # Service charges
            'adault_service_charge': 2000,
            'child_service_charge': 1000,
            'infant_service_charge': 500,
            'is_service_charge_active': True,
            
            # Partial payments
            'adault_partial_payment': 50000,
            'child_partial_payment': 30000,
            'infant_partial_payment': 10000,
            'is_partial_payment_active': True,
            
            # Status
            'is_active': True,
            'reselling_allowed': True,
        }
        
        # Make API request
        url = 'http://127.0.0.1:8000/api/umrah-packages/'
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }
        
        print(f"\n{'='*80}")
        print(f"Creating: {config['title']}")
        
        try:
            response = requests.post(
                f"{url}?organization={org.id}",
                json=payload,
                headers=headers
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                print(f"✅ Created successfully!")
                print(f"   Package Code: {data.get('package_code', 'N/A')}")
                print(f"   Makkah Hotel: {makkah_hotel.name}")
                print(f"   Madinah Hotel: {madinah_hotel.name}")
                print(f"   Flight: {ticket.ticket_number}")
            else:
                print(f"❌ Failed: {response.status_code}")
                print(f"   Error: {response.text[:200]}")
        except Exception as e:
            print(f"❌ Exception: {str(e)}")

    print("\n" + "="*80)
    print("PACKAGE CREATION COMPLETE")
    print("="*80)
else:
    print("No superuser found! Please create a superuser first.")
