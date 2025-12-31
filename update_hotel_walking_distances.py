"""
Script to update walking distances for all hotels in organization 11
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from tickets.models import Hotels

# Get all hotels for organization 11
hotels = Hotels.objects.filter(organization_id=11)

print("Updating walking distances for hotels...")
print("="*60)

for hotel in hotels:
    # Calculate walking distance based on distance field
    # Assuming average walking speed of 5 km/h = 83.33 meters/minute
    if hotel.walking_time and hotel.walking_time > 0:
        # If walking time is set, calculate distance
        walking_distance = hotel.walking_time * 83.33  # meters
    elif hotel.distance and hotel.distance > 0:
        # If only distance is set, use it directly (convert km to meters)
        walking_distance = hotel.distance * 1000
    else:
        walking_distance = 0
    
    # Update the hotel
    hotel.walking_distance = walking_distance
    hotel.save()
    
    print(f"✓ {hotel.name}")
    print(f"  Distance: {hotel.distance} km")
    print(f"  Walking Time: {hotel.walking_time} minutes")
    print(f"  Walking Distance: {walking_distance:.0f} meters")
    print()

print("="*60)
print("All hotels updated successfully!")
