# Enhanced Ledger System - Complete Documentation

## Overview
This document describes the enhanced multi-level ledger system with comprehensive transaction tracking, auto-posting logic, and 5-level organizational queries.

---

## 📋 LEDGER ENTRY FORMAT

Every ledger entry (auto/post/manual) contains the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `creation_datetime` | DateTime | Auto set (timezone aware) |
| `booking_no` | String | Booking reference (auto from booking table) |
| `service_type` | Choice | ticket / umrah / hotel / transport / package / payment / refund / commission |
| `narration` | Text | Text summary (e.g., "Advance payment for Umrah Booking #SK1234") |
| `transaction_type` | Choice | **debit** or **credit** |
| `transaction_amount` | Decimal | Transaction amount (kitna ki transaction howi hai) |
| `seller_organization_id` | FK | Organization that created this booking |
| `inventory_owner_organization_id` | FK | Owner org of that inventory item (auto detect from item) |
| `area_agency_id` | FK | If booking linked with area agent |
| `agency_id` | FK | If created by an agent |
| `branch_id` | FK | If created under branch |
| `payment_ids` | JSON Array | List of all linked payment record IDs |
| `group_ticket_count` | Integer | Total number of tickets if multiple in group booking |
| `umrah_visa_count` | Integer | Total number of Umrah visas included |
| `hotel_nights_count` | Integer | All hotels involved with this booking (total nights) |
| `final_balance` | Decimal | Auto-calc from (total paid - total due) |
| `internal_notes` | JSON Array | Array of internal notes text (timestamped) |

### Internal Notes Example (text format):
```json
[
  "[2025-10-17 11:24] Payment received via Bank Alfalah.",
  "[2025-10-17 11:25] Commission auto-posted to agent.",
  "[2025-10-17 11:26] Linked with Umrah package #U245."
]
```

---

## 🔹 5-LEVEL GET ENDPOINTS

### 1️⃣ Organization Ledger (with all its branches & linked orgs)

**Endpoint:** `GET /api/ledger/organization/<organization_id>/`

**Description:** Shows all transactions related to that organization and its branches.

**Response:**
```json
{
  "organization_id": 11,
  "organization_name": "Saer.pk",
  "summary": {
    "total_entries": 245,
    "total_debit": 5500000.00,
    "total_credit": 4800000.00,
    "net_balance": 700000.00
  },
  "service_breakdown": [
    {
      "service_type": "umrah",
      "count": 120,
      "total_amount": 3200000.00
    },
    {
      "service_type": "ticket",
      "count": 85,
      "total_amount": 1500000.00
    }
  ],
  "entries": [
    {
      "id": 1,
      "booking_no": "BK-20251101-ABC1",
      "transaction_type": "debit",
      "service_type": "umrah",
      "narration": "Umrah booking for customer XYZ",
      "transaction_amount": 150000.00,
      "seller_organization": 11,
      "seller_organization_name": "Saer.pk",
      "inventory_owner_organization": 15,
      "inventory_owner_organization_name": "Al-Haram Tours",
      "creation_datetime": "2025-11-01T14:30:00Z",
      "final_balance": 50000.00,
      "payment_ids": [123, 124],
      "umrah_visa_count": 2,
      "hotel_nights_count": 14,
      "internal_notes": [
        "[2025-11-01 14:30] Booking created by Agent Ahmed",
        "[2025-11-01 14:35] Payment 1 of 2 received"
      ]
    }
  ]
}
```

### 2️⃣ Branch Ledger

**Endpoint:** `GET /api/ledger/branch/<branch_id>/`

**Description:** Shows all transactions between branch ↔ organization / agents.

**Response:**
```json
{
  "branch_id": 5,
  "branch_name": "Karachi Branch",
  "organization_id": 11,
  "summary": {
    "total_entries": 85,
    "total_debit": 1200000.00,
    "total_credit": 950000.00,
    "net_balance": 250000.00
  },
  "agency_breakdown": [
    {
      "agency__id": 25,
      "agency__name": "Travel Solutions",
      "count": 35,
      "total_amount": 450000.00
    }
  ],
  "entries": [...]
}
```

