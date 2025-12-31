"""
Test Data Generator for Pax Movement Tracking System
Creates bookings with various passenger statuses for testing
"""

import os
import django
import sys
from datetime import datetime, timedelta

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from booking.models import Booking
from organization.models import Organization, Agency

def create_test_bookings():
    """Create test bookings covering all passenger statuses"""
    
    print("🚀 Starting Test Data Creation for Pax Movement Tracking...")
    print("=" * 70)
    
    # Get or create organization
    try:
        org = Organization.objects.first()
        if not org:
            print("❌ No organization found. Please create an organization first.")
            return
        print(f"✅ Using Organization: {org.name} (ID: {org.id})")
    except Exception as e:
        print(f"❌ Error getting organization: {e}")
        return
    
    # Get or create agency
    try:
        agency = Agency.objects.filter(organization=org).first()
        if not agency:
            print("⚠️  No agency found. Creating test agency...")
            agency = Agency.objects.create(
                organization=org,
                ageny_name="Test Travel Agency",
                agency_code="TEST001",
                phone_number="+92-300-1234567"
            )
        print(f"✅ Using Agency: {agency.ageny_name} (ID: {agency.id})")
    except Exception as e:
        print(f"❌ Error getting/creating agency: {e}")
        return
    
    print("\n" + "=" * 70)
    print("Creating Test Bookings...")
    print("=" * 70 + "\n")
    
    # Current time for calculations
    now = datetime.now()
    
    # Test Case 1: In Pakistan (Future Departure)
    print("📝 Test Case 1: Passenger IN PAKISTAN (Future Departure)")
    booking1 = Booking.objects.create(
        organization=org,
        agency=agency,
        booking_number=f"TEST-PAK-{now.strftime('%Y%m%d%H%M%S')}",
        status="Approved",
        total_pax=2,
        total_adult=2,
        total_child=0,
        total_infant=0,
        person_details=[
            {
                "first_name": "Ahmed",
                "last_name": "Khan",
                "passport_number": "AB1234567",
                "visa_status": "Approved",
                "age_group": "Adult",
                "date_of_birth": "1990-01-15"
            },
            {
                "first_name": "Fatima",
                "last_name": "Khan",
                "passport_number": "AB1234568",
                "visa_status": "Approved",
                "age_group": "Adult",
                "date_of_birth": "1992-03-20"
            }
        ],
        ticket_details=[
            {
                "flight_number": "PK-740",
                "departure_airport": "Islamabad (ISB)",
                "arrival_airport": "Jeddah (JED)",
                "departure_date": (now + timedelta(days=5)).strftime("%Y-%m-%d"),
                "departure_time": "03:00",
                "arrival_date": (now + timedelta(days=5)).strftime("%Y-%m-%d"),
                "arrival_time": "09:00",
                "return_date": (now + timedelta(days=20)).strftime("%Y-%m-%d"),
                "return_time": "23:00",
                "return_flight_number": "PK-741"
            }
        ],
        transport_details=[
            {
                "vehicle_type_display": "Coaster",
                "sector_details": [
                    {
                        "departure_city": "Jeddah",
                        "arrival_city": "Makkah",
                        "is_airport_pickup": True,
                        "is_airport_drop": False
                    }
                ]
            }
        ]
    )
    print(f"   ✅ Created: {booking1.booking_number}")
    print(f"   📅 Departure: {(now + timedelta(days=5)).strftime('%Y-%m-%d')} 03:00")
    print(f"   👥 Passengers: 2 (Ahmed Khan, Fatima Khan)")
    print(f"   🎯 Expected Status: IN PAKISTAN\n")
    
    # Test Case 2: In Flight (Currently Flying)
    print("📝 Test Case 2: Passenger IN FLIGHT (Currently Flying)")
    flight_departure = now - timedelta(hours=2)  # Departed 2 hours ago
    flight_arrival = now + timedelta(hours=4)    # Arrives in 4 hours
    booking2 = Booking.objects.create(
        organization=org,
        agency=agency,
        booking_number=f"TEST-FLT-{now.strftime('%Y%m%d%H%M%S')}",
        status="Approved",
        total_pax=1,
        total_adult=1,
        total_child=0,
        total_infant=0,
        person_details=[
            {
                "first_name": "Usman",
                "last_name": "Ali",
                "passport_number": "CD7654321",
                "visa_status": "Approved",
                "age_group": "Adult",
                "date_of_birth": "1988-05-10"
            }
        ],
        ticket_details=[
            {
                "flight_number": "SV-722",
                "departure_airport": "Karachi (KHI)",
                "arrival_airport": "Jeddah (JED)",
                "departure_date": flight_departure.strftime("%Y-%m-%d"),
                "departure_time": flight_departure.strftime("%H:%M"),
                "arrival_date": flight_arrival.strftime("%Y-%m-%d"),
                "arrival_time": flight_arrival.strftime("%H:%M"),
                "return_date": (now + timedelta(days=15)).strftime("%Y-%m-%d"),
                "return_time": "22:00",
                "return_flight_number": "SV-723"
            }
        ],
        transport_details=[
            {
                "vehicle_type_display": "Coaster",
                "sector_details": [
                    {
                        "departure_city": "Jeddah",
                        "arrival_city": "Madina",
                        "is_airport_pickup": True,
                        "is_airport_drop": False
                    }
                ]
            }
        ]
    )
    print(f"   ✅ Created: {booking2.booking_number}")
    print(f"   📅 Departed: {flight_departure.strftime('%Y-%m-%d %H:%M')} (2 hours ago)")
    print(f"   📅 Arriving: {flight_arrival.strftime('%Y-%m-%d %H:%M')} (in 4 hours)")
    print(f"   👥 Passengers: 1 (Usman Ali)")
    print(f"   🎯 Expected Status: IN FLIGHT\n")
    
    # Test Case 3: In Makkah
    print("📝 Test Case 3: Passenger IN MAKKAH")
    arrived_3_days_ago = now - timedelta(days=3)
    booking3 = Booking.objects.create(
        organization=org,
        agency=agency,
        booking_number=f"TEST-MKH-{now.strftime('%Y%m%d%H%M%S')}",
        status="Approved",
        total_pax=3,
        total_adult=2,
        total_child=1,
        total_infant=0,
        person_details=[
            {
                "first_name": "Hassan",
                "last_name": "Raza",
                "passport_number": "EF9876543",
                "visa_status": "Approved",
                "age_group": "Adult",
                "date_of_birth": "1985-07-22"
            },
            {
                "first_name": "Ayesha",
                "last_name": "Raza",
                "passport_number": "EF9876544",
                "visa_status": "Approved",
                "age_group": "Adult",
                "date_of_birth": "1987-09-15"
            },
            {
                "first_name": "Ali",
                "last_name": "Raza",
                "passport_number": "EF9876545",
                "visa_status": "Approved",
                "age_group": "Child",
                "date_of_birth": "2015-12-10"
            }
        ],
        ticket_details=[
            {
                "flight_number": "PK-750",
                "departure_airport": "Lahore (LHE)",
                "arrival_airport": "Jeddah (JED)",
                "departure_date": arrived_3_days_ago.strftime("%Y-%m-%d"),
                "departure_time": "04:00",
                "arrival_date": arrived_3_days_ago.strftime("%Y-%m-%d"),
                "arrival_time": "10:00",
                "return_date": (now + timedelta(days=12)).strftime("%Y-%m-%d"),
                "return_time": "23:30",
                "return_flight_number": "PK-751"
            }
        ],
        transport_details=[
            {
                "vehicle_type_display": "Coaster",
                "sector_details": [
                    {
                        "departure_city": "Jeddah",
                        "arrival_city": "Makkah",
                        "is_airport_pickup": True,
                        "is_airport_drop": False
                    }
                ]
            }
        ]
    )
    print(f"   ✅ Created: {booking3.booking_number}")
    print(f"   📅 Arrived: {arrived_3_days_ago.strftime('%Y-%m-%d')} (3 days ago)")
    print(f"   👥 Passengers: 3 (Hassan, Ayesha, Ali Raza)")
    print(f"   🚌 Transport: Jeddah → Makkah")
    print(f"   🎯 Expected Status: IN MAKKAH\n")
    
    # Test Case 4: In Madina
    print("📝 Test Case 4: Passenger IN MADINA")
    arrived_5_days_ago = now - timedelta(days=5)
    booking4 = Booking.objects.create(
        organization=org,
        agency=agency,
        booking_number=f"TEST-MDN-{now.strftime('%Y%m%d%H%M%S')}",
        status="Approved",
        total_pax=2,
        total_adult=2,
        total_child=0,
        total_infant=0,
        person_details=[
            {
                "first_name": "Bilal",
                "last_name": "Ahmed",
                "passport_number": "GH1122334",
                "visa_status": "Approved",
                "age_group": "Adult",
                "date_of_birth": "1980-11-05"
            },
            {
                "first_name": "Zainab",
                "last_name": "Ahmed",
                "passport_number": "GH1122335",
                "visa_status": "Approved",
                "age_group": "Adult",
                "date_of_birth": "1982-02-18"
            }
        ],
        ticket_details=[
            {
                "flight_number": "SV-724",
                "departure_airport": "Multan (MUX)",
                "arrival_airport": "Jeddah (JED)",
                "departure_date": arrived_5_days_ago.strftime("%Y-%m-%d"),
                "departure_time": "05:00",
                "arrival_date": arrived_5_days_ago.strftime("%Y-%m-%d"),
                "arrival_time": "11:00",
                "return_date": (now + timedelta(days=10)).strftime("%Y-%m-%d"),
                "return_time": "22:00",
                "return_flight_number": "SV-725"
            }
        ],
        transport_details=[
            {
                "vehicle_type_display": "Coaster",
                "sector_details": [
                    {
                        "departure_city": "Jeddah",
                        "arrival_city": "Madina",
                        "is_airport_pickup": True,
                        "is_airport_drop": False
                    }
                ]
            }
        ]
    )
    print(f"   ✅ Created: {booking4.booking_number}")
    print(f"   📅 Arrived: {arrived_5_days_ago.strftime('%Y-%m-%d')} (5 days ago)")
    print(f"   👥 Passengers: 2 (Bilal, Zainab Ahmed)")
    print(f"   🚌 Transport: Jeddah → Madina")
    print(f"   🎯 Expected Status: IN MADINA\n")
    
    # Test Case 5: In Jeddah
    print("📝 Test Case 5: Passenger IN JEDDAH")
    arrived_1_day_ago = now - timedelta(days=1)
    booking5 = Booking.objects.create(
        organization=org,
        agency=agency,
        booking_number=f"TEST-JED-{now.strftime('%Y%m%d%H%M%S')}",
        status="Approved",
        total_pax=1,
        total_adult=1,
        total_child=0,
        total_infant=0,
        person_details=[
            {
                "first_name": "Imran",
                "last_name": "Malik",
                "passport_number": "IJ5566778",
                "visa_status": "Approved",
                "age_group": "Adult",
                "date_of_birth": "1995-04-30"
            }
        ],
        ticket_details=[
            {
                "flight_number": "PK-760",
                "departure_airport": "Faisalabad (LYP)",
                "arrival_airport": "Jeddah (JED)",
                "departure_date": arrived_1_day_ago.strftime("%Y-%m-%d"),
                "departure_time": "02:30",
                "arrival_date": arrived_1_day_ago.strftime("%Y-%m-%d"),
                "arrival_time": "08:30",
                "return_date": (now + timedelta(days=7)).strftime("%Y-%m-%d"),
                "return_time": "21:00",
                "return_flight_number": "PK-761"
            }
        ],
        transport_details=[
            {
                "vehicle_type_display": "Sedan",
                "sector_details": [
                    {
                        "departure_city": "Jeddah Airport",
                        "arrival_city": "Jeddah Hotel",
                        "is_airport_pickup": True,
                        "is_airport_drop": False
                    }
                ]
            }
        ]
    )
    print(f"   ✅ Created: {booking5.booking_number}")
    print(f"   📅 Arrived: {arrived_1_day_ago.strftime('%Y-%m-%d')} (1 day ago)")
    print(f"   👥 Passengers: 1 (Imran Malik)")
    print(f"   🚌 Transport: Jeddah Airport → Jeddah Hotel")
    print(f"   🎯 Expected Status: IN JEDDAH\n")
    
    # Test Case 6: Exit Pending (Return in 2 days)
    print("📝 Test Case 6: Passenger EXIT PENDING (Return in 2 days)")
    arrived_13_days_ago = now - timedelta(days=13)
    return_in_2_days = now + timedelta(days=2)
    booking6 = Booking.objects.create(
        organization=org,
        agency=agency,
        booking_number=f"TEST-EXP-{now.strftime('%Y%m%d%H%M%S')}",
        status="Approved",
        total_pax=2,
        total_adult=2,
        total_child=0,
        total_infant=0,
        person_details=[
            {
                "first_name": "Tariq",
                "last_name": "Hussain",
                "passport_number": "KL9988776",
                "visa_status": "Approved",
                "age_group": "Adult",
                "date_of_birth": "1978-08-12"
            },
            {
                "first_name": "Nadia",
                "last_name": "Hussain",
                "passport_number": "KL9988777",
                "visa_status": "Approved",
                "age_group": "Adult",
                "date_of_birth": "1980-10-25"
            }
        ],
        ticket_details=[
            {
                "flight_number": "SV-730",
                "departure_airport": "Peshawar (PEW)",
                "arrival_airport": "Jeddah (JED)",
                "departure_date": arrived_13_days_ago.strftime("%Y-%m-%d"),
                "departure_time": "06:00",
                "arrival_date": arrived_13_days_ago.strftime("%Y-%m-%d"),
                "arrival_time": "12:00",
                "return_date": return_in_2_days.strftime("%Y-%m-%d"),
                "return_time": "20:00",
                "return_flight_number": "SV-731"
            }
        ],
        transport_details=[
            {
                "vehicle_type_display": "Coaster",
                "sector_details": [
                    {
                        "departure_city": "Jeddah",
                        "arrival_city": "Makkah",
                        "is_airport_pickup": True,
                        "is_airport_drop": False
                    }
                ]
            }
        ]
    )
    print(f"   ✅ Created: {booking6.booking_number}")
    print(f"   📅 Arrived: {arrived_13_days_ago.strftime('%Y-%m-%d')} (13 days ago)")
    print(f"   📅 Return: {return_in_2_days.strftime('%Y-%m-%d')} (in 2 days)")
    print(f"   👥 Passengers: 2 (Tariq, Nadia Hussain)")
    print(f"   🎯 Expected Status: EXIT PENDING\n")
    
    # Test Case 7: Exited KSA (Already Returned)
    print("📝 Test Case 7: Passenger EXITED KSA (Already Returned)")
    arrived_20_days_ago = now - timedelta(days=20)
    returned_2_days_ago = now - timedelta(days=2)
    booking7 = Booking.objects.create(
        organization=org,
        agency=agency,
        booking_number=f"TEST-EXT-{now.strftime('%Y%m%d%H%M%S')}",
        status="Approved",
        total_pax=4,
        total_adult=2,
        total_child=2,
        total_infant=0,
        person_details=[
            {
                "first_name": "Rashid",
                "last_name": "Mahmood",
                "passport_number": "MN4455667",
                "visa_status": "Approved",
                "age_group": "Adult",
                "date_of_birth": "1983-06-18"
            },
            {
                "first_name": "Sana",
                "last_name": "Mahmood",
                "passport_number": "MN4455668",
                "visa_status": "Approved",
                "age_group": "Adult",
                "date_of_birth": "1985-12-22"
            },
            {
                "first_name": "Omar",
                "last_name": "Mahmood",
                "passport_number": "MN4455669",
                "visa_status": "Approved",
                "age_group": "Child",
                "date_of_birth": "2012-03-14"
            },
            {
                "first_name": "Maryam",
                "last_name": "Mahmood",
                "passport_number": "MN4455670",
                "visa_status": "Approved",
                "age_group": "Child",
                "date_of_birth": "2014-07-08"
            }
        ],
        ticket_details=[
            {
                "flight_number": "PK-770",
                "departure_airport": "Sialkot (SKT)",
                "arrival_airport": "Jeddah (JED)",
                "departure_date": arrived_20_days_ago.strftime("%Y-%m-%d"),
                "departure_time": "03:30",
                "arrival_date": arrived_20_days_ago.strftime("%Y-%m-%d"),
                "arrival_time": "09:30",
                "return_date": returned_2_days_ago.strftime("%Y-%m-%d"),
                "return_time": "23:00",
                "return_flight_number": "PK-771"
            }
        ],
        transport_details=[
            {
                "vehicle_type_display": "Coaster",
                "sector_details": [
                    {
                        "departure_city": "Jeddah",
                        "arrival_city": "Makkah",
                        "is_airport_pickup": True,
                        "is_airport_drop": False
                    },
                    {
                        "departure_city": "Makkah",
                        "arrival_city": "Madina",
                        "is_airport_pickup": False,
                        "is_airport_drop": False
                    }
                ]
            }
        ]
    )
    print(f"   ✅ Created: {booking7.booking_number}")
    print(f"   📅 Arrived: {arrived_20_days_ago.strftime('%Y-%m-%d')} (20 days ago)")
    print(f"   📅 Returned: {returned_2_days_ago.strftime('%Y-%m-%d')} (2 days ago)")
    print(f"   👥 Passengers: 4 (Rashid, Sana, Omar, Maryam Mahmood)")
    print(f"   🎯 Expected Status: EXITED KSA\n")
    
    # Test Case 8: Mixed - Some approved, some not (to test filtering)
    print("📝 Test Case 8: MIXED VISA STATUS (Testing Filter)")
    booking8 = Booking.objects.create(
        organization=org,
        agency=agency,
        booking_number=f"TEST-MIX-{now.strftime('%Y%m%d%H%M%S')}",
        status="Approved",
        total_pax=3,
        total_adult=3,
        total_child=0,
        total_infant=0,
        person_details=[
            {
                "first_name": "Approved",
                "last_name": "Passenger",
                "passport_number": "AP1111111",
                "visa_status": "Approved",
                "age_group": "Adult",
                "date_of_birth": "1990-01-01"
            },
            {
                "first_name": "Pending",
                "last_name": "Passenger",
                "passport_number": "PE2222222",
                "visa_status": "Pending",
                "age_group": "Adult",
                "date_of_birth": "1991-02-02"
            },
            {
                "first_name": "Rejected",
                "last_name": "Passenger",
                "passport_number": "RE3333333",
                "visa_status": "Rejected",
                "age_group": "Adult",
                "date_of_birth": "1992-03-03"
            }
        ],
        ticket_details=[
            {
                "flight_number": "PK-999",
                "departure_airport": "Islamabad (ISB)",
                "arrival_airport": "Jeddah (JED)",
                "departure_date": (now + timedelta(days=3)).strftime("%Y-%m-%d"),
                "departure_time": "04:00",
                "arrival_date": (now + timedelta(days=3)).strftime("%Y-%m-%d"),
                "arrival_time": "10:00",
                "return_date": (now + timedelta(days=18)).strftime("%Y-%m-%d"),
                "return_time": "22:00",
                "return_flight_number": "PK-998"
            }
        ],
        transport_details=[
            {
                "vehicle_type_display": "Coaster",
                "sector_details": [
                    {
                        "departure_city": "Jeddah",
                        "arrival_city": "Makkah",
                        "is_airport_pickup": True,
                        "is_airport_drop": False
                    }
                ]
            }
        ]
    )
    print(f"   ✅ Created: {booking8.booking_number}")
    print(f"   👥 Passengers: 3 (1 Approved, 1 Pending, 1 Rejected)")
    print(f"   🎯 Expected: Only 'Approved Passenger' should show in tracking\n")
    
    print("\n" + "=" * 70)
    print("✅ TEST DATA CREATION COMPLETE!")
    print("=" * 70)
    print("\n📊 Summary:")
    print(f"   Total Bookings Created: 8")
    print(f"   Total Passengers: 20")
    print(f"   Approved Passengers: 19 (1 pending, 1 rejected excluded)")
    print("\n🎯 Expected Status Distribution:")
    print(f"   🇵🇰 In Pakistan: 2 passengers")
    print(f"   ✈️  In Flight: 1 passenger")
    print(f"   🕋 In Makkah: 3 passengers")
    print(f"   🕌 In Madina: 2 passengers")
    print(f"   🏙️  In Jeddah: 1 passenger")
    print(f"   ⏳ Exit Pending: 2 passengers")
    print(f"   ✅ Exited KSA: 4 passengers")
    print(f"   ❌ Not Shown: 2 passengers (pending/rejected visa)")
    
    print("\n🔍 To verify, open the Pax Movement Tracking page in your browser!")
    print("=" * 70)

if __name__ == "__main__":
    try:
        create_test_bookings()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
