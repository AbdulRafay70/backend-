"""
Script to populate the database with multiple flight tickets.
This will add various flight routes with different airlines, prices, and dates.

Usage: python populate_flight_tickets.py
"""

import os
import django
import sys
from datetime import datetime, timedelta
from decimal import Decimal
import random

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from tickets.models import Ticket, TicketTripDetails
from packages.models import Airlines, City
from organization.models import Organization

def get_organization():
    """Get the first organization or create one"""
    org = Organization.objects.first()
    if not org:
        print("No organization found. Creating a default organization...")
        org = Organization.objects.create(
            name="Default Organization",
            email="default@example.com",
            phone_number="+923001234567",
            address="Default Address"
        )
        print(f"Created organization: {org.name}")
    else:
        print(f"Using organization: {org.name} (ID: {org.id})")
    return org

def get_or_create_airlines(org):
    """Get existing airlines or create them"""
    airlines_data = [
        {"name": "Saudi Arabian Airlines", "code": "SV"},
        {"name": "Pakistan International Airlines", "code": "PK"},
        {"name": "Emirates", "code": "EK"},
        {"name": "Qatar Airways", "code": "QR"},
        {"name": "Etihad Airways", "code": "EY"},
        {"name": "Flynas", "code": "XY"},
        {"name": "Air Arabia", "code": "G9"},
        {"name": "Airblue", "code": "PA"},
    ]
    
    airlines = {}
    for airline_data in airlines_data:
        airline, created = Airlines.objects.get_or_create(
            organization=org,
            code=airline_data["code"],
            defaults={
                'name': airline_data["name"],
                'is_umrah_seat': True
            }
        )
        airlines[airline_data["code"]] = airline
    
    return airlines

def get_or_create_cities(org):
    """Get existing cities or create them"""
    cities_data = [
        # Saudi Arabia
        {"name": "Jeddah", "code": "JED"},
        {"name": "Makkah", "code": "MAK"},
        {"name": "Madinah", "code": "MED"},
        {"name": "Riyadh", "code": "RUH"},
        # Pakistan
        {"name": "Karachi", "code": "KHI"},
        {"name": "Lahore", "code": "LHE"},
        {"name": "Islamabad", "code": "ISB"},
        {"name": "Peshawar", "code": "PEW"},
        {"name": "Multan", "code": "MUX"},
        {"name": "Quetta", "code": "UET"},
        # UAE (for connecting flights)
        {"name": "Dubai", "code": "DXB"},
        {"name": "Abu Dhabi", "code": "AUH"},
        # Qatar
        {"name": "Doha", "code": "DOH"},
    ]
    
    cities = {}
    for city_data in cities_data:
        city, created = City.objects.get_or_create(
            organization=org,
            code=city_data["code"],
            defaults={'name': city_data["name"]}
        )
        cities[city_data["code"]] = city
    
    return cities

