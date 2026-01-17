"""
Test data for Kuickpay API

Run this with: python manage.py shell < setup_kuickpay_test_data.py
"""

from booking.models import Booking, BookingPayment
from organization.models import Organization
from users.models import User
from decimal import Decimal
from datetime import datetime

# Get first organization
org = Organization.objects.first()
if not org:
    print("ERROR: No organization found")
    exit(1)

branch = None
if hasattr(org, 'branches'):
    branch = org.branches.first()

# Check if test booking already exists
existing = Booking.objects.filter(booking_reference='0000812345').first()

if existing:
    print(f"✅ Test booking already exists!")
    print(f"   Consumer Number: {existing.booking_reference}")
    print(f"   Total Amount: PKR {existing.total_amount}")
    print(f"   Paid Amount: PKR {existing.paid_amount}")
    print(f"   Status: {existing.booking_status}")
else:
    # Create new test booking
    booking = Booking.objects.create(
        booking_reference='0000812345',
        booking_number='BK-20260113-TEST',
        organization=org,
        branch=branch,
        total_amount=Decimal('1869.00'),
        paid_amount=Decimal('0'),
        booking_status='confirmed',
        payment_status='pending'
    )
    print(f"✅ Created test booking!")
    print(f"   Consumer Number: {booking.booking_reference}")
    print(f"   Total Amount: PKR {booking.total_amount}")
    print(f"   Paid Amount: PKR {booking.paid_amount}")
    print(f"   Status: {booking.booking_status}")

print("\n📝 Test the Bill Inquiry API with:")
print('POST http://127.0.0.1:8000/api/kuickpay/bill-inquiry/')
print('Body: {"consumer_number": "0000812345", "bank_mnemonic": "KPY", "reserved": ""}')
