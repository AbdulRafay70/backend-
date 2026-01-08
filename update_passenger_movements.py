"""
Update passenger movement statuses for testing:
- Set different passengers to different statuses (In Pakistan, In Flight, In Makkah, In Madinah, etc.)
- Update current_city field
- Set exit_verified status
- Update shirkat_report status
"""

import os
import sys
import django
from datetime import datetime
import random

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import BookingPersonDetail

def update_passenger_movements():
    """Update passenger statuses for movement tracking"""
    
    print("=" * 80)
    print("UPDATING PASSENGER MOVEMENT STATUSES")
    print("=" * 80)
    
    # Get all passengers
    passengers = list(BookingPersonDetail.objects.all().order_by('id'))
    total = len(passengers)
    
    print(f"\n📊 Total Passengers: {total}")
    
    # Define status distribution
    statuses = [
        ('in_pakistan', 'Pakistan', 15),      # 15 in Pakistan
        ('in_flight', 'In Flight', 5),        # 5 in flight
        ('in_makkah', 'Makkah', 10),          # 10 in Makkah
        ('in_madinah', 'Madinah', 6),         # 6 in Madinah
        ('exit_pending', 'Jeddah', 2),        # 2 exit pending
        ('exited_ksa', 'Pakistan', 1),        # 1 exited
    ]
    
    # Distribute passengers across statuses
    passenger_index = 0
    
    for status_code, city, count in statuses:
        print(f"\n{'='*80}")
        print(f"Setting {count} passengers to: {status_code} ({city})")
        print(f"{'='*80}")
        
        for i in range(count):
            if passenger_index >= total:
                break
            
            passenger = passengers[passenger_index]
            
            # Update status
            passenger.movement_status = status_code
            passenger.current_city = city
            
            # Set exit verified for exited passengers
            if status_code == 'exited_ksa':
                passenger.exit_verified = True
                passenger.exit_verified_at = datetime.now()
            else:
                passenger.exit_verified = False
            
            # Set shirkat report (random)
            if status_code in ['in_makkah', 'in_madinah', 'exit_pending']:
                passenger.shirkat_report = random.choice(['reported', 'not_reported', 'pending'])
            else:
                passenger.shirkat_report = 'not_reported'
            
            passenger.save()
            
            print(f"   ✅ {passenger.pax_id}: {passenger.first_name} {passenger.last_name} → {status_code} ({city})")
            
            passenger_index += 1
    
    print(f"\n{'='*80}")
    print("✅ PASSENGER STATUSES UPDATED!")
    print(f"{'='*80}")
    
    # Summary
    print(f"\n📊 MOVEMENT STATUS SUMMARY:")
    
    status_counts = {
        'in_pakistan': BookingPersonDetail.objects.filter(movement_status='in_pakistan').count(),
        'in_flight': BookingPersonDetail.objects.filter(movement_status='in_flight').count(),
        'in_makkah': BookingPersonDetail.objects.filter(movement_status='in_makkah').count(),
        'in_madinah': BookingPersonDetail.objects.filter(movement_status='in_madinah').count(),
        'exit_pending': BookingPersonDetail.objects.filter(movement_status='exit_pending').count(),
        'exited_ksa': BookingPersonDetail.objects.filter(movement_status='exited_ksa').count(),
    }
    
    print(f"\n   🇵🇰 In Pakistan:     {status_counts['in_pakistan']} passengers")
    print(f"   ✈️  In Flight:        {status_counts['in_flight']} passengers")
    print(f"   🕋 In Makkah:        {status_counts['in_makkah']} passengers")
    print(f"   🕌 In Madinah:       {status_counts['in_madinah']} passengers")
    print(f"   ⏳ Exit Pending:     {status_counts['exit_pending']} passengers")
    print(f"   ✅ Exited KSA:       {status_counts['exited_ksa']} passengers")
    
    # City distribution
    print(f"\n   📍 BY CITY:")
    cities = BookingPersonDetail.objects.values_list('current_city', flat=True).distinct()
    for city in cities:
        if city:
            count = BookingPersonDetail.objects.filter(current_city=city).count()
            print(f"   - {city}: {count} passengers")
    
    # Exit verified
    exit_verified_count = BookingPersonDetail.objects.filter(exit_verified=True).count()
    print(f"\n   ✅ Exit Verified: {exit_verified_count} passengers")
    
    # Shirkat report
    print(f"\n   📋 SHIRKAT REPORT STATUS:")
    for status in ['reported', 'not_reported', 'pending']:
        count = BookingPersonDetail.objects.filter(shirkat_report=status).count()
        if count > 0:
            print(f"   - {status.replace('_', ' ').title()}: {count} passengers")
    
    print(f"\n{'='*80}")
    print("🎉 PASSENGER MOVEMENTS READY FOR TESTING!")
    print(f"{'='*80}")
    
    # Sample passengers in each status
    print(f"\n📋 SAMPLE PASSENGERS BY STATUS:")
    
    for status_code, city, _ in statuses:
        sample = BookingPersonDetail.objects.filter(movement_status=status_code).first()
        if sample:
            print(f"\n   {status_code.upper()}:")
            print(f"   - {sample.pax_id}: {sample.first_name} {sample.last_name}")
            print(f"     City: {sample.current_city}")
            print(f"     Exit Verified: {sample.exit_verified}")
            print(f"     Shirkat: {sample.shirkat_report}")

if __name__ == '__main__':
    update_passenger_movements()
