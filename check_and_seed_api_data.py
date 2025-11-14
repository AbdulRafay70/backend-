import os
import django
from datetime import date, time

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
django.setup()

from organization.models import Organization
from packages.models import UmrahPackage, Airlines, City
from tickets.models import Hotels, Ticket
from django.contrib.auth import get_user_model

User = get_user_model()

ORG_ID = 8

print("Checking organization and models for seeding data (organization id=8)\n")

org = Organization.objects.filter(id=ORG_ID).first()
if not org:
    org = Organization.objects.first()
    if org:
        print(f"Organization id=8 not found, falling back to organization id={org.id} ({org.name})")
    else:
        raise SystemExit("No Organization found in database. Please create one first.")
else:
    print(f"Found organization: id={org.id} name={org.name}")

# Helper to create sample cities
def ensure_cities():
    cities = City.objects.filter(organization=org)
    if cities.count() >= 3:
        print(f"Cities >=3 present for org {org.id} (count={cities.count()})")
        return list(cities[:3])
    # create sample cities
    sample_names = ["Makkah", "Madinah", "Jeddah"]
    created = []
    for name in sample_names:
        c, created_flag = City.objects.get_or_create(organization=org, name=name, defaults={"code": name[:3].upper()})
        created.append(c)
        if created_flag:
            print(f"  Created City: {c.name}")
    return created

# 1) Airlines
airlines_count = Airlines.objects.filter(organization=org).count()
print(f"\nAirlines before: {airlines_count}")
if airlines_count == 0:
    print("Creating 3 sample Airlines...")
    sample = [
        ("SampleAir1", "SA1"),
        ("SampleAir2", "SA2"),
        ("SampleAir3", "SA3"),
    ]
    created_airlines = []
    for name, code in sample:
        a = Airlines.objects.create(organization=org, name=name, code=code)
        created_airlines.append(a)
        print(f"  Created Airline: {a.name} (id={a.id})")
else:
    print("Airlines exist; skipping creation.")

# Ensure there are cities to reference
cities = ensure_cities()

# 2) Hotels
hotels_count = Hotels.objects.filter(organization=org).count()
print(f"\nHotels before: {hotels_count}")
if hotels_count == 0:
    print("Creating 3 sample Hotels...")
    for i, city in enumerate(cities, start=1):
        h = Hotels.objects.create(
            organization=org,
            name=f"Sample Hotel {i}",
            city=city,
            address=f"Address for Sample Hotel {i}",
            contact_number=f"+92-300-00000{i}",
            category='standard'
        )
        print(f"  Created Hotel: {h.name} (id={h.id})")
else:
    print("Hotels exist; skipping creation.")

# 3) UmrahPackages
packages_count = UmrahPackage.objects.filter(organization=org).count()
print(f"\nUmrahPackages before: {packages_count}")
if packages_count == 0:
    print("Creating 3 sample UmrahPackages...")
    for i in range(1,4):
        p = UmrahPackage.objects.create(
            organization=org,
            title=f"Sample Package {i}",
            price_per_person=1000 * i,
            max_capacity=100,
            total_seats=100,
            left_seats=100,
            booked_seats=0,
            confirmed_seats=0,
            package_type='umrah'
        )
        print(f"  Created Package: {p.title} (id={p.id})")
else:
    print("UmrahPackages exist; skipping creation.")

# 4) Tickets
tickets_count = Ticket.objects.filter(organization=org).count()
print(f"\nTickets before: {tickets_count}")
if tickets_count == 0:
    print("Creating 3 sample Tickets...")
    # pick or create airlines and cities
    airline = Airlines.objects.filter(organization=org).first()
    if not airline:
        airline = Airlines.objects.create(organization=org, name='FallbackAir', code='FA')
        print(f"  Created fallback airline {airline.name}")
    origin = cities[0]
    dest = cities[1] if len(cities) > 1 else cities[0]
    for i in range(1,4):
        t = Ticket.objects.create(
            organization=org,
            airline=airline,
            flight_number=f"SA{i}00{i}",
            origin=origin,
            destination=dest,
            departure_date=date.today(),
            departure_time=time(8,0),
            arrival_date=date.today(),
            arrival_time=time(12,0),
            adult_fare=500.0 * i,
            child_fare=250.0 * i,
            infant_fare=0.0,
            pnr=f"PNR{i}ABC",
            total_seats=100,
            left_seats=100
        )
        print(f"  Created Ticket: {t} (id={t.id})")
else:
    print("Tickets exist; skipping creation.")

# Final counts
print("\nFinal counts for organization id=", org.id)
print("  Airlines:", Airlines.objects.filter(organization=org).count())
print("  Hotels:", Hotels.objects.filter(organization=org).count())
print("  UmrahPackages:", UmrahPackage.objects.filter(organization=org).count())
print("  Tickets:", Ticket.objects.filter(organization=org).count())

print("\nSample items (first 2 of each):")
for model, qs in [ (Airlines, Airlines.objects.filter(organization=org)),
                   (Hotels, Hotels.objects.filter(organization=org)),
                   (UmrahPackage, UmrahPackage.objects.filter(organization=org)),
                   (Ticket, Ticket.objects.filter(organization=org)) ]:
    print(f"\nModel: {model.__name__} (count={qs.count()})")
    for obj in qs[:2]:
        print(" ", obj)

print("\nSeeding complete.")