### 3️⃣ Agency Ledger

**Endpoint:** `GET /api/ledger/agency/<agency_id>/`

**Description:** Shows all transactions between agent ↔ branch / organization.

**Response:**
```json
{
  "agency_id": 25,
  "agency_name": "Travel Solutions",
  "branch_id": 5,
  "summary": {
    "total_entries": 35,
    "total_debit": 450000.00,
    "total_credit": 420000.00,
    "net_balance": 30000.00,
    "total_commission": 25000.00,
    "commission_entries": 12
  },
  "service_breakdown": [
    {
      "service_type": "umrah",
      "count": 20,
      "total_amount": 300000.00
    },
    {
      "service_type": "commission",
      "count": 12,
      "total_amount": 25000.00
    }
  ],
  "entries": [...]
}
```

### 4️⃣ Area Agency Ledger

**Endpoint:** `GET /api/ledger/area-agency/<area_agency_id>/`

**Description:** Shows all transactions between area agency ↔ organization.

**Response:**
```json
{
  "area_agency_id": 8,
  "area_agency_name": "North Region Lead",
  "summary": {
    "total_entries": 50,
    "total_debit": 680000.00,
    "total_credit": 650000.00,
    "net_balance": 30000.00,
    "total_commission": 35000.00,
    "commission_entries": 15
  },
  "organization_breakdown": [
    {
      "organization__id": 11,
      "organization__name": "Saer.pk",
      "count": 50,
      "total_amount": 680000.00
    }
  ],
  "entries": [...]
}
```

### 5️⃣ Organization-to-Organization Ledger

**Endpoint:** `GET /api/ledger/org-to-org/<org1_id>/<org2_id>/`

**Description:** Shows receivable/payable summary and full transaction history between two companies.

**Response:**
```json
{
  "org1_id": 11,
  "org1_name": "Saer.pk",
  "org2_id": 15,
  "org2_name": "Al-Haram Tours",
  "summary": {
    "total_transactions": 125,
    "org1_payable_to_org2": 850000.00,
    "org1_receivable_from_org2": 200000.00,
    "net_position": -650000.00,
    "net_position_description": "Saer.pk owes Al-Haram Tours"
  },
  "service_breakdown": [
    {
      "service_type": "umrah",
      "count": 80,
      "total_amount": 650000.00
    },
    {
      "service_type": "hotel",
      "count": 45,
      "total_amount": 200000.00
    }
  ],
  "monthly_breakdown": [
    {
      "month": "2025-11",
      "count": 35,
      "total_amount": 450000.00
    },
    {
      "month": "2025-10",
      "count": 42,
      "total_amount": 380000.00
    }
  ],
  "entries": [...]
}
```

---

## 🧮 AUTO POSTING LOGIC

The system automatically creates ledger entries based on the following business rules:

| Condition | Debit | Credit | Narration Example |
|-----------|-------|--------|-------------------|
| Agent booked inventory owned by Saer.pk | Agent | Saer.pk | "Agent payment for ticket booking" |
| Branch booked inventory owned by Saer.pk | Branch | Saer.pk | "Branch booking settlement" |
| Area Agent got commission | Saer.pk | Area Agent | "Area commission for booking #BK-123" |
| Organization A using inventory of Organization B | Org A | Org B | "Inventory share settlement" |
| Refund issued | Saer.pk | Agent / Customer | "Refund for cancelled booking #BK-456" |

### Implementation Example

When a booking is marked as "Paid":

