"""
Simple script to update visa statuses using Django ORM
Run with: python manage.py shell
Then paste this code
"""

from booking.models import Booking

# Update all passengers in approved bookings for org 11
bookings = list(Booking.objects.filter(status='Approved', organization_id=11))

print(f"\nFound {len(bookings)} approved bookings")
print("Updating visa statuses...\n")

total_updated = 0

for booking in bookings:
    if booking.person_details:
        for person in booking.person_details:
            if person.get('visa_status') != 'Approved':
                person['visa_status'] = 'Approved'
                total_updated += 1
        booking.save()
        print(f"✓ Updated {booking.booking_number}")

print(f"\n✅ Done! Updated {total_updated} passengers")
print("Refresh the Pax Movement Tracking page!\n")
