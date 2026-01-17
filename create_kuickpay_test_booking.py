"""
Create test booking for Kuickpay API testing
"""
from booking.models import Booking, BookingPayment
from organization.models import Organization
from users.models import User
from decimal import Decimal
from datetime import datetime

def create_test_booking():
    # Get first organization
    org = Organization.objects.first()
    if not org:
        print("ERROR: No organization found. Please create an organization first.")
        return
    
    branch = org.branches.first() if hasattr(org, 'branches') else None
    
    # Check if booking already exists
    existing = Booking.objects.filter(booking_reference='0000812345').first()
    if existing:
        print(f"Booking already exists: {existing.booking_reference}")
        print(f"  ID: {existing.id}")
        print(f"  Total Amount: {existing.total_amount}")
        print(f"  Paid Amount: {existing.paid_amount}")
        print(f"  Status: {existing.booking_status}")
        return existing
    
    # Create test booking with consumer number 0000812345
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
    
    print(f"✅ Created test booking successfully!")
    print(f"  Consumer Number: {booking.booking_reference}")
    print(f"  Booking Number: {booking.booking_number}")
    print(f"  Total Amount: PKR {booking.total_amount}")
    print(f"  Paid Amount: PKR {booking.paid_amount}")
    print(f"  Status: {booking.booking_status}")
    print(f"\nYou can now test the bill inquiry API with:")
    print(f'  consumer_number: "{booking.booking_reference}"')
    
    return booking

if __name__ == '__main__':
    create_test_booking()
