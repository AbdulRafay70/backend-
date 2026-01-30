
import os
import django
import sys
from decimal import Decimal

# Setup Django Environment
sys.path.append('d:\\Saerpk\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from booking.models import Booking, BookingItem
from finance.utils import calculate_profit_loss, calculate_booking_revenue

def inspect_booking(booking_ref):
    print(f"--- Inspecting Booking {booking_ref} ---")
    try:
        if booking_ref.isdigit():
             booking = Booking.objects.get(id=booking_ref)
        else:
             booking = Booking.objects.get(booking_number=booking_ref)
             
        print(f"Booking: {booking.booking_number} (ID: {booking.id})")
        print(f"Total Amount: {booking.total_amount}")
        print(f"Calculated Revenue: {calculate_booking_revenue(booking)}")
        print(f"Calculated P&L: {calculate_profit_loss(booking.id)}")
        
        print("\n--- Booking Items ---")
        for item in booking.booking_items.all():
            print(f"Item ID: {item.id}, Type: {item.inventory_type}, Name: {item.item_name}")
            print(f"  Qty: {item.quantity}, Unit Price: {item.unit_price}, Total: {item.total_amount}")
            
            cost = 0
            if item.package:
                cost = item.package.sharing_purchase_price # roughly
                print(f"  Package Ref: {item.package.id}, Purchase Price (Sharing): {item.package.sharing_purchase_price}")
            elif item.hotel:
                print(f"  Hotel Ref: {item.hotel.id}")
                # check hotel prices?
            elif item.ticket:
                print(f"  Ticket Ref: {item.ticket.id}, Cost: {item.ticket.adult_cost_price}")
            
    except Exception as e:
        print(f"Error during basic inspection: {e}")
        import traceback
        traceback.print_exc()

    # Explicitly check package prices
    try:
        if booking_ref.isdigit():
             booking = Booking.objects.get(id=booking_ref)
        else:
             booking = Booking.objects.get(booking_number=booking_ref)

        pkg = booking.umrah_package
        if pkg:
            print("\n--- Linked Package Details ---")
            print(f"Pkg ID: {pkg.id}, Title: {pkg.title}")
            print(f"Sharing Purchase Price: {pkg.sharing_purchase_price}")
            print(f"Double Purchase Price: {pkg.double_purchase_price}")
            print(f"Triple Purchase Price: {pkg.triple_purchase_price}")
            print(f"Quad Purchase Price: {pkg.quad_purchase_price}")
            # Try both spellings for quint just in case
            try:
                print(f"Quint Purchase Price: {pkg.quaint_purchase_price}") 
            except AttributeError:
                print(f"Quint Purchase Price (alt): {getattr(pkg, 'quint_purchase_price', 'N/A')}")
            
            # Check pax count logic
            adults = 0
            for person in booking.person_details.all():
                if (person.age_group or "").lower() == 'adult': adults += 1
            print(f"Calculated Adult Count: {adults}")
            
    except Exception as e:
        print(f"Error checking package: {e}")

if __name__ == "__main__":
    inspect_booking("495")