```python
def create_ledger_entry(booking):
    """Auto-create ledger entry when booking is paid"""
    
    # Detect seller and inventory owner
    seller_org = booking.organization  # Who created the booking
    inventory_owner = detect_inventory_owner(booking)  # Who owns the inventory
    
    # Calculate amounts
    transaction_amount = booking.total_amount
    final_balance = booking.total_paid - booking.total_amount
    
    # Create ledger entry
    ledger = LedgerEntry.objects.create(
        booking_no=booking.booking_no,
        transaction_type='debit',  # Agent/branch owes to organization
        service_type=detect_service_type(booking),  # umrah, hotel, ticket, etc.
        narration=f"Booking payment for {booking.booking_no}",
        transaction_amount=transaction_amount,
        final_balance=final_balance,
        seller_organization=seller_org,
        inventory_owner_organization=inventory_owner,
        organization=seller_org,
        branch=booking.branch,
        agency=booking.agency,
        area_agency=booking.area_agency,
        payment_ids=list(booking.payments.values_list('id', flat=True)),
        group_ticket_count=booking.tickets.count(),
        umrah_visa_count=booking.umrah_visas.count() if hasattr(booking, 'umrah_visas') else 0,
        hotel_nights_count=calculate_hotel_nights(booking),
        created_by=booking.created_by,
        internal_notes=[
            f"[{timezone.now().strftime('%Y-%m-%d %H:%M')}] Booking created and paid",
        ]
    )
    
    # Create double-entry lines
    create_double_entry_lines(ledger, seller_org, inventory_owner, transaction_amount)
    
    return ledger
```

---

## 📊 QUERY EXAMPLES

### Get all organization transactions
```bash
curl -X GET "http://127.0.0.1:8000/api/ledger/organization/11/" \
  -H "Authorization: Token YOUR_TOKEN"
```

### Get branch ledger
```bash
curl -X GET "http://127.0.0.1:8000/api/ledger/branch/5/" \
  -H "Authorization: Token YOUR_TOKEN"
```

### Get agency ledger
```bash
curl -X GET "http://127.0.0.1:8000/api/ledger/agency/25/" \
  -H "Authorization: Token YOUR_TOKEN"
```

### Get area agency ledger
```bash
curl -X GET "http://127.0.0.1:8000/api/ledger/area-agency/8/" \
  -H "Authorization: Token YOUR_TOKEN"
```

### Get inter-organization ledger
```bash
curl -X GET "http://127.0.0.1:8000/api/ledger/org-to-org/11/15/" \
  -H "Authorization: Token YOUR_TOKEN"
```

---

## 🔐 PERMISSIONS

All ledger endpoints require authentication:
- **IsAuthenticated** - User must be logged in with valid token
- **Organization-level access** - Users can only see ledgers for their organization and sub-entities
- **Super admin** - Can view all ledgers across all organizations

---

## 📁 FILE STRUCTURE

```
ledger/
├── models.py              # Enhanced LedgerEntry model with new fields
├── serializers.py         # LedgerEntrySerializer with all fields
├── views.py               # Original ledger CRUD views
├── views_levels.py        # NEW: 5-level ledger query views
├── urls.py                # All endpoint routing
└── migrations/
    └── 0004_enhance_ledger_new_format.py  # Migration for new fields
```

---

## 🚀 DEPLOYMENT NOTES

1. **Run migration:**
   ```bash
   python manage.py migrate ledger
   ```

2. **Update existing bookings** (optional - to backfill ledger entries):
   ```python
   from booking.models import Booking
   for booking in Booking.objects.filter(payment_status='Paid', ledger_entry__isnull=True):
       booking.create_ledger_entry()
   ```

3. **Test endpoints:**
   Use the test script to verify all 5 levels work correctly.

---

## ✅ FEATURES

- ✅ Enhanced ledger entry format with all required fields
- ✅ Transaction type: debit/credit (simplified from previous version)
- ✅ Service type tracking: ticket/umrah/hotel/transport/package/payment/refund/commission
- ✅ Organization relationships: seller, inventory owner, branch, agency, area agency
- ✅ Payment tracking with linked payment IDs
- ✅ Booking details: group tickets, Umrah visas, hotel nights
- ✅ Auto-calculated final balance
- ✅ Timestamped internal notes for audit trail
- ✅ 5-level organizational ledger queries
- ✅ Inter-organization receivable/payable tracking
- ✅ Service and monthly breakdowns
- ✅ Commission tracking
- ✅ Complete API documentation with examples

---

## 📞 SUPPORT

For issues or questions, contact the development team.

**Last Updated:** November 1, 2025
**Version:** 2.0 (Enhanced Format)
