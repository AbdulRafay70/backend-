"""
Reset occupied hotel beds to available status
Run with: python reset_beds.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from tickets.models import RoomDetails, HotelRooms

print("\n" + "="*60)
print("RESET HOTEL BEDS TO AVAILABLE")
print("="*60 + "\n")

# Count occupied beds
occupied_beds = RoomDetails.objects.filter(status='OCCUPIED')
count = occupied_beds.count()

print(f"Found {count} occupied beds")

if count == 0:
    print("✓ No occupied beds found - all beds are already available")
else:
    # Reset to AVAILABLE
    occupied_beds.update(status='AVAILABLE')
    print(f"✓ Reset {count} beds to AVAILABLE status")

# Also reset room statuses
occupied_rooms = HotelRooms.objects.filter(status='OCCUPIED')
room_count = occupied_rooms.count()

if room_count > 0:
    occupied_rooms.update(status='AVAILABLE')
    print(f"✓ Reset {room_count} rooms to AVAILABLE status")

print("\n✓ All beds and rooms reset successfully!")
print("="*60 + "\n")
