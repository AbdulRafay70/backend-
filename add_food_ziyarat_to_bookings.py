"""
Add food and ziyarat details to bookings.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking, BookingFoodDetails, BookingZiyaratDetails
from organization.models import Organization
from packages.models import Food, Ziyarat

org = Organization.objects.get(id=11)

print("="*80)
print("ADDING FOOD AND ZIYARAT DETAILS TO BOOKINGS")
print("="*80)

# Get bookings
bookings = Booking.objects.filter(
    organization=org,
    umrah_package__isnull=False
).order_by('-id')[:6]

print(f"\nFound {bookings.count()} bookings")

# Get or create food items
try:
    food_breakfast = Food.objects.filter(organization=org, name__icontains='breakfast').first()
    if not food_breakfast:
        food_breakfast = Food.objects.create(
            organization=org,
            name='Breakfast',
            description='Daily breakfast',
            price_per_person=30,
            is_active=True
        )
    
    food_lunch = Food.objects.filter(organization=org, name__icontains='lunch').first()
    if not food_lunch:
        food_lunch = Food.objects.create(
            organization=org,
            name='Lunch',
            description='Daily lunch',
            price_per_person=50,
            is_active=True
        )
except Exception as e:
    print(f"Error creating food: {e}")
    food_breakfast = None
    food_lunch = None

# Get or create ziyarat items
try:
    ziyarat_makkah = Ziyarat.objects.filter(organization=org, name__icontains='makkah').first()
    if not ziyarat_makkah:
        ziyarat_makkah = Ziyarat.objects.create(
            organization=org,
            name='Makkah Ziyarat',
            description='Historical places in Makkah',
            price_per_person=150,
            is_active=True
        )
    
    ziyarat_madinah = Ziyarat.objects.filter(organization=org, name__icontains='madinah').first()
    if not ziyarat_madinah:
        ziyarat_madinah = Ziyarat.objects.create(
            organization=org,
            name='Madinah Ziyarat',
            description='Historical places in Madinah',
            price_per_person=120,
            is_active=True
        )
except Exception as e:
    print(f"Error creating ziyarat: {e}")
    ziyarat_makkah = None
    ziyarat_madinah = None

for booking in bookings:
    print(f"\n📦 Booking: {booking.booking_number}")
    
    # Add food details if not exists
    existing_food = BookingFoodDetails.objects.filter(booking=booking).count()
    if existing_food == 0 and food_breakfast and food_lunch:
        # Add breakfast
        BookingFoodDetails.objects.create(
            booking=booking,
            food=food_breakfast,
            quantity=booking.total_pax,
            price=food_breakfast.price_per_person,
            total_price=food_breakfast.price_per_person * booking.total_pax
        )
        # Add lunch
        BookingFoodDetails.objects.create(
            booking=booking,
            food=food_lunch,
            quantity=booking.total_pax,
            price=food_lunch.price_per_person,
            total_price=food_lunch.price_per_person * booking.total_pax
        )
        print(f"   ✅ Added 2 food items")
    else:
        print(f"   ℹ️  Already has {existing_food} food items")
    
    # Add ziyarat details if not exists
    existing_ziyarat = BookingZiyaratDetails.objects.filter(booking=booking).count()
    if existing_ziyarat == 0 and ziyarat_makkah and ziyarat_madinah:
        # Add Makkah ziyarat
        BookingZiyaratDetails.objects.create(
            booking=booking,
            ziyarat=ziyarat_makkah,
            quantity=booking.total_pax,
            price=ziyarat_makkah.price_per_person,
            total_price=ziyarat_makkah.price_per_person * booking.total_pax
        )
        # Add Madinah ziyarat
        BookingZiyaratDetails.objects.create(
            booking=booking,
            ziyarat=ziyarat_madinah,
            quantity=booking.total_pax,
            price=ziyarat_madinah.price_per_person,
            total_price=ziyarat_madinah.price_per_person * booking.total_pax
        )
        print(f"   ✅ Added 2 ziyarat items")
    else:
        print(f"   ℹ️  Already has {existing_ziyarat} ziyarat items")

print(f"\n{'='*80}")
print("✅ FOOD AND ZIYARAT DETAILS ADDED!")
print("="*80)
