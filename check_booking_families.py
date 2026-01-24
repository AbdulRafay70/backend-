
import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking

def check_families(booking_number):
    try:
        booking = Booking.objects.get(booking_number=booking_number)
        print(f"Booking Found: {booking.booking_number}")
        
        passengers = booking.person_details.all()
        print(f"Total Passengers: {passengers.count()}")
        
        # Check family numbers
        families = set()
        print("\nPassenger Details:")
        print(f"{'Name':<30} {'Family No':<10} {'Head?'}")
        print("-" * 50)
        
        for p in passengers:
            family_no = p.family_number
            is_head = getattr(p, 'is_family_head', False)
            
            print(f"{p.first_name} {p.last_name:<20} {family_no:<10} {is_head}")
            
            # Assuming 0 might be default/no family, but let's see the data first.
            # If family_number is used to group, usually > 0.
            if family_no > 0:
                families.add(family_no)
        
        print("\n" + "="*30)
        print(f"Total Unique Families: {len(families)}")
        print("="*30)

    except Booking.DoesNotExist:
        print(f"Booking {booking_number} not found.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_families("BK-20260122-BA3BE2")
