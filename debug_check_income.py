import os
import sys
import io
import django

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from booking.models import Booking
from finance.utils import calculate_booking_pnl

def verify_499():
    try:
        b = Booking.objects.get(id=499)
        print(f"Booking {b.id} Total Amount: {b.total_amount}")
        res = calculate_booking_pnl(499)
        print("Result:", res)
    except Exception as e:
        print(e)

if __name__ == "__main__":
    verify_499()
