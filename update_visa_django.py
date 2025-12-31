"""
Django Management Command to Update Visa Statuses
"""

import os
import django
import sys
import json

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from booking.models import Booking

def update_visa_statuses():
    """Update all passengers in approved bookings to have visa_status = 'Approved'"""
    
    print("\n" + "=" * 70)
    print("PAX MOVEMENT TRACKING - VISA STATUS FIX")
    print("=" * 70 + "\n")
    
    print("🔧 Fetching approved bookings for Organization 11...")
    
    try:
        # Get all approved bookings for org 11
        bookings = Booking.objects.filter(
            status='Approved',
            organization_id=11
        )
        
        total_bookings = bookings.count()
        total_passengers_updated = 0
        total_passengers = 0
        
        print(f"✅ Found {total_bookings} approved bookings\n")
        print("=" * 70)
        print("Updating Passengers...")
        print("=" * 70 + "\n")
        
        for booking in bookings:
            if not booking.person_details:
                continue
            
            person_details = booking.person_details
            passengers_in_booking = len(person_details)
            total_passengers += passengers_in_booking
            updated_count = 0
            
            print(f"📋 Booking: {booking.booking_number}")
            
            # Update each passenger's visa_status
            for i, person in enumerate(person_details):
                old_status = person.get('visa_status', 'None')
                person_name = f"{person.get('first_name', '')} {person.get('last_name', '')}"
                
                if old_status != 'Approved':
                    person['visa_status'] = 'Approved'
                    updated_count += 1
                    print(f"   ✓ Passenger {i+1}: {person_name}")
                    print(f"      {old_status} → Approved")
                else:
                    print(f"   ✓ Passenger {i+1}: {person_name} (already Approved)")
            
            # Save the booking
            booking.save()
            total_passengers_updated += updated_count
            
            if updated_count > 0:
                print(f"   📊 Updated {updated_count}/{passengers_in_booking} passengers\n")
            else:
                print(f"   ✅ All passengers already approved\n")
        
        print("=" * 70)
        print("✅ UPDATE COMPLETE!")
        print("=" * 70)
        print(f"\n📊 Summary:")
        print(f"   Total Bookings: {total_bookings}")
        print(f"   Total Passengers: {total_passengers}")
        print(f"   Passengers Updated: {total_passengers_updated}")
        print(f"   Already Approved: {total_passengers - total_passengers_updated}")
        print(f"\n🎯 Next Steps:")
        print(f"   1. Refresh the Pax Movement Tracking page")
        print(f"   2. All {total_passengers} passengers should now be visible!")
        print(f"   3. Check the statistics cards for updated counts")
        print("\n" + "=" * 70 + "\n")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = update_visa_statuses()
    
    if success:
        print("✅ Script completed successfully!")
    else:
        print("❌ Script failed. Please check the errors above.")
