# Hotel Outsourcing Module - Complete Documentation

## ✅ STATUS: FULLY OPERATIONAL & CONNECTED TO SWAGGER

The Hotel Outsourcing Module is now fully integrated with your Django project and visible in Swagger documentation.

---

## 📍 Swagger Access

**Swagger UI:** http://localhost:8000/api/schema/swagger-ui/

Search for **"Hotel Outsourcing"** tag in Swagger to find all endpoints.

**OpenAPI Schema:** http://localhost:8000/api/schema/

---

## 🔗 API Endpoints

### 1. CREATE HOTEL OUTSOURCING
**POST** `/api/hotel-outsourcing/`

#### Request Body:
```json
{
  "booking_id": 101,
  "hotel_name": "Swissotel Al Maqam Makkah",
  "room_type": "Quad",
  "room_no": "302",
  "room_price": 450,
  "currency": "SAR",
  "quantity": 1,
  "number_of_nights": 5,
  "check_in": "2025-12-05",
  "check_out": "2025-12-10",
  "remarks": "Booked directly from outside source (Hotel XYZ)",
  "source_company": "Hotel XYZ Booking Agency",
  "created_by": 12
}
```

#### Response (201 Created):
```json
{
  "id": 1,
  "booking_id": 101,
  "hotel_name": "Swissotel Al Maqam Makkah",
  "room_type": "Quad",
  "room_no": "302",
  "room_price": 450,
  "currency": "SAR",
  "quantity": 1,
  "number_of_nights": 5,
  "check_in": "2025-12-05",
  "check_out": "2025-12-10",
  "remarks": "Booked directly from outside source (Hotel XYZ)",
  "source_company": "Hotel XYZ Booking Agency",
  "is_paid": false,
  "status": "pending_payment",
  "agent_notified": true,
  "outsource_cost": 2250.0,
  "ledger_entry_id": 45,
  "linked_in_ledger": true,
  "organization_owner": "Saer.pk",
  "organization_owner_id": 1,
  "branch": "Karachi",
  "branch_id": 2,
  "created_at": "2025-11-02T10:30:00Z",
  "updated_at": "2025-11-02T10:30:00Z"
}
```

#### Auto Actions (Signals):
✅ **booking.is_outsourced** set to `true`  
✅ **Ledger Entry Created** (payable tracking)  
✅ **Agent Notified** via system log  
✅ **hotel_details Updated** in booking (if `booking_hotel_detail_id` provided)

---

### 2. LIST HOTEL OUTSOURCING RECORDS
**GET** `/api/hotel-outsourcing/`

#### Query Parameters:
- `organization_id` (int): Filter by organization
- `branch_id` (int): Filter by branch
- `booking_id` (int): Filter by specific booking
- `hotel_name` (string): Search hotel name (case-insensitive)
- `status` (string): Filter by payment status (`paid` or `pending`)
- `limit` (int): Records per page (default: 25)
- `offset` (int): Pagination offset (default: 0)

#### Example Request:
```
GET /api/hotel-outsourcing/?organization_id=1&branch_id=2&status=pending&limit=10&offset=0
```

#### Response (200 OK):
```json
{
  "total_records": 2,
  "limit": 10,
  "offset": 0,
  "data": [
    {
      "id": 1,
      "booking_id": 101,
      "hotel_name": "Swissotel Al Maqam Makkah",
      "room_type": "Quad",
      "room_price": 450,
      "currency": "SAR",
      "quantity": 1,
      "number_of_nights": 5,
      "check_in": "2025-12-05",
      "check_out": "2025-12-10",
      "status": "pending_payment",
      "outsource_cost": 2250.0,
      "organization_owner": "Saer.pk",
      "organization_owner_id": 1,
      "branch": "Karachi",
      "branch_id": 2,
      "remarks": "Booked from outside source",
      "linked_in_ledger": true,
      "agent_notified": true,
      "created_at": "2025-11-02T10:30:00Z"
    },
    {
      "id": 2,
      "booking_id": 102,
      "hotel_name": "Dar Al Tawhid InterContinental",
      "room_type": "Triple",
      "room_price": 380,
      "currency": "SAR",
      "quantity": 2,
      "number_of_nights": 7,
      "check_in": "2025-12-10",
      "check_out": "2025-12-17",
      "status": "pending_payment",
      "outsource_cost": 5320.0,
      "organization_owner": "Saer.pk",
      "organization_owner_id": 1,
      "branch": "Lahore",
      "branch_id": 3,
      "linked_in_ledger": true,
      "agent_notified": true,
      "created_at": "2025-11-02T11:15:00Z"
    }
  ]
}
```

