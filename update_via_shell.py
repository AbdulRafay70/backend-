# Quick Django Shell Script to Update Visa Statuses
# Run this with: Get-Content update_via_shell.py | python manage.py shell

from booking.models import Booking

print("\n" + "=" * 70)
print("UPDATING VISA STATUSES FOR ORG 11")
print("=" * 70 + "\n")

# Get all approved bookings for org 11
bookings_qs = Booking.objects.filter(status='Approved', organization_id=11)
total = bookings_qs.count()
updated_passengers = 0
updated_bookings = 0

print(f"Found {total} approved bookings\n")

for booking in bookings_qs:
    if booking.person_details:
        changed = False
        for i, person in enumerate(booking.person_details):
            old_status = person.get('visa_status', 'None')
            if old_status != 'Approved':
                person['visa_status'] = 'Approved'
                changed = True
                updated_passengers += 1
                name = f"{person.get('first_name', '')} {person.get('last_name', '')}"
                print(f"  ✓ {name}: {old_status} → Approved")
        
        if changed:
            booking.save()
            updated_bookings += 1
            print(f"✅ Updated booking: {booking.booking_number}\n")

print("=" * 70)
print(f"✅ COMPLETE! Updated {updated_passengers} passengers in {updated_bookings} bookings")
print("=" * 70)
print("\nRefresh the Pax Movement Tracking page now!\n")
