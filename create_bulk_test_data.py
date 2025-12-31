"""
Create Comprehensive Test Data - Multiple Passengers per Status
Adds 3-4 passengers for each movement status
"""

import os
import django
import sys
from datetime import datetime, timedelta

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from booking.models import Booking, BookingPersonDetail

def create_comprehensive_data():
    """Create multiple passengers for each status"""
    
    print("\n" + "=" * 70)
    print("CREATING COMPREHENSIVE TEST DATA")
    print("Multiple Passengers for Each Status")
    print("=" * 70 + "\n")
    
    try:
        # Get template from existing booking
        existing_booking = Booking.objects.filter(organization_id=11, status='Approved').first()
        
        if not existing_booking:
            print("❌ No existing booking found")
            return False
        
        org = existing_booking.organization
        agency = existing_booking.agency
        user_id = existing_booking.user_id if hasattr(existing_booking, 'user_id') else None
        branch_id = existing_booking.branch_id if hasattr(existing_booking, 'branch_id') else None
        
        print(f"✅ Using Organization: {org.id}")
        print(f"✅ Using Agency: {agency.id if agency else 'N/A'}\n")
        
        now = datetime.now()
        
        # Test data: [First Name, Last Name, Passport, Status Category]
        test_passengers = [
            # IN PAKISTAN (Future Departure - 5 days)
            ("Fahad", "Iqbal", "FI001001", "pakistan"),
            ("Noor", "Fatima", "NF002002", "pakistan"),
            ("Asad", "Raza", "AR003003", "pakistan"),
            
            # IN FLIGHT (Currently Flying)
            ("Kamran", "Shah", "KS004004", "flight"),
            ("Hina", "Malik", "HM005005", "flight"),
            ("Talha", "Ahmed", "TA006006", "flight"),
            ("Rabia", "Khan", "RK007007", "flight"),
            
            # IN MAKKAH (Arrived 3 days ago)
            ("Ibrahim", "Hussain", "IH008008", "makkah"),
            ("Khadija", "Ali", "KA009009", "makkah"),
            ("Yusuf", "Hassan", "YH010010", "makkah"),
            ("Mariam", "Siddiqui", "MS011011", "makkah"),
            
            # IN MADINA (Arrived 5 days ago)
            ("Umar", "Farooq", "UF012012", "madina"),
            ("Amina", "Zahra", "AZ013013", "madina"),
            ("Bilal", "Tariq", "BT014014", "madina"),
            
            # IN JEDDAH (Arrived 1 day ago)
            ("Hamza", "Qureshi", "HQ015015", "jeddah"),
            ("Safia", "Noor", "SN016016", "jeddah"),
            ("Adnan", "Rashid", "AR017017", "jeddah"),
            
            # EXIT PENDING (Return in 2 days)
            ("Faisal", "Mahmood", "FM018018", "exit_pending"),
            ("Ayesha", "Saleem", "AS019019", "exit_pending"),
            ("Imran", "Baig", "IB020020", "exit_pending"),
            ("Sana", "Akhtar", "SA021021", "exit_pending"),
            
            # EXITED KSA (Returned 2 days ago)
            ("Rizwan", "Abbasi", "RA022022", "exited"),
            ("Fatima", "Butt", "FB023023", "exited"),
            ("Naveed", "Awan", "NA024024", "exited"),
        ]
        
        created_by_status = {
            'pakistan': 0,
            'flight': 0,
            'makkah': 0,
            'madina': 0,
            'jeddah': 0,
            'exit_pending': 0,
            'exited': 0
        }
        
        print("Creating passengers...\n")
        
        for first_name, last_name, passport, status_category in test_passengers:
            try:
                # Create booking
                booking = Booking.objects.create(
                    organization=org,
                    agency=agency,
                    user_id=user_id,
                    branch_id=branch_id,
                    booking_number=f"BK-{passport}",
                    status='Approved',
                    total_pax=1,
                    total_adult=1,
                    total_child=0,
                    total_infant=0,
                    total_amount=75000.0,
                    booking_type='UMRAH',
                    is_full_package=True,
                    date=now,
                    created_at=now
                )
                
                # Create passenger
                BookingPersonDetail.objects.create(
                    booking=booking,
                    first_name=first_name,
                    last_name=last_name,
                    passport_number=passport,
                    visa_status="Approved",
                    age_group="Adult",
                    date_of_birth="1990-01-01"
                )
                
                created_by_status[status_category] += 1
                
                # Show status category
                status_icons = {
                    'pakistan': '🇵🇰',
                    'flight': '✈️',
                    'makkah': '🕋',
                    'madina': '🕌',
                    'jeddah': '🏙️',
                    'exit_pending': '⏳',
                    'exited': '✅'
                }
                
                icon = status_icons.get(status_category, '📋')
                print(f"   {icon} Created: {first_name} {last_name} ({status_category})")
                
            except Exception as e:
                print(f"   ❌ Error creating {first_name} {last_name}: {e}")
                continue
        
        print("\n" + "=" * 70)
        print("✅ TEST DATA CREATED!")
        print("=" * 70)
        print(f"\n📊 Passengers Created by Status:")
        print(f"   🇵🇰 In Pakistan: {created_by_status['pakistan']}")
        print(f"   ✈️  In Flight: {created_by_status['flight']}")
        print(f"   🕋 In Makkah: {created_by_status['makkah']}")
        print(f"   🕌 In Madina: {created_by_status['madina']}")
        print(f"   🏙️  In Jeddah: {created_by_status['jeddah']}")
        print(f"   ⏳ Exit Pending: {created_by_status['exit_pending']}")
        print(f"   ✅ Exited KSA: {created_by_status['exited']}")
        
        total_created = sum(created_by_status.values())
        print(f"\n   📈 Total New Passengers: {total_created}")
        print(f"   📈 Total in System: {total_created + 7} (including previous)")
        
        print(f"\n⚠️  IMPORTANT:")
        print(f"   These passengers need flight dates and transport details!")
        print(f"   Run the next script to add those details...")
        
        print("\n" + "=" * 70 + "\n")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = create_comprehensive_data()
    
    if success:
        print("✅ Passengers created!")
        print("📝 Next: Run 'python add_flight_dates_bulk.py' to add flight details\n")
    else:
        print("\n❌ Failed to create test data.")