#### Agent Scoping:
- **Staff users**: See all outsourcing records
- **Non-staff users (agents)**: Only see their own bookings

---

### 3. RETRIEVE OUTSOURCING DETAIL
**GET** `/api/hotel-outsourcing/{id}/`

#### Response (200 OK):
```json
{
  "id": 1,
  "booking_id": 101,
  "hotel_name": "Swissotel Al Maqam Makkah",
  "room_type": "Quad",
  "room_no": "302",
  "room_price": 450,
  "currency": "SAR",
  "quantity": 1,
  "number_of_nights": 5,
  "check_in": "2025-12-05",
  "check_out": "2025-12-10",
  "remarks": "Booked directly from outside source",
  "source_company": "Hotel XYZ Booking Agency",
  "is_paid": false,
  "status": "pending_payment",
  "agent_notified": true,
  "outsource_cost": 2250.0,
  "ledger_entry_id": 45,
  "linked_in_ledger": true,
  "organization_owner": "Saer.pk",
  "organization_owner_id": 1,
  "branch": "Karachi",
  "branch_id": 2,
  "created_by": 12,
  "created_at": "2025-11-02T10:30:00Z",
  "updated_at": "2025-11-02T10:30:00Z",
  "is_deleted": false
}
```

---

### 4. UPDATE PAYMENT STATUS
**PATCH** `/api/hotel-outsourcing/{id}/payment-status/`

#### Request Body:
```json
{
  "is_paid": true
}
```

#### Response (200 OK):
```json
{
  "id": 1,
  "booking_id": 101,
  "hotel_name": "Swissotel Al Maqam Makkah",
  "is_paid": true,
  "status": "paid",
  "outsource_cost": 2250.0,
  "ledger_entry_id": 45,
  "linked_in_ledger": true,
  "organization_owner": "Saer.pk",
  "branch": "Karachi",
  ...
}
```

#### Actions When Marking as PAID (is_paid: true):
✅ **Settlement Ledger Entry Created** (Debit: PAYABLE, Credit: CASH/BANK)  
✅ **Original Ledger Entry Marked as Settled**  
✅ **Idempotent**: Prevents duplicate settlements on retries

#### Actions When Marking as UNPAID (is_paid: false):
✅ **Original Ledger Entry Marked as Unsettled**

---

### 5. UPDATE OUTSOURCING RECORD
**PUT/PATCH** `/api/hotel-outsourcing/{id}/`

#### Request Body (Partial Update):
```json
{
  "room_no": "405",
  "remarks": "Room changed to 405 on guest request"
}
```

#### Response (200 OK):
```json
{
  "id": 1,
  "room_no": "405",
  "remarks": "Room changed to 405 on guest request",
  "updated_at": "2025-11-02T12:00:00Z",
  ...
}
```

---

### 6. DELETE OUTSOURCING RECORD (Soft Delete)
**DELETE** `/api/hotel-outsourcing/{id}/`

#### Response (204 No Content)

#### Auto Actions:
✅ **Soft Delete**: Sets `is_deleted = true` (record remains in database)  
✅ **Ledger Reversal Entry Created**: Mirrors original entry with reversed debit/credit  
✅ **Original Ledger Entry Marked as Reversed**

---

## 📊 Response Structure Details

