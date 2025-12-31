"""
Test if API returns food and ziyarat details.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from booking.serializers import BookingSerializer
from organization.models import Organization

org = Organization.objects.get(id=11)

print("="*80)
print("TESTING API SERIALIZER OUTPUT FOR FOOD/ZIYARAT")
print("="*80)

# Get one booking with food/ziyarat
booking = Booking.objects.filter(
    organization=org,
    umrah_package__isnull=False
).prefetch_related('food_details', 'ziyarat_details').first()

if booking:
    print(f"\n📦 Booking: {booking.booking_number}")
    
    # Check database
    food_count = booking.food_details.count()
    ziyarat_count = booking.ziyarat_details.count()
    
    print(f"\n📊 Database:")
    print(f"  Food Details: {food_count}")
    print(f"  Ziyarat Details: {ziyarat_count}")
    
    if food_count > 0:
        for food in booking.food_details.all():
            print(f"    - {food.food}: PKR {food.total_price_pkr}")
    
    if ziyarat_count > 0:
        for ziyarat in booking.ziyarat_details.all():
            print(f"    - {ziyarat.ziarat} ({ziyarat.city}): PKR {ziyarat.total_price_pkr}")
    
    # Serialize
    serializer = BookingSerializer(booking)
    data = serializer.data
    
    print(f"\n📋 API Response:")
    print(f"  food_details in response: {'food_details' in data}")
    print(f"  ziyarat_details in response: {'ziyarat_details' in data}")
    
    if 'food_details' in data:
        print(f"  Food details count: {len(data['food_details'])}")
        if len(data['food_details']) > 0:
            print(f"  First food: {data['food_details'][0]}")
    
    if 'ziyarat_details' in data:
        print(f"  Ziyarat details count: {len(data['ziyarat_details'])}")
        if len(data['ziyarat_details']) > 0:
            print(f"  First ziyarat: {data['ziyarat_details'][0]}")

print(f"\n{'='*80}")
