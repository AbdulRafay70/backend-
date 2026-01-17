# Paste this in the Python shell that's currently running

from booking.models import Booking
from organization.models import Organization
from users.models import User

org = Organization.objects.first()
branch = org.branches.first() if org else None
agency = org.agencies.first() if org else None
user = User.objects.filter(organization=org).first()

# Create test booking with correct field names
booking = Booking.objects.create(
    booking_number='0000812345',
    organization=org,
    branch=branch,
    agency=agency,
    user=user,
    total_amount=1869.00,
    paid_payment=0,
    pending_payment=1869.00,
    status='Confirmed'
)

print(f"✅ Created test booking!")
print(f"   Booking Number: {booking.booking_number}")
print(f"   Total Amount: PKR {booking.total_amount}")
print(f"   Paid: PKR {booking.paid_payment}")
print(f"   Pending: PKR {booking.pending_payment}")
print(f"   Status: {booking.status}")
print(f"\nNow test the API with:")
print(f'  consumer_number: "{booking.booking_number}"')