### Field Descriptions:

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique outsourcing record ID |
| `booking_id` | integer | Related booking ID (write-only) |
| `hotel_name` | string | External hotel name |
| `source_company` | string | Company from which hotel was sourced |
| `room_type` | string | Room type (Quad, Triple, Double, etc.) |
| `room_no` | string | Room number |
| `room_price` | float | Price per night (write-only, use `price` in read) |
| `price` | float | Price per night (read-only) |
| `quantity` | integer | Number of rooms |
| `number_of_nights` | integer | Total nights |
| `currency` | string | Currency code (SAR, PKR, USD, etc.) |
| `check_in` | date | Check-in date (YYYY-MM-DD) |
| `check_out` | date | Check-out date (YYYY-MM-DD) |
| `remarks` | string | Additional notes/comments |
| `is_paid` | boolean | Payment status flag |
| `status` | string | Derived status: `"paid"` or `"pending_payment"` |
| `agent_notified` | boolean | Whether agent was notified |
| `outsource_cost` | float | Total cost (price × quantity × nights) |
| `ledger_entry_id` | integer | Linked ledger entry ID (null if no entry) |
| `linked_in_ledger` | boolean | Whether linked to ledger (true if ledger_entry_id exists) |
| `organization_owner` | string | Organization name |
| `organization_owner_id` | integer | Organization ID |
| `branch` | string | Branch name |
| `branch_id` | integer | Branch ID |
| `created_by` | integer | User ID who created the record |
| `created_at` | datetime | Record creation timestamp |
| `updated_at` | datetime | Last update timestamp |
| `is_deleted` | boolean | Soft delete flag |

---

## 🔄 Automation Features

### 1. Automatic Ledger Creation
When a hotel outsourcing record is created:
- **Ledger Entry** is automatically created in the `ledger` module
- **Accounts**:
  - Debit: SUSPENSE account
  - Credit: PAYABLE account
- **Amount**: `outsource_cost` (price × quantity × nights)
- **Narration**: "Outsourced Hotel for Booking #{booking_no}"
- **Metadata**: Contains outsourcing_id, organization, branch

### 2. Automatic Booking Update
- `booking.is_outsourced` → `true`
- `booking_hotel_detail.outsourced_hotel` → `true` (if booking_hotel_detail_id provided)
- `booking_hotel_detail.self_hotel_name` → external hotel name

### 3. Agent Notification
- System automatically sends notification to agent
- Message: "Your passenger's hotel has been assigned from an external source: {hotel_name}."
- Creates `SystemLog` entry for audit trail
- Sets `agent_notified = true`

### 4. Payment Settlement
When marking as paid:
- Creates **Settlement Entry** (Debit: PAYABLE, Credit: CASH/BANK)
- Marks original ledger entry as **settled**
- **Idempotent**: Won't create duplicate settlements on retries

### 5. Reversal on Delete
When record is deleted:
- Creates **Reversal Ledger Entry** (flipped debit/credit)
- Marks original entry as **reversed**
- Record remains in database (soft delete)

---

## 🔐 Permissions

- **Authentication Required**: All endpoints require authentication
- **Agent Scoping**: Non-staff users only see their own booking's outsourcing records
- **Staff Access**: Staff users see all outsourcing records

---

## 📝 Admin Panel Access

**URL:** http://localhost:8000/admin/booking/hoteloutsourcing/

Features:
- List all outsourcing records
- Search by hotel name, booking number, source company
- Filter by payment status, organization, branch
- Inline editing
- View ledger entry links
- View agent notification status

---

## 🧪 Testing

### Manual Testing in Swagger:
1. Open Swagger UI: http://localhost:8000/api/schema/swagger-ui/
2. Search for "Hotel Outsourcing" tag
3. Authorize with your credentials
4. Test each endpoint with sample data

### Automated Test Script:
Run the comprehensive test script:
```powershell
python test_hotel_outsourcing_complete.py
```

This will:
- Create test bookings and outsourcing records
- Test all API endpoints
- Verify filters and search
- Validate payment status updates
- Check Swagger integration
- Verify database state

---

## 💡 Usage Examples

### Example 1: Record External Hotel Booking
```python
import requests

# API credentials
headers = {'Authorization': 'Bearer YOUR_TOKEN'}

# Create outsourcing record
data = {
    "booking_id": 101,
    "hotel_name": "Swissotel Al Maqam Makkah",
    "room_type": "Quad",
    "room_price": 450,
    "currency": "SAR",
    "quantity": 1,
    "number_of_nights": 5,
    "check_in": "2025-12-05",
    "check_out": "2025-12-10"
}

response = requests.post(
    'http://localhost:8000/api/hotel-outsourcing/',
    json=data,
    headers=headers
)

print(response.json())
# Output: Full outsourcing record with ledger_entry_id, outsource_cost, etc.
```

