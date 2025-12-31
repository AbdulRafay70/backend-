"""
Check and fix booking food/ziyarat total amounts.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from organization.models import Organization

org = Organization.objects.get(id=11)

print("="*80)
print("CHECKING BOOKING FOOD/ZIYARAT TOTALS")
print("="*80)

# Get bookings
bookings = Booking.objects.filter(
    organization=org,
    umrah_package__isnull=False
).prefetch_related('food_details', 'ziyarat_details').order_by('-id')[:6]

for booking in bookings:
    print(f"\n📦 Booking: {booking.booking_number}")
    
    # Calculate actual totals from details
    actual_food_total = sum(f.total_price_pkr or 0 for f in booking.food_details.all())
    actual_ziyarat_total = sum(z.total_price_pkr or 0 for z in booking.ziyarat_details.all())
    
    # Get stored totals
    stored_food_total = booking.total_food_amount_pkr or 0
    stored_ziyarat_total = booking.total_ziyarat_amount_pkr or 0
    
    print(f"  Food:")
    print(f"    Calculated from details: PKR {actual_food_total}")
    print(f"    Stored in booking: PKR {stored_food_total}")
    print(f"    Match: {'✅' if actual_food_total == stored_food_total else '❌'}")
    
    print(f"  Ziyarat:")
    print(f"    Calculated from details: PKR {actual_ziyarat_total}")
    print(f"    Stored in booking: PKR {stored_ziyarat_total}")
    print(f"    Match: {'✅' if actual_ziyarat_total == stored_ziyarat_total else '❌'}")
    
    # Fix if mismatch
    if actual_food_total != stored_food_total or actual_ziyarat_total != stored_ziyarat_total:
        print(f"  🔧 Fixing totals...")
        booking.total_food_amount_pkr = actual_food_total
        booking.total_ziyarat_amount_pkr = actual_ziyarat_total
        booking.save(update_fields=['total_food_amount_pkr', 'total_ziyarat_amount_pkr'])
        print(f"  ✅ Updated!")

print(f"\n{'='*80}")
print("✅ TOTALS FIXED!")
print("="*80)
