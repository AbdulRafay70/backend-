"""
Create 6 Umrah packages with complete details:
- Hotels (names only, custom pricing)
- Flights from database
- Visa, Food, Ziyarat, Transport pricing
- Each package has unique details
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
from rest_framework_simplejwt.tokens import RefreshToken

# Get organization 11
org = Organization.objects.get(id=11)
user = User.objects.filter(is_superuser=True).first()

# Get hotels (for names only)
makkah_hotels = list(Hotels.objects.filter(organization=org, city__name='Makkah').order_by('id'))
madinah_hotels = list(Hotels.objects.filter(organization=org, city__name='Madinah').order_by('id'))

# Get tickets from database
tickets = list(Ticket.objects.filter(organization=org).order_by('id')[:6])

print("="*80)
print("CREATING 6 UMRAH PACKAGES WITH COMPLETE DETAILS")
print("="*80)
print(f"\nAvailable resources:")
print(f"  Makkah hotels: {len(makkah_hotels)}")
print(f"  Madinah hotels: {len(madinah_hotels)}")
print(f"  Tickets: {len(tickets)}")

# Generate token
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)

base_date = datetime.now().date()

# 6 Package configurations with unique details
packages_config = [
    {
        'title': '3 Star Budget Umrah Package - 14 Days',
        'rules': 'Budget-friendly package. Cancellation fee applies 30 days before departure.',
        'total_seats': 60,
        'makkah_hotel_idx': 0,
        'madinah_hotel_idx': 0,
        'ticket_idx': 0,
        'makkah_nights': 7,
        'madinah_nights': 7,
        # Custom hotel pricing (not from hotel database)
        'makkah_sharing': 6000, 'makkah_sharing_p': 4800,
        'makkah_quint': 5500, 'makkah_quint_p': 4400,
        'makkah_quad': 5000, 'makkah_quad_p': 4000,
        'makkah_triple': 4500, 'makkah_triple_p': 3600,
        'makkah_double': 4000, 'makkah_double_p': 3200,
        'madina_sharing': 5500, 'madina_sharing_p': 4400,
        'madina_quint': 5000, 'madina_quint_p': 4000,
        'madina_quad': 4500, 'madina_quad_p': 3600,
        'madina_triple': 4000, 'madina_triple_p': 3200,
        'madina_double': 3500, 'madina_double_p': 2800,
        # Visa pricing
        'adult_visa_s': 22000, 'adult_visa_p': 18000,
        'child_visa_s': 13000, 'child_visa_p': 10000,
        'infant_visa_s': 4000, 'infant_visa_p': 3000,
        # Extras
        'food_s': 1200, 'food_p': 800,
        'makkah_ziyarat_s': 12000, 'makkah_ziyarat_p': 9000,
        'madina_ziyarat_s': 10000, 'madina_ziyarat_p': 7500,
        'transport_s': 15000, 'transport_p': 12000,
    },
    {
        'title': '4 Star Comfort Umrah Package - 21 Days',
        'rules': 'Comfortable stay with quality hotels. Free cancellation 45 days before.',
        'total_seats': 45,
        'makkah_hotel_idx': 1,
        'madinah_hotel_idx': 1,
        'ticket_idx': 1,
        'makkah_nights': 10,
        'madinah_nights': 11,
        'makkah_sharing': 9000, 'makkah_sharing_p': 7200,
        'makkah_quint': 8000, 'makkah_quint_p': 6400,
        'makkah_quad': 7500, 'makkah_quad_p': 6000,
        'makkah_triple': 7000, 'makkah_triple_p': 5600,
        'makkah_double': 6500, 'makkah_double_p': 5200,
        'madina_sharing': 8000, 'madina_sharing_p': 6400,
        'madina_quint': 7000, 'madina_quint_p': 5600,
        'madina_quad': 6500, 'madina_quad_p': 5200,
        'madina_triple': 6000, 'madina_triple_p': 4800,
        'madina_double': 5500, 'madina_double_p': 4400,
        'adult_visa_s': 25000, 'adult_visa_p': 20000,
        'child_visa_s': 15000, 'child_visa_p': 12000,
        'infant_visa_s': 5000, 'infant_visa_p': 4000,
        'food_s': 1500, 'food_p': 1000,
        'makkah_ziyarat_s': 15000, 'makkah_ziyarat_p': 12000,
        'madina_ziyarat_s': 12000, 'madina_ziyarat_p': 10000,
        'transport_s': 20000, 'transport_p': 15000,
    },
    {
        'title': '5 Star Deluxe Umrah Package - 21 Days',
        'rules': 'Premium hotels near Haram. Flexible cancellation up to 60 days.',
        'total_seats': 35,
        'makkah_hotel_idx': 2,
        'madinah_hotel_idx': 0,
        'ticket_idx': 2,
        'makkah_nights': 10,
        'madinah_nights': 11,
        'makkah_sharing': 12000, 'makkah_sharing_p': 9600,
        'makkah_quint': 11000, 'makkah_quint_p': 8800,
        'makkah_quad': 10000, 'makkah_quad_p': 8000,
        'makkah_triple': 9000, 'makkah_triple_p': 7200,
        'makkah_double': 8000, 'makkah_double_p': 6400,
        'madina_sharing': 10000, 'madina_sharing_p': 8000,
        'madina_quint': 9000, 'madina_quint_p': 7200,
        'madina_quad': 8500, 'madina_quad_p': 6800,
        'madina_triple': 8000, 'madina_triple_p': 6400,
        'madina_double': 7500, 'madina_double_p': 6000,
        'adult_visa_s': 28000, 'adult_visa_p': 23000,
        'child_visa_s': 17000, 'child_visa_p': 14000,
        'infant_visa_s': 6000, 'infant_visa_p': 5000,
        'food_s': 2000, 'food_p': 1500,
        'makkah_ziyarat_s': 18000, 'makkah_ziyarat_p': 15000,
        'madina_ziyarat_s': 15000, 'madina_ziyarat_p': 12000,
        'transport_s': 25000, 'transport_p': 20000,
    },
    {
        'title': '5 Star VIP Umrah Package - 28 Days',
        'rules': 'Ultimate luxury experience. Full refund 90 days before departure.',
        'total_seats': 25,
        'makkah_hotel_idx': 1,
        'madinah_hotel_idx': 1,
        'ticket_idx': 3,
        'makkah_nights': 14,
        'madinah_nights': 14,
        'makkah_sharing': 15000, 'makkah_sharing_p': 12000,
        'makkah_quint': 14000, 'makkah_quint_p': 11200,
        'makkah_quad': 13000, 'makkah_quad_p': 10400,
        'makkah_triple': 12000, 'makkah_triple_p': 9600,
        'makkah_double': 11000, 'makkah_double_p': 8800,
        'madina_sharing': 13000, 'madina_sharing_p': 10400,
        'madina_quint': 12000, 'madina_quint_p': 9600,
        'madina_quad': 11000, 'madina_quad_p': 8800,
        'madina_triple': 10000, 'madina_triple_p': 8000,
        'madina_double': 9000, 'madina_double_p': 7200,
        'adult_visa_s': 30000, 'adult_visa_p': 25000,
        'child_visa_s': 18000, 'child_visa_p': 15000,
        'infant_visa_s': 7000, 'infant_visa_p': 6000,
        'food_s': 2500, 'food_p': 2000,
        'makkah_ziyarat_s': 20000, 'makkah_ziyarat_p': 17000,
        'madina_ziyarat_s': 18000, 'madina_ziyarat_p': 15000,
        'transport_s': 30000, 'transport_p': 25000,
    },
    {
        'title': 'Family Special Umrah Package - 21 Days',
        'rules': 'Perfect for families. Kids under 2 travel free. Flexible dates.',
        'total_seats': 50,
        'makkah_hotel_idx': 0,
        'madinah_hotel_idx': 1,
        'ticket_idx': 4,
        'makkah_nights': 10,
        'madinah_nights': 11,
        'makkah_sharing': 8500, 'makkah_sharing_p': 6800,
        'makkah_quint': 7500, 'makkah_quint_p': 6000,
        'makkah_quad': 7000, 'makkah_quad_p': 5600,
        'makkah_triple': 6500, 'makkah_triple_p': 5200,
        'makkah_double': 6000, 'makkah_double_p': 4800,
        'madina_sharing': 7500, 'madina_sharing_p': 6000,
        'madina_quint': 6500, 'madina_quint_p': 5200,
        'madina_quad': 6000, 'madina_quad_p': 4800,
        'madina_triple': 5500, 'madina_triple_p': 4400,
        'madina_double': 5000, 'madina_double_p': 4000,
        'adult_visa_s': 24000, 'adult_visa_p': 19000,
        'child_visa_s': 14000, 'child_visa_p': 11000,
        'infant_visa_s': 3000, 'infant_visa_p': 2500,
        'food_s': 1400, 'food_p': 900,
        'makkah_ziyarat_s': 14000, 'makkah_ziyarat_p': 11000,
        'madina_ziyarat_s': 11000, 'madina_ziyarat_p': 8500,
        'transport_s': 18000, 'transport_p': 14000,
    },
    {
        'title': 'Ramadan Special Umrah Package - 15 Days',
        'rules': 'Special Ramadan package with Iftar arrangements. Limited seats.',
        'total_seats': 40,
        'makkah_hotel_idx': 2,
        'madinah_hotel_idx': 0,
        'ticket_idx': 5,
        'makkah_nights': 8,
        'madinah_nights': 7,
        'makkah_sharing': 11000, 'makkah_sharing_p': 8800,
        'makkah_quint': 10000, 'makkah_quint_p': 8000,
        'makkah_quad': 9500, 'makkah_quad_p': 7600,
        'makkah_triple': 9000, 'makkah_triple_p': 7200,
        'makkah_double': 8500, 'makkah_double_p': 6800,
        'madina_sharing': 9500, 'madina_sharing_p': 7600,
        'madina_quint': 8500, 'madina_quint_p': 6800,
        'madina_quad': 8000, 'madina_quad_p': 6400,
        'madina_triple': 7500, 'madina_triple_p': 6000,
        'madina_double': 7000, 'madina_double_p': 5600,
        'adult_visa_s': 27000, 'adult_visa_p': 22000,
        'child_visa_s': 16000, 'child_visa_p': 13000,
        'infant_visa_s': 5500, 'infant_visa_p': 4500,
        'food_s': 1800, 'food_p': 1300,
        'makkah_ziyarat_s': 16000, 'makkah_ziyarat_p': 13000,
        'madina_ziyarat_s': 13000, 'madina_ziyarat_p': 10500,
        'transport_s': 22000, 'transport_p': 17000,
    },
]

created_count = 0

for idx, config in enumerate(packages_config):
    if config['ticket_idx'] >= len(tickets):
        print(f"\nSkipping {config['title']} - Ticket not available")
        continue
    
    if config['makkah_hotel_idx'] >= len(makkah_hotels):
        print(f"\nSkipping {config['title']} - Makkah hotel not available")
        continue
    
    if config['madinah_hotel_idx'] >= len(madinah_hotels):
        print(f"\nSkipping {config['title']} - Madinah hotel not available")
        continue
    
    makkah_hotel = makkah_hotels[config['makkah_hotel_idx']]
    madinah_hotel = madinah_hotels[config['madinah_hotel_idx']]
    ticket = tickets[config['ticket_idx']]
    
    # Create package payload
    payload = {
        'title': config['title'],
        'rules': config['rules'],
        'total_seats': config['total_seats'],
        'package_type': 'umrah',
        'status': 'active',
        'organization': org.id,
        'inventory_owner_organization_id': org.id,
        
        # Visa pricing (unique for each package)
        'adault_visa_selling_price': config['adult_visa_s'],
        'adault_visa_purchase_price': config['adult_visa_p'],
        'child_visa_selling_price': config['child_visa_s'],
        'child_visa_purchase_price': config['child_visa_p'],
        'infant_visa_selling_price': config['infant_visa_s'],
        'infant_visa_purchase_price': config['infant_visa_p'],
        
        # Food, Ziyarat, Transport (unique for each package)
        'food_selling_price': config['food_s'],
        'food_purchase_price': config['food_p'],
        'makkah_ziyarat_selling_price': config['makkah_ziyarat_s'],
        'makkah_ziyarat_purchase_price': config['makkah_ziyarat_p'],
        'madinah_ziyarat_selling_price': config['madina_ziyarat_s'],
        'madinah_ziyarat_purchase_price': config['madina_ziyarat_p'],
        'transport_selling_price': config['transport_s'],
        'transport_purchase_price': config['transport_p'],
        
        # Hotel details with CUSTOM pricing (not from hotel database)
        'hotel_details': [
            {
                'hotel': makkah_hotel.id,
                'check_in_date': str(base_date),
                'number_of_nights': config['makkah_nights'],
                'check_out_date': str(base_date + timedelta(days=config['makkah_nights'])),
                'sharing_bed_selling_price': config['makkah_sharing'],
                'sharing_bed_purchase_price': config['makkah_sharing_p'],
                'quaint_bed_selling_price': config['makkah_quint'],
                'quaint_bed_purchase_price': config['makkah_quint_p'],
                'quad_bed_selling_price': config['makkah_quad'],
                'quad_bed_purchase_price': config['makkah_quad_p'],
                'triple_bed_selling_price': config['makkah_triple'],
                'triple_bed_purchase_price': config['makkah_triple_p'],
                'double_bed_selling_price': config['makkah_double'],
                'double_bed_purchase_price': config['makkah_double_p'],
            },
            {
                'hotel': madinah_hotel.id,
                'check_in_date': str(base_date + timedelta(days=config['makkah_nights'])),
                'number_of_nights': config['madinah_nights'],
                'check_out_date': str(base_date + timedelta(days=config['makkah_nights'] + config['madinah_nights'])),
                'sharing_bed_selling_price': config['madina_sharing'],
                'sharing_bed_purchase_price': config['madina_sharing_p'],
                'quaint_bed_selling_price': config['madina_quint'],
                'quaint_bed_purchase_price': config['madina_quint_p'],
                'quad_bed_selling_price': config['madina_quad'],
                'quad_bed_purchase_price': config['madina_quad_p'],
                'triple_bed_selling_price': config['madina_triple'],
                'triple_bed_purchase_price': config['madina_triple_p'],
                'double_bed_selling_price': config['madina_double'],
                'double_bed_purchase_price': config['madina_double_p'],
            },
        ],
        
        # Ticket from database
        'ticket_details': [
            {
                'ticket': ticket.id,
                'quantity': 1,
            }
        ],
        
        'transport_details': [],
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
    print(f"Creating Package {idx+1}/6: {config['title']}")
    
    try:
        response = requests.post(
            f"{url}?organization={org.id}",
            json=payload,
            headers=headers
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            print(f"✅ SUCCESS!")
            print(f"   Code: {data.get('package_code', 'N/A')}")
            print(f"   Makkah: {makkah_hotel.name} ({config['makkah_nights']} nights)")
            print(f"   Madinah: {madinah_hotel.name} ({config['madinah_nights']} nights)")
            print(f"   Flight: {ticket.ticket_number}")
            print(f"   Visa: Adult {config['adult_visa_s']}, Child {config['child_visa_s']}, Infant {config['infant_visa_s']}")
            created_count += 1
        else:
            print(f"❌ FAILED: {response.status_code}")
            print(f"   Error: {response.text[:300]}")
    except Exception as e:
        print(f"❌ Exception: {str(e)}")

print("\n" + "="*80)
print(f"✅ CREATED {created_count}/6 PACKAGES SUCCESSFULLY!")
print("="*80)