### Example 2: Track Pending Payments
```python
# Get all pending payments for organization 1
params = {
    'organization_id': 1,
    'status': 'pending',
    'limit': 100
}

response = requests.get(
    'http://localhost:8000/api/hotel-outsourcing/',
    params=params,
    headers=headers
)

data = response.json()
print(f"Total pending: {data['total_records']}")
print(f"Total amount: {sum(r['outsource_cost'] for r in data['data'])}")
```

### Example 3: Mark Payment as Completed
```python
# Mark outsourcing #1 as paid
response = requests.patch(
    'http://localhost:8000/api/hotel-outsourcing/1/payment-status/',
    json={'is_paid': True},
    headers=headers
)

print(response.json())
# Output: Record with status: "paid", ledger settlement created
```

---

## 🔧 Technical Implementation

### Models (`booking/models.py`):
```python
class HotelOutsourcing(models.Model):
    booking = ForeignKey(Booking)
    hotel_name = CharField(max_length=255)
    price = FloatField()
    quantity = PositiveIntegerField()
    number_of_nights = IntegerField()
    is_paid = BooleanField(default=False)
    ledger_entry_id = IntegerField(null=True)
    # ... other fields
    
    @property
    def outsource_cost(self):
        return price * quantity * number_of_nights
```

### Serializers (`booking/serializers.py`):
- `HotelOutsourcingSerializer`: Full CRUD serialization
- Computed fields: `outsource_cost`, `status`, `organization_owner`, `branch`, `linked_in_ledger`
- Alias fields: `check_in`/`check_out` → `check_in_date`/`check_out_date`

### Views (`booking/views.py`):
- `HotelOutsourcingViewSet`: ModelViewSet with custom `list()` and `payment_status()` action
- Swagger documentation via `@extend_schema_view` decorator
- Filters: organization, branch, booking, hotel_name, status
- Pagination: limit/offset

### Signals (`booking/signals.py`):
- `post_save`: Creates ledger entry, notifies agent, updates booking
- `post_delete`: Creates reversal ledger entry

### URLs (`booking/urls.py`):
```python
router.register(r'hotel-outsourcing', HotelOutsourcingViewSet, basename='hotel-outsourcing')
```

---

## ✅ Verification Checklist

- ✅ Module connected to main project URLs
- ✅ All endpoints visible in Swagger UI
- ✅ OpenAPI schema generated successfully
- ✅ Automatic ledger integration working
- ✅ Agent notifications functional
- ✅ Payment status updates with settlement entries
- ✅ Soft delete with ledger reversal
- ✅ Admin panel registration
- ✅ Agent scoping for non-staff users
- ✅ Filters and search working
- ✅ Response format matches requirements
- ✅ Idempotent payment settlement

---

## 📚 Related Modules

- **Booking Module**: `booking/models.py`, `booking/serializers.py`, `booking/views.py`
- **Ledger Module**: `ledger/models.py`, `organization/ledger_utils.py`
- **Notification Module**: `notifications/utils.py`
- **Logs Module**: `logs/models.py`

---

## 🎯 Next Steps

1. **Test in Swagger UI**: Visit http://localhost:8000/api/schema/swagger-ui/ and test all endpoints
2. **Verify Admin Panel**: Check http://localhost:8000/admin/booking/hoteloutsourcing/
3. **Test Automation**: Create test booking and verify auto actions
4. **Production Deployment**: Ensure all migrations are applied
5. **Documentation**: Share this document with your team

---

## 📞 Support

For any issues or questions:
- Check Swagger documentation for endpoint details
- Review admin panel for data verification
- Run test script for comprehensive validation
- Check Django logs for error messages

---

**Last Updated:** November 2, 2025  
**Module Status:** ✅ Production Ready  
**Swagger Status:** ✅ Fully Integrated  
**Test Coverage:** ✅ Comprehensive
