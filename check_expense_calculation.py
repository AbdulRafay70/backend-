import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from ledger.models import LedgerEntry
from booking.models import Booking

# Get the booking
booking_number = "BK-20260124-5DFBAF"
booking = Booking.objects.filter(booking_number=booking_number).first()

if not booking:
    print(f"❌ Booking {booking_number} not found")
    exit()

print(f"✅ Found booking: {booking.booking_number}")
print(f"   Umrah Package: {booking.umrah_package}")
print(f"   Total Amount: PKR {booking.total_amount}")

# Get the ledger entry
ledger = LedgerEntry.objects.filter(booking=booking).first()

if ledger:
    print(f"\n✅ Found ledger entry #{ledger.id}")
    print(f"   Income Amount: PKR {ledger.income_amount}")
    print(f"   Expense Amount: PKR {ledger.expense_amount}")
    print(f"   Profit: PKR {ledger.profit}")
else:
    print("\n❌ No ledger entry found for this booking")

# Try running the expense calculation manually
if booking.umrah_package:
    print(f"\n🔍 Manual Expense Calculation:")
    hotel_expense = booking.calculate_hotel_expense()
    visa_expense = booking.calculate_visa_expense()
    transport_expense = booking.calculate_transport_expense()
    food_expense = booking.calculate_food_expense()
    ziyarat_expense = booking.calculate_ziyarat_expense()
    total_expense = booking.calculate_total_expense()
    profit = booking.calculate_profit()
    
    print(f"   Hotel Expense: PKR {hotel_expense}")
    print(f"   Visa Expense: PKR {visa_expense}")
    print(f"   Transport Expense: PKR {transport_expense}")
    print(f"   Food Expense: PKR {food_expense}")
    print(f"   Ziyarat Expense: PKR {ziyarat_expense}")
    print(f"   Total Expense: PKR {total_expense}")
    print(f"   Calculated Profit: PKR {profit}")
else:
    print("\n⚠️ Booking has no umrah_package, expense calculation skipped")
