"""
Seed many types of fake data for development/testing.
Run with:
python manage.py shell -c "from pathlib import Path; exec(Path(r'c:\\Users\\Abdul Rafay\\Downloads\\All\\All\\create_fake_many.py').read_text())"
"""
import os
import django
from datetime import date, time, timedelta
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from organization.models import Organization, Branch
from django.contrib.auth import get_user_model
from packages.models import Airlines, City, TransportSectorPrice, UmrahPackage
from tickets.models import Hotels, Ticket
from customers.models import Customer

User = get_user_model()

try:
    org = Organization.objects.first()
    if not org:
        org = Organization.objects.create(name='SeedOrg')
        print(f"Created organization: {org}")
    else:
        print(f"Using organization: {org} (id={org.id})")

    branch = Branch.objects.filter(organization=org).first()
    if not branch:
        branch = Branch.objects.create(organization=org, name='Main Branch')
        print(f"Created branch: {branch}")

    # Ensure a user exists
    user = User.objects.first()
    if not user:
        user = User.objects.create_user(username='seeduser', email='seed@example.com', password='seedpass')
        print(f"Created user: {user}")

    # Cities
    city_names = ["Makkah", "Madinah", "Jeddah", "Riyadh", "Dammam"]
    cities = []
    for name in city_names:
        c, created = City.objects.get_or_create(organization=org, name=name, defaults={'code': name[:3].upper()})
        cities.append(c)
        if created:
            print(f"Created City: {c.name}")

    # Airlines
    airline_samples = [("SaerAir", "SAE"), ("GulfWings", "GW"), ("DesertFly", "DF")]
    airlines = []
    for name, code in airline_samples:
        a, created = Airlines.objects.get_or_create(organization=org, name=name, defaults={'code':code})
        airlines.append(a)
        if created:
            print(f"Created Airline: {a.name}")

    # Hotels
    hotels = []
    for i, city in enumerate(cities[:4], start=1):
        h, created = Hotels.objects.get_or_create(
            organization=org,
            name=f"Sample Hotel {i} {city.name}",
            defaults={
                'city': city,
                'address': f"Address {i} in {city.name}",
                'contact_number': f"+92-300-10010{i}",
                'category': '4-star'
            }
        )
        hotels.append(h)
        if created:
            print(f"Created Hotel: {h.name}")

    # Transport sectors
    transports = [
        {"reference": "makkah_madinah", "name": "Makkah to Madinah Transfer", "vehicle_type": 1, "adault_price": 120.0},
        {"reference": "airport_makkah", "name": "Jeddah Airport to Makkah", "vehicle_type": 2, "adault_price": 250.0},
        {"reference": "ziyarat_madinah", "name": "Madinah Ziyarat", "vehicle_type": 3, "adault_price": 80.0},
    ]
    for tr in transports:
        t, created = TransportSectorPrice.objects.get_or_create(
            organization=org,
            reference=tr['reference'],
            defaults={
                'name': tr['name'],
                'vehicle_type': tr['vehicle_type'],
                'adault_price': tr['adault_price'],
                'child_price': tr.get('child_price', tr['adault_price']/2),
                'infant_price': tr.get('infant_price', 0),
                'is_visa': False,
                'only_transport_charge': True,
            }
        )
        if created:
            print(f"Created Transport Sector: {t.name}")

    # Tickets
    tickets = []
    for i in range(1,6):
        airline = random.choice(airlines)
        origin = random.choice(cities)
        dest = random.choice([c for c in cities if c != origin])
        t, created = Ticket.objects.get_or_create(
            organization=org,
            pnr=f"SEEDPNR{i}",
            defaults={
                'airline': airline,
                'flight_number': f"SD{i}0{i}",
                'origin': origin,
                'destination': dest,
                'departure_date': date.today() + timedelta(days=i),
                'departure_time': time(9, 0),
                'arrival_date': date.today() + timedelta(days=i),
                'arrival_time': time(13, 0),
                'adult_fare': 300.0 + i*50,
                'child_fare': 150.0 + i*25,
                'infant_fare': 0.0,
                'total_seats': 100,
                'left_seats': 100,
            }
        )
        tickets.append(t)
        if created:
            print(f"Created Ticket: PNR={t.pnr} airline={t.airline}")

    # Umrah Packages
    for i in range(1,6):
        p, created = UmrahPackage.objects.get_or_create(
            organization=org,
            title=f"Seed Package {i}",
            defaults={
                'price_per_person': 500.0 * i,
                'max_capacity': 100 + i*10,
                'total_seats': 100 + i*10,
                'left_seats': 100 + i*10,
                'booked_seats': 0,
                'confirmed_seats': 0,
                'package_type': 'umrah'
            }
        )
        if created:
            print(f"Created Package: {p.title}")

    # Customers
    sample_customers = [
        {"full_name": "Seed Ali", "phone": "+92-300-0000001", "email": "seed.ali@example.com", "city":"Lahore"},
        {"full_name": "Seed Sara", "phone": "+92-300-0000002", "email": "seed.sara@example.com", "city":"Karachi"},
        {"full_name": "Seed Ahmed", "phone": "+92-300-0000003", "email": "seed.ahmed@example.com", "city":"Islamabad"},
    ]
    created_c = 0
    for cdata in sample_customers:
        cust, created = Customer.objects.get_or_create(
            phone=cdata['phone'],
            defaults={
                'full_name': cdata['full_name'],
                'email': cdata['email'],
                'city': cdata['city'],
                'organization': org,
                'branch': branch,
                'is_active': True
            }
        )
        if created:
            created_c += 1
            print(f"Created Customer: {cust.full_name}")

    print("\nSeeding complete. Summary:")
    print("  Cities:", City.objects.filter(organization=org).count())
    print("  Airlines:", Airlines.objects.filter(organization=org).count())
    print("  Hotels:", Hotels.objects.filter(organization=org).count())
    print("  Tickets:", len(tickets))
    print("  Transport Sectors:", TransportSectorPrice.objects.filter(organization=org).count())
    print("  Packages:", UmrahPackage.objects.filter(organization=org).count())
    print("  New Customers:", created_c)

except Exception as e:
    print(f"Error seeding data: {e}")
    import traceback
    traceback.print_exc()
