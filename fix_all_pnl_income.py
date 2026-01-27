import os
import django
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from booking.models import Booking
from finance.utils import calculate_booking_pnl

def fix_all_income():
    # Find all bookings that have an Umrah Package linked
    bookings = Booking.objects.filter(umrah_package__isnull=False)
    print(f"Applying Income Logic Update to {bookings.count()} bookings...")
    
    success_count = 0
    
    for b in bookings:
        try:
            print(f"Recalculating {b.booking_number}...")
            # This calling calculate_booking_pnl(b.id) which now uses the NEW logic (booking.total_amount)
            res = calculate_booking_pnl(b.id)
            if res:
                print(f" -> OK. Income: {res.get('total_selling_price')}, Profit: {res.get('profit')}")
                success_count += 1
        except Exception as e:
            print(f" -> Error: {e}")
            
    print("-" * 30)
    print(f"Done. Updated: {success_count}")

if __name__ == "__main__":
    fix_all_income()
