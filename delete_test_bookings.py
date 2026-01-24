"""
Delete test bookings to start fresh
Run with: python delete_test_bookings.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking, BookingHotelDetails
from django.utils import timezone

print("\n" + "="*60)
print("DELETE TEST BOOKINGS")
print("="*60 + "\n")

# Show recent bookings
print("Recent Bookings:")
bookings = Booking.objects.all().order_by('-created_at')[:10]
for b in bookings:
    print(f"  ID: {b.id} | {b.booking_number} | Created: {b.created_at.date()}")
    hotels = BookingHotelDetails.objects.filter(booking=b)
    for h in hotels:
        print(f"    Hotel: {h.hotel_name} | Check-in: {h.check_in_date} | Check-out: {h.check_out_date}")

print("\n" + "-"*60)
choice = input("\nEnter booking ID to delete (or 'all' to delete all bookings, 'cancel' to exit): ")

if choice.lower() == 'cancel':
    print("Cancelled.")
elif choice.lower() == 'all':
    confirm = input(f"\n⚠️  Delete ALL {bookings.count()} bookings? Type 'YES' to confirm: ")
    if confirm == 'YES':
        count = Booking.objects.all().delete()[0]
        print(f"\n✓ Deleted {count} bookings")
    else:
        print("Cancelled.")
elif choice.isdigit():
    try:
        booking = Booking.objects.get(id=int(choice))
        confirm = input(f"\nDelete booking {booking.booking_number}? (yes/no): ")
        if confirm.lower() == 'yes':
            booking.delete()
            print(f"\n✓ Deleted booking {booking.booking_number}")
        else:
            print("Cancelled.")
    except Booking.DoesNotExist:
        print(f"\n✗ Booking ID {choice} not found")
else:
    print("Invalid input.")

print("\n" + "="*60 + "\n")