def create_flight_tickets(org, airlines, cities):
    """Create multiple flight tickets with different routes"""
    print("\n✈️ Creating Flight Tickets...")
    
    # Define flight routes: (departure_city, arrival_city, airline, duration_hours)
    routes = [
        # Direct flights from Pakistan to Saudi Arabia
        ("KHI", "JED", "SV", 4.5),   # Karachi to Jeddah
        ("KHI", "JED", "PK", 4.5),
        ("LHE", "JED", "SV", 5.0),   # Lahore to Jeddah
        ("LHE", "JED", "PK", 5.0),
        ("ISB", "JED", "SV", 5.5),   # Islamabad to Jeddah
        ("ISB", "JED", "PK", 5.5),
        ("KHI", "MED", "SV", 5.0),   # Karachi to Madinah
        ("KHI", "MED", "PK", 5.0),
        ("LHE", "MED", "SV", 5.5),   # Lahore to Madinah
        ("ISB", "MED", "PK", 6.0),   # Islamabad to Madinah
        
        # Connecting flights via UAE
        ("KHI", "DXB", "EK", 2.5),   # Karachi to Dubai
        ("DXB", "JED", "EK", 3.0),   # Dubai to Jeddah
        ("LHE", "DXB", "EK", 3.0),   # Lahore to Dubai
        ("ISB", "AUH", "EY", 3.5),   # Islamabad to Abu Dhabi
        ("AUH", "JED", "EY", 3.0),   # Abu Dhabi to Jeddah
        
        # Connecting flights via Qatar
        ("KHI", "DOH", "QR", 2.0),   # Karachi to Doha
        ("DOH", "JED", "QR", 2.5),   # Doha to Jeddah
        ("LHE", "DOH", "QR", 3.0),   # Lahore to Doha
        ("DOH", "MED", "QR", 2.5),   # Doha to Madinah
        
        # Budget airlines
        ("KHI", "JED", "G9", 4.5),   # Air Arabia
        ("LHE", "JED", "PA", 5.0),   # Airblue
        ("ISB", "JED", "XY", 5.5),   # Flynas
    ]
    
    count = 0
    start_date = datetime.now() + timedelta(days=7)  # Start flights 7 days from now
    
    for i, (dep_code, arr_code, airline_code, duration) in enumerate(routes):
        # Create tickets for next 3 months on different dates
        for week in range(0, 12, 2):  # Every 2 weeks for 3 months
            flight_date = start_date + timedelta(weeks=week)
            
            # Skip if city or airline doesn't exist
            if dep_code not in cities or arr_code not in cities or airline_code not in airlines:
                continue
            
            dep_city = cities[dep_code]
            arr_city = cities[arr_code]
            airline = airlines[airline_code]
            
            # Calculate departure and arrival times
            departure_time = flight_date.replace(hour=random.choice([2, 6, 10, 14, 18, 22]), minute=random.choice([0, 15, 30, 45]))
            arrival_time = departure_time + timedelta(hours=duration)
            
            # Calculate prices based on airline and route
            base_price = 50000  # Base price in PKR
            if airline_code in ["SV", "PK"]:  # Direct flights
                base_price = 60000
            elif airline_code in ["EK", "QR", "EY"]:  # Premium connecting
                base_price = 55000
            else:  # Budget airlines
                base_price = 45000
            
            # Add variation
            price_variation = random.randint(-5000, 10000)
            adult_selling = base_price + price_variation
            adult_purchase = adult_selling * 0.85  # 15% margin
            
            child_selling = adult_selling * 0.75  # 25% discount for children
            child_purchase = child_selling * 0.85
            
            infant_selling = adult_selling * 0.10  # 90% discount for infants
            infant_purchase = infant_selling * 0.85
            
            # Create ticket
            ticket = Ticket.objects.create(
                organization=org,
                owner_organization_id=org.id,
                airline=airline,  # Pass the object, not the ID
                pnr=f"PNR{random.randint(100000, 999999)}",
                status='available',
                is_umrah_seat=True,
                total_seats=random.choice([150, 180, 200, 250, 300]),
                left_seats=random.choice([50, 80, 100, 120, 150]),
                booked_tickets=0,
                confirmed_tickets=0,
                adult_price=Decimal(str(adult_selling)),
                child_price=Decimal(str(child_selling)),
                infant_price=Decimal(str(infant_selling)),
                adult_purchase_price=Decimal(str(adult_purchase)),
                child_purchase_price=Decimal(str(child_purchase)),
                infant_purchase_price=Decimal(str(infant_purchase)),
                baggage_weight=30,
                baggage_pieces=2,
                is_refundable=random.choice([True, False]),
                is_meal_included=True,
                trip_type='round_trip',
                reselling_allowed=True,
                departure_stay_type='',
                return_stay_type='',
            )
            
            # Create departure trip detail
            TicketTripDetails.objects.create(
                ticket=ticket,
                flight_number=f"{airline_code}{random.randint(100, 999)}",
                departure_city=dep_city,  # Pass the object
                arrival_city=arr_city,  # Pass the object
                departure_date_time=departure_time,
                arrival_date_time=arrival_time,
                trip_type='departure'
            )
            
            # Create return trip (15-30 days later)
            return_date = flight_date + timedelta(days=random.randint(15, 30))
            return_departure = return_date.replace(hour=random.choice([3, 7, 11, 15, 19, 23]), minute=random.choice([0, 15, 30, 45]))
            return_arrival = return_departure + timedelta(hours=duration)
            
            TicketTripDetails.objects.create(
                ticket=ticket,
                flight_number=f"{airline_code}{random.randint(100, 999)}",
                departure_city=arr_city,  # Pass the object
                arrival_city=dep_city,  # Pass the object
                departure_date_time=return_departure,
                arrival_date_time=return_arrival,
                trip_type='return'
            )
            
            count += 1
            route_desc = f"{dep_city.name} → {arr_city.name}"
            print(f"   ✅ Created: {airline.name} - {route_desc} ({departure_time.strftime('%d %b %Y')})")
    
    print(f"   📦 Total: {count} new Flight Tickets created")
    return count

def main():
    """Main function to populate all flight ticket data"""
    print("=" * 70)
    print("✈️ Starting Flight Tickets Population")
    print("=" * 70)
    
    try:
        # Get organization
        org = get_organization()
        
        # Get or create airlines and cities
        print("\n📋 Setting up Airlines and Cities...")
        airlines = get_or_create_airlines(org)
        cities = get_or_create_cities(org)
        print(f"   ✅ Airlines: {len(airlines)}")
        print(f"   ✅ Cities: {len(cities)}")
        
        # Create flight tickets
        ticket_count = create_flight_tickets(org, airlines, cities)
        
        print("\n" + "=" * 70)
        print("✅ Flight Tickets Population Completed Successfully!")
        print("=" * 70)
        print("\n📊 Summary:")
        print(f"   - Airlines: {Airlines.objects.filter(organization=org).count()} total")
        print(f"   - Cities: {City.objects.filter(organization=org).count()} total")
        print(f"   - Flight Tickets: {Ticket.objects.filter(organization=org).count()} total")
        print(f"   - New Tickets Added: {ticket_count}")
        print("\n✨ You can now view these tickets in the admin panel!")
        
    except Exception as e:
        print(f"\n❌ Error occurred: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
