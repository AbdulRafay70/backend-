"""
Verify contact details and family head information in delivered bookings.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking

print("=" * 60)
print("VERIFICATION: DELIVERED BOOKINGS WITH CONTACT DETAILS")
print("=" * 60)

delivered_bookings = Booking.objects.filter(status='Delivered')

for booking in delivered_bookings:
    print(f"\n📦 Booking: {booking.booking_number}")
    print(f"   Status: {booking.status}")
    
    person_details = booking.person_details.all()
    print(f"\n   👥 Passengers ({person_details.count()}):")
    
    for person in person_details:
        family_head_marker = "👨‍👩‍👧‍👦 FAMILY HEAD" if person.is_family_head else ""
        print(f"      • {person.first_name} {person.last_name}")
        print(f"        Contact: {person.contact_number or 'N/A'}")
        print(f"        Passport: {person.passport_number or 'N/A'}")
        print(f"        Age Group: {person.age_group or 'N/A'}")
        print(f"        Visa Status: {person.visa_status or 'Pending'}")
        print(f"        Ticket Status: {person.ticket_status or 'Pending'}")
        if family_head_marker:
            print(f"        {family_head_marker}")
        print()

print("=" * 60)
print("✅ Verification Complete!")
print("=" * 60)
