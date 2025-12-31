"""
Change some Group Ticket bookings to Umrah Package type.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from django.db import connection

print("="*80)
print("CHANGING BOOKING TYPES TO UMRAH")
print("="*80)

# Get some Group Ticket bookings to convert
bookings_to_convert = [
    'BK-20251221-E9560D',
    'BK-20251206-08B7B2',
    'BK-20251203-AE31B2',
    'BK-20251201-49A9CB',
    'BK-20251201-37748E',
]

print(f"\nConverting {len(bookings_to_convert)} bookings to UMRAH type...")

for booking_number in bookings_to_convert:
    booking = Booking.objects.filter(booking_number=booking_number).first()
    
    if booking:
        print(f"\n  {booking_number}")
        print(f"    Old type: {booking.booking_type}")
        
        # Update via SQL to bypass save() method
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE booking_booking
                SET booking_type = %s
                WHERE booking_number = %s
            """, ['UMRAH', booking_number])
        
        # Verify
        booking.refresh_from_db()
        print(f"    New type: {booking.booking_type}")
        print(f"    ✅ Updated")
    else:
        print(f"\n  ❌ {booking_number} not found")

print(f"\n{'='*80}")
print("✅ BOOKINGS UPDATED!")
print("="*80)
print("\nThese bookings will now appear in UMRAH BOOKINGS tab")
print("(after the API serializer converts 'UMRAH' to 'Umrah Package')")
