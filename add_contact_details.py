"""
Add contact details and family head information to delivered bookings.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking, BookingPersonDetail

print("=" * 60)
print("ADDING CONTACT DETAILS TO DELIVERED BOOKINGS")
print("=" * 60)

# Get delivered bookings
delivered_bookings = Booking.objects.filter(status='Delivered')

for booking in delivered_bookings:
    print(f"\n📦 Booking: {booking.booking_number}")
    
    # Get all person details for this booking
    person_details = booking.person_details.all()
    
    if not person_details.exists():
        print("  ⚠️  No person details found")
        continue
    
    print(f"  Found {person_details.count()} passengers")
    
    # Set the first person as family head if no family head exists
    has_family_head = person_details.filter(is_family_head=True).exists()
    
    for idx, person in enumerate(person_details):
        # Add contact number if missing
        if not person.contact_number:
            person.contact_number = f"+92300070901{idx}"
            print(f"  ✅ Added contact number for {person.first_name} {person.last_name}: {person.contact_number}")
        
        # Set first person as family head if no family head exists
        if not has_family_head and idx == 0:
            person.is_family_head = True
            print(f"  👨‍👩‍👧‍👦 Set {person.first_name} {person.last_name} as Family Head")
            has_family_head = True
        
        person.save()
    
    print(f"  ✅ Updated {person_details.count()} passengers")

print("\n" + "=" * 60)
print("✅ Contact details and family head info added successfully!")
print("=" * 60)
