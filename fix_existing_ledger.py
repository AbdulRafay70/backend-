import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from ledger.models import LedgerEntry
from booking.models import Booking
from decimal import Decimal

# Get the booking
booking_number = "BK-20260124-5DFBAF"
booking = Booking.objects.filter(booking_number=booking_number).first()

if not booking:
    print(f"❌ Booking {booking_number} not found")
    exit()

print(f"✅ Found booking: {booking.booking_number}")
print(f"   Total Amount (Income): PKR {booking.total_amount}")

# Get the ledger entry
ledger = LedgerEntry.objects.filter(booking=booking).first()

if not ledger:
    print("❌ No ledger entry found for this booking")
    exit()

print(f"\n📊 Current Ledger Entry #{ledger.id}:")
print(f"   Income Amount: PKR {ledger.income_amount}")
print(f"   Expense Amount: PKR {ledger.expense_amount}")
print(f"   Profit: PKR {ledger.profit}")

# Manually calculate correct values
if booking.umrah_package:
    # Simplified calculation based on package data
    # Hotel: sharing_bed_purchase_price (12.0) × 1 room × 1 night = 12
    # Visa: adault_visa_purchase_price (12.0) × 1 adult = 12
    # Transport: transport_purchase_price (0) × 1 pax = 0
    # Food: food_purchase_price (200.0) × 1 pax = 200 (but is_food_included=False, so 0)
    # Ziyarat: (makkah + madinah) (12+12=24) × 1 adult = 24 (but is_ziyarat_included=False, so 0)
    
    # Based on the package data you shared:
    hotel_expense = Decimal('12.00')  # sharing_bed_purchase_price from package
    visa_expense = Decimal('12.00')   # adault_visa_purchase_price from package
    transport_expense = Decimal('0.00')  # transport_purchase_price is 0
    food_expense = Decimal('0.00')  # is_food_included = False
    ziyarat_expense = Decimal('0.00')  # is_ziyarat_included = False
    
    total_expense = hotel_expense + visa_expense + transport_expense + food_expense + ziyarat_expense
    income = Decimal(str(booking.total_amount))
    profit = income - total_expense
    
    print(f"\n💰 Calculated Values:")
    print(f"   Hotel Expense: PKR {hotel_expense}")
    print(f"   Visa Expense: PKR {visa_expense}")
    print(f"   Transport Expense: PKR {transport_expense}")
    print(f"   Food Expense: PKR {food_expense}")
    print(f"   Ziyarat Expense: PKR {ziyarat_expense}")
    print(f"   Total Expense: PKR {total_expense}")
    print(f"   Income: PKR {income}")
    print(f"   Profit: PKR {profit}")
    
    # Update the ledger entry
    ledger.income_amount = income
    ledger.expense_amount = total_expense
    ledger.profit = profit
    ledger.save()
    
    print(f"\n✅ Updated Ledger Entry #{ledger.id}")
    print(f"   New Income Amount: PKR {ledger.income_amount}")
    print(f"   New Expense Amount: PKR {ledger.expense_amount}")
    print(f"   New Profit: PKR {ledger.profit}")
    
    print("\n🎉 SUCCESS! Refresh the Finance Dashboard to see the updated values.")
else:
    print("\n⚠️ Booking has no umrah_package, cannot calculate expense")
