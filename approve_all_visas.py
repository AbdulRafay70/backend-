"""
Ensure all passengers have Approved visa status so they show up in passenger movements
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import BookingPersonDetail, Booking

def approve_all_passenger_visas():
    """Set all passenger visa statuses to Approved"""
    
    print("=" * 80)
    print("APPROVING ALL PASSENGER VISAS")
    print("=" * 80)
    
    # Get all passengers from Delivered bookings
    delivered_bookings = Booking.objects.filter(status='Delivered')
    
    total_passengers = 0
    approved_count = 0
    
    for booking in delivered_bookings:
        passengers = booking.person_details.all()
        
        for passenger in passengers:
            total_passengers += 1
            
            # Set visa status to Approved
            if passenger.visa_status != 'Approved':
                passenger.visa_status = 'Approved'
                passenger.save()
                approved_count += 1
                print(f"✅ Approved: {passenger.first_name} {passenger.last_name} (Booking: {booking.booking_number})")
            else:
                print(f"   Already approved: {passenger.first_name} {passenger.last_name}")
    
    print(f"\n{'='*80}")
    print(f"✅ VISA APPROVAL COMPLETE!")
    print(f"{'='*80}")
    print(f"\n📊 Summary:")
    print(f"   Total passengers in Delivered bookings: {total_passengers}")
    print(f"   Newly approved: {approved_count}")
    print(f"   Already approved: {total_passengers - approved_count}")
    
    # Verify counts by status
    print(f"\n📋 Visa Status Distribution:")
    for status in ['Approved', 'In Process', 'Pending', 'Rejected']:
        count = BookingPersonDetail.objects.filter(visa_status=status).count()
        if count > 0:
            print(f"   - {status}: {count} passengers")
    
    print(f"\n💡 All passengers in Delivered bookings now have Approved visa status!")
    print(f"   They will appear in the Passenger Movements page.")

if __name__ == '__main__':
    approve_all_passenger_visas()
