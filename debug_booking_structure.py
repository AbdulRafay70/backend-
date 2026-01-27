
import os
import django
import sys

sys.path.append('d:\\Saerpk\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking
from packages.models import UmrahPackage

def inspect_bookings():
    # Find bookings with person details and hotel details
    bookings = Booking.objects.filter(
        person_details__isnull=False, 
        hotel_details__isnull=False,
        umrah_package__isnull=False
    ).distinct()[:5]

    print(f"Found {bookings.count()} bookings to inspect")

    for booking in bookings:
        print(f"\nBooking: {booking.booking_number} (ID: {booking.id})")
        print(f"Package: {booking.umrah_package.title if booking.umrah_package else 'None'}")
        
        # Pox Counts
        adults = booking.person_details.filter(age_group='Adult').count()
        children = booking.person_details.filter(age_group='Child').count()
        infants = booking.person_details.filter(age_group='Infant').count()
        print(f"Pax: Adults={adults}, Children={children}, Infants={infants}")

        # Hotel Details
        print("Hotels:")
        for hd in booking.hotel_details.all():
            print(f"  - Hotel: {hd.hotel.name if hd.hotel else 'N/A'}")
            print(f"    Room Type: {hd.room_type}")
            print(f"    Quantity: {hd.quantity}")
            print(f"    Nights: {hd.number_of_nights}")
            print(f"    Total Price: {hd.total_price}")

if __name__ == "__main__":
    inspect_bookings()
