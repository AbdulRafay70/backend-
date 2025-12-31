"""
Update passenger statuses for testing Pax Movements.
Move some passengers to different stages of their journey.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking, BookingPersonDetail

print("=" * 60)
print("UPDATING PASSENGER MOVEMENT STATUSES")
print("=" * 60)

# Get delivered bookings
delivered_bookings = Booking.objects.filter(status='Delivered')

status_updates = [
    ('In Pakistan', 5),      # 5 passengers stay in Pakistan
    ('In Flight', 3),        # 3 passengers in flight
    ('In Makkah', 4),        # 4 passengers in Makkah
    ('In Madina', 2),        # 2 passengers in Madina
    ('Exited KSA', 1),       # 1 passenger exited
]

all_passengers = []
for booking in delivered_bookings:
    passengers = list(booking.person_details.all())
    all_passengers.extend(passengers)

print(f"\nTotal passengers found: {len(all_passengers)}")
print("\nUpdating statuses...\n")

idx = 0
for status, count in status_updates:
    for i in range(count):
        if idx < len(all_passengers):
            person = all_passengers[idx]
            
            # Update the status field (assuming there's a status field)
            # If the field name is different, adjust accordingly
            if hasattr(person, 'pax_status'):
                person.pax_status = status
            elif hasattr(person, 'status'):
                person.status = status
            elif hasattr(person, 'location_status'):
                person.location_status = status
            
            # Update city based on status
            if status == 'In Makkah':
                if hasattr(person, 'current_city'):
                    person.current_city = 'Makkah'
            elif status == 'In Madina':
                if hasattr(person, 'current_city'):
                    person.current_city = 'Madina'
            elif status == 'In Pakistan':
                if hasattr(person, 'current_city'):
                    person.current_city = 'Pakistan'
            
            person.save()
            print(f"  ✅ {person.first_name} {person.last_name} → {status}")
            idx += 1

print("\n" + "=" * 60)
print(f"✅ Updated {idx} passengers with different statuses!")
print("\nStatus Distribution:")
for status, count in status_updates:
    print(f"  - {status}: {count} passengers")
