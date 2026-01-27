"""
Force delete all bookings without interactive confirmation.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking

print("="*60)
print("FORCE DELETING ALL BOOKINGS")
print("="*60)

count_before = Booking.objects.count()
print(f"Bookings before: {count_before}")

if count_before > 0:
    Booking.objects.all().delete()
    count_after = Booking.objects.count()
    print(f"Bookings after: {count_after}")
    if count_after == 0:
        print("✅ All bookings successfully deleted.")
    else:
        print("❌ Failed to delete all bookings.")
else:
    print("No bookings to delete.")

print("="*60)
