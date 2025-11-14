# Ledger API Endpoints

## Overview
Complete REST API for the enhanced ledger system with double-entry bookkeeping, reversal support, and comprehensive reporting.

---

## Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/ledger/` | List all ledger entries |
| GET | `/api/ledger/{id}/` | Retrieve full entry with lines |
| POST | `/api/ledger/create/` | Create a new ledger entry |
| POST | `/api/ledger/{id}/reverse/` | Reverse an existing ledger entry |
| GET | `/api/ledger/accounts/` | List all accounts and balances |
| GET | `/api/ledger/summary/` | Get organization-wide summary |

---

## Detailed Endpoint Documentation

### 1. List All Ledger Entries

**Endpoint:** `GET /api/ledger/`

**Description:** Retrieve a list of all ledger entries in the system, ordered by creation date (newest first).

**Response:**
```json
[
  {
    "id": 7,
    "reference_no": "INV-1DFAB433681E",
    "booking_no": "BK-20251101-DC2C",
    "transaction_type": "booking_payment",
    "service_type": "hotel",
    "narration": "Booking BK-20251101-DC2C - abdul rafay Qureshi",
    "remarks": "Total: 25693.00, Paid: 25693.00, Balance: 0.00",
    "organization": {
      "id": 11,
      "name": "rafay"
    },
    "branch": {
      "id": 8,
      "name": "abdul rafay Qureshi"
    },
    "agency": {
      "id": 25,
      "name": "abdul rafay Qureshi"
    },
    "created_at": "2025-11-01T19:33:42Z",
    "reversed": false,
    "lines": [
      {
        "id": 13,
        "account": {
          "id": 9,
          "name": "Accounts Receivable - abdul rafay Qureshi"
        },
        "debit": "25693.00",
        "credit": "0.00",
        "balance_after": "102772.00",
        "remarks": "Booking created - amount receivable"
      },
      {
        "id": 14,
        "account": {
          "id": 10,
          "name": "Sales Revenue - abdul rafay Qureshi"
        },
        "debit": "0.00",
        "credit": "25693.00",
        "balance_after": "102772.00",
        "remarks": "Sales revenue from booking"
      }
    ]
  }
]
```

---

### 2. Get Ledger Entry Details

**Endpoint:** `GET /api/ledger/{id}/`

**Description:** Retrieve a single ledger entry with all its ledger lines and account details.

**Path Parameters:**
- `id` (integer, required): The ledger entry ID

**Example:** `GET /api/ledger/7/`

**Response:**
```json
{
  "id": 7,
  "reference_no": "INV-1DFAB433681E",
  "booking_no": "BK-20251101-DC2C",
  "transaction_type": "booking_payment",
  "service_type": "hotel",
  "narration": "Booking BK-20251101-DC2C - abdul rafay Qureshi",
  "remarks": "Total: 25693.00, Paid: 25693.00, Balance: 0.00",
  "booking": {
    "id": 123,
    "booking_number": "BK-20251101-DC2C"
  },
  "organization": {
    "id": 11,
    "name": "rafay"
  },
  "branch": {
    "id": 8,
    "name": "abdul rafay Qureshi"
  },
  "agency": {
    "id": 25,
    "name": "abdul rafay Qureshi"
  },
  "created_by": {
    "id": 1,
    "username": "admin"
  },
  "created_at": "2025-11-01T19:33:42Z",
  "reversed": false,
  "reversed_at": null,
  "reversed_by": null,
  "metadata": {
    "booking_id": 123,
    "booking_number": "BK-20251101-DC2C",
    "total_amount": "25693.00",
    "paid_amount": "25693.00",
    "balance_amount": "0.00",
    "ledger_entries": [...]
  },
  "lines": [...]
}
```

---

### 3. Create Ledger Entry

**Endpoint:** `POST /api/ledger/create/`

**Description:** Create a new manual ledger entry with double-entry bookkeeping (debit and credit).

**Request Body:**
```json
{
  "debit_account_id": 1,
  "credit_account_id": 2,
  "amount": "1000.00",
  "booking_no": "BK-20251101-ABCD",
  "service_type": "payment",
  "narration": "Manual payment adjustment",
  "metadata": {
    "notes": "Custom metadata"
  }
}
```

**Required Fields:**
- `debit_account_id` (integer): Account to debit
- `credit_account_id` (integer): Account to credit
- `amount` (decimal): Transaction amount (must be positive)

