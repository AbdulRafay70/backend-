# Kuickpay API Testing Guide

## Quick Test Setup

### Option 1: Use Django Admin (Easiest)

1. Go to Django Admin: `http://127.0.0.1:8000/admin/`
2. Navigate to **Booking** → **Bookings**
3. Click **Add Booking**
4. Fill in the following fields:
   - **Booking Reference**: `0000812345`
   - **Booking Number**: `BK-20260113-TEST`
   - **Organization**: Select any organization
   - **Branch**: Select any branch
   - **Total Amount**: `1869.00`
   - **Paid Amount**: `0` (for unpaid bill) or `1869.00` (for paid bill)
   - **Booking Status**: `confirmed`
   - **Payment Status**: `pending` (for unpaid) or `paid` (for paid bill)
5. Save the booking

### Option 2: Use Python Shell

```bash
python manage.py shell
```

Then paste this code:

```python
from booking.models import Booking
from organization.models import Organization
from decimal import Decimal

# Get first organization
org = Organization.objects.first()
branch = org.branches.first() if org else None

# Create test booking
booking = Booking.objects.create(
    booking_reference='0000812345',
    booking_number='BK-20260113-TEST',
    organization=org,
    branch=branch,
    total_amount=Decimal('1869.00'),
    paid_amount=Decimal('0'),  # 0 for unpaid, 1869.00 for paid
    booking_status='confirmed',
    payment_status='pending'  # 'pending' for unpaid, 'paid' for paid
)

print(f"Created booking: {booking.booking_reference}")
exit()
```

## Testing the Bill Inquiry API

### Get JWT Token First

```powershell
$body = '{"email": "abdulrafay@gmail.com", "password": "hyd12233"}'
$response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/token/" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body -UseBasicParsing
$token = ($response.Content | ConvertFrom-Json).access
Write-Host "Token: $token"
```

### Test Bill Inquiry (Unpaid Bill)

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}
$body = '{"consumer_number": "0000812345", "bank_mnemonic": "KPY", "reserved": ""}'
$response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/kuickpay/bill-inquiry/" -Method POST -Headers $headers -Body $body -UseBasicParsing
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**Expected Response (Unpaid Bill)**:
```json
{
  "response_Code": "00",
  "consumer_Detail": "CUSTOMER NAME              ",
  "bill_status": "U",
  "due_date": "20260113",
  "amount_within_dueDate": "+0000000186900",
  "amount_after_dueDate": "+0000000186900",
  "email_address": "",
  "contact_number": "",
  "billing_month": "2601",
  "date_paid": "",
  "amount_paid": "",
  "tran_auth_Id": "",
  "reserved": ""
}
```

### Test Bill Payment

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}
$body = @'
{
    "consumer_number": "0000812345",
    "tran_auth_id": "112233",
    "transaction_amount": "1869",
    "tran_date": "20260113",
    "tran_time": "143022",
    "bank_mnemonic": "KPY",
    "reserved": ""
}
'@
$response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/kuickpay/bill-payment/" -Method POST -Headers $headers -Body $body -UseBasicParsing
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**Expected Response (Success)**:
```json
{
  "response_Code": "00",
  "Identification_parameter": "00000000000000000123",
  "reserved": ""
}
```

## Response Codes

### Bill Inquiry
- `00`: Success
- `01`: Consumer number not found
- `02`: Booking cancelled/refunded
- `04`: Invalid data
- `05`: Server error

### Bill Payment
- `00`: Success
- `01`: Consumer number not found
- `02`: Booking cancelled/refunded
- `03`: Duplicate transaction
- `04`: Invalid data
- `05`: Server error

## Amount Format

Kuickpay uses AN14 format for amounts:
- Sign (+/-) + 13 digits
- Last 2 digits are minor units (cents/paisa)
- Example: `+0000000186900` = PKR 1869.00

## Testing Different Scenarios

### 1. Unpaid Bill
- Set `paid_amount = 0`
- Set `payment_status = 'pending'`
- Expected: `bill_status = "U"`

### 2. Paid Bill
- Set `paid_amount = 1869.00` (equal to total_amount)
- Set `payment_status = 'paid'`
- Create a `BookingPayment` record
- Expected: `bill_status = "P"`

### 3. Blocked Bill
- Set `booking_status = 'cancelled'` or `'refunded'`
- Expected: `response_Code = "02"`, `bill_status = "B"`

### 4. Non-existent Bill
- Use a consumer_number that doesn't exist
- Expected: `response_Code = "01"`