**Optional Fields:**
- `booking_no` (string): Related booking number
- `service_type` (string): Service type (default: "other")
- `narration` (string): Transaction description
- `metadata` (object): Additional custom data

**Response:** `201 Created`
```json
{
  "id": 9,
  "reference_no": "MANUAL-20251101193342",
  "transaction_type": "manual_adjustment",
  "remarks": "Manual adjustment via API",
  "organization": {...},
  "created_at": "2025-11-01T19:33:42Z",
  "lines": [...]
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields, invalid amount, or organization cannot be determined
- `404 Not Found`: Account not found

---

### 4. Reverse Ledger Entry

**Endpoint:** `POST /api/ledger/{id}/reverse/`

**Description:** Reverse an existing ledger entry by creating an opposite entry that cancels out the original. Used for refunds and cancellations.

**Path Parameters:**
- `id` (integer, required): The ledger entry ID to reverse

**Example:** `POST /api/ledger/7/reverse/`

**Request Body:** None required

**Response:** `201 Created`
```json
{
  "id": 8,
  "reference_no": "INV-1DFAB433681E",
  "transaction_type": "refund",
  "narration": "Reversal of #7: Booking BK-20251101-DC2C - abdul rafay Qureshi",
  "remarks": "Reversal of ledger entry #7",
  "reversed_of": {
    "id": 7,
    "booking_no": "BK-20251101-DC2C"
  },
  "created_at": "2025-11-01T19:34:39Z",
  "lines": [
    {
      "account": {
        "id": 9,
        "name": "Accounts Receivable - abdul rafay Qureshi"
      },
      "debit": "0.00",
      "credit": "25693.00",
      "balance_after": "77079.00",
      "remarks": "Reversal of line from entry #7"
    },
    {
      "account": {
        "id": 10,
        "name": "Sales Revenue - abdul rafay Qureshi"
      },
      "debit": "25693.00",
      "credit": "0.00",
      "balance_after": "77079.00",
      "remarks": "Reversal of line from entry #7"
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request`: Entry already reversed
- `404 Not Found`: Ledger entry not found

**Side Effects:**
- Original entry is marked as `reversed: true`
- Original entry gets `reversed_at` timestamp
- Original entry gets `reversed_by` set to current user
- All account balances are updated atomically

---

### 5. List Accounts and Balances

**Endpoint:** `GET /api/ledger/accounts/`

**Description:** List all accounts in the system with their current balances, optionally filtered by organization, branch, agency, or account type.

**Query Parameters:**
- `organization` (integer, optional): Filter by organization ID
- `branch` (integer, optional): Filter by branch ID
- `agency` (integer, optional): Filter by agency ID
- `account_type` (string, optional): Filter by account type (CASH, BANK, RECEIVABLE, PAYABLE, AGENT, SALES, COMMISSION, SUSPENSE)

**Examples:**
- `GET /api/ledger/accounts/`
- `GET /api/ledger/accounts/?organization=11`
- `GET /api/ledger/accounts/?account_type=RECEIVABLE`
- `GET /api/ledger/accounts/?organization=11&account_type=SALES`

**Response:**
```json
[
  {
    "id": 9,
    "name": "Accounts Receivable - abdul rafay Qureshi",
    "account_type": "RECEIVABLE",
    "balance": "77079.00",
    "organization": {
      "id": 11,
      "name": "rafay"
    },
    "branch": {
      "id": 8,
      "name": "abdul rafay Qureshi"
    },
    "agency": {
      "id": 25,
      "name": "abdul rafay Qureshi"
    }
  },
  {
    "id": 10,
    "name": "Sales Revenue - abdul rafay Qureshi",
    "account_type": "SALES",
    "balance": "77079.00",
    "organization": {
      "id": 11,
      "name": "rafay"
    },
    "branch": {
      "id": 8,
      "name": "abdul rafay Qureshi"
    },
    "agency": {
      "id": 25,
      "name": "abdul rafay Qureshi"
    }
  }
]
```

---

### 6. Get Ledger Summary

**Endpoint:** `GET /api/ledger/summary/`

**Description:** Get a comprehensive summary of ledger activity including total debits, credits, balances by account type, transaction counts, and recent entries.

**Query Parameters:**
- `organization` (integer, optional): Filter by organization ID
- `branch` (integer, optional): Filter by branch ID
- `agency` (integer, optional): Filter by agency ID

**Examples:**
- `GET /api/ledger/summary/`
- `GET /api/ledger/summary/?organization=11`
- `GET /api/ledger/summary/?organization=11&branch=8`

**Response:**
```json
{
  "total_debit": "154158.00",
  "total_credit": "154158.00",
  "net_balance": "0.00",
  "total_entries": 7,
  "total_accounts": 17,
  "account_balances": [
    {
      "account_type": "RECEIVABLE",
      "total_balance": "77079.00",
      "count": 3
    },
    {
      "account_type": "SALES",
      "total_balance": "77079.00",
      "count": 3
    }
  ],
  "transaction_counts": [
    {
      "transaction_type": "booking_payment",
      "count": 5
    },
    {
      "transaction_type": "refund",
      "count": 2
    }
  ],
  "recent_entries": [
    {
      "id": 8,
      "reference_no": "INV-1DFAB433681E",
      "transaction_type": "refund",
      "created_at": "2025-11-01T19:34:39Z"
    }
  ]
}
```

---

## Additional Legacy Endpoints

These endpoints are maintained for backward compatibility:

- `GET /api/agents/pending-balances` - Get pending balances for all agents
- `GET /api/area-agents/pending-balances` - Get pending balances for area agents
- `GET /api/branch/pending-balances` - Get pending balances for all branches
- `GET /api/organization/pending-balances` - Get pending balances for all organizations
- `GET /api/final-balance` - Get global final balance (sum of all account balances)

---

## Transaction Types

The ledger system supports the following transaction types:

- `booking_payment` - Initial booking payment
- `refund` - Refund or reversal
- `commission` - Agent commission
- `manual_adjustment` - Manual adjustment by admin
- `payment_received` - Payment received
- `balance_due` - Remaining balance

---

## Account Types

The ledger system supports the following account types:

- `CASH` - Cash accounts
- `BANK` - Bank accounts
- `RECEIVABLE` - Accounts receivable (amounts owed to us)
- `PAYABLE` - Accounts payable (amounts we owe)
- `AGENT` - Agent accounts
- `SALES` - Sales revenue accounts
- `COMMISSION` - Commission accounts
- `SUSPENSE` - Suspense/temporary accounts

---

## Authentication & Permissions

All endpoints require authentication. The user must be logged in with a valid JWT token.

**Required Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Permissions:**
- Admin and Finance users can view all ledger entries
- Agents can only view their own ledger entries
- Only Admin and Finance users can create manual adjustments
- Only Admin and Finance users can reverse ledger entries

---

## Error Handling

All endpoints return standard HTTP status codes:

- `200 OK` - Successful GET request
- `201 Created` - Successful POST request
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

Error response format:
```json
{
  "detail": "Error message description"
}
```

---

## Examples

### Create a manual payment adjustment

```bash
curl -X POST http://localhost:8000/api/ledger/create/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "debit_account_id": 1,
    "credit_account_id": 2,
    "amount": "5000.00",
    "narration": "Payment received from customer"
  }'
```

### Reverse a ledger entry

```bash
curl -X POST http://localhost:8000/api/ledger/7/reverse/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get organization summary

```bash
curl -X GET "http://localhost:8000/api/ledger/summary/?organization=11" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Integration with Booking System

The ledger system is automatically integrated with the booking workflow:

1. **Booking Created & Paid**: When a booking's payment status changes to "Paid", a ledger entry is automatically created with:
   - Transaction type: `booking_payment`
   - Debit: Accounts Receivable (total amount)
   - Credit: Sales Revenue (total amount)
   - Metadata: Complete booking details

2. **Booking Cancelled**: When a booking is cancelled, the ledger entry can be reversed using the `/reverse/` endpoint, which:
   - Creates a new entry with transaction type `refund`
   - Reverses all debit/credit amounts
   - Marks the original entry as `reversed`
   - Updates all account balances

---

## Notes

- All monetary amounts are stored and returned as strings to preserve decimal precision
- The system uses double-entry bookkeeping: every transaction has equal debits and credits
- All operations are atomic - either all changes succeed or none do
- Account balances are updated in real-time with each ledger entry
- The `balance_after` field on each ledger line shows the account balance after that specific transaction
