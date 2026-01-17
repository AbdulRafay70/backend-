# Kuickpay API Reference

This document provides the complete request and response specifications for the Kuickpay integration APIs.

---

## 1. Bill Inquiry API

### Endpoint
```
GET /api/kuickpay/bill-inquiry/
```

### Description
Query bill information from Kuickpay payment gateway. This endpoint is used to check bill details before making a payment.

### Authentication
- **Required:** Yes (Bearer Token)
- **Permission:** IsAuthenticated

### Request Parameters (Query String)

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `consumer_number` | string | Yes | Consumer/utility account number | `"0000812345"` |
| `bank_mnemonic` | string | Yes | Bank identifier mnemonic | `"KPY"` |
| `reserved` | string | No | Reserved field for additional data | `""` |

### Request Example

```http
GET /api/kuickpay/bill-inquiry/?consumer_number=0000812345&bank_mnemonic=KPY&reserved= HTTP/1.1
Host: your-domain.com
Authorization: Bearer <your_token>
```

### Success Response (200 OK)

```json
{
  "consumer_number": "0000812345",
  "bill_amount": "1869.00",
  "due_date": "2024-12-31",
  "consumer_name": "John Doe",
  "response_code": "00"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `consumer_number` | string | The consumer account number |
| `bill_amount` | string | Bill amount in decimal format |
| `due_date` | string | Bill due date (YYYY-MM-DD) |
| `consumer_name` | string | Name of the consumer |
| `response_code` | string | Response code ("00" = success) |

### Error Responses

#### 400 Bad Request - Missing Parameters
```json
{
  "error": "consumer_number and bank_mnemonic are required"
}
```

#### 500 Internal Server Error - Kuickpay Error
```json
{
  "error": "Kuickpay request failed",
  "details": "Invalid consumer number"
}
```

#### 500 Internal Server Error - Unexpected Error
```json
{
  "error": "Unexpected error: <error_message>"
}
```

---

## 2. Bill Payment API

### Endpoint
```
POST /api/kuickpay/bill-payment/
```

### Description
Process bill payment through Kuickpay payment gateway. This endpoint is used to make utility bill payments.

### Authentication
- **Required:** Yes (Bearer Token)
- **Permission:** IsAuthenticated

### Request Body (JSON)

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `consumer_number` | string | Yes | Consumer/utility account number | `"0000812345"` |
| `tran_auth_id` | string | Yes | Transaction authorization ID from bill inquiry | `"AUTH123456"` |
| `transaction_amount` | string | Yes | Payment amount (decimal format) | `"1869.00"` |
| `tran_date` | string | Yes | Transaction date (YYYYMMDD format) | `"20241215"` |
| `tran_time` | string | Yes | Transaction time (HHMMSS format) | `"143022"` |
| `bank_mnemonic` | string | Yes | Bank identifier mnemonic | `"KPY"` |
| `reserved` | string | No | Reserved field for additional data | `""` |

### Request Example

```http
POST /api/kuickpay/bill-payment/ HTTP/1.1
Host: your-domain.com
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "consumer_number": "0000812345",
  "tran_auth_id": "AUTH123456",
  "transaction_amount": "1869.00",
  "tran_date": "20241215",
  "tran_time": "143022",
  "bank_mnemonic": "KPY",
  "reserved": ""
}
```

### Success Response (200 OK)

```json
{
  "transaction_id": "TXN789012",
  "response_code": "00",
  "response_message": "Payment successful",
  "confirmation_number": "CONF123456"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `transaction_id` | string | Unique transaction identifier |
| `response_code` | string | Response code ("00" = success) |
| `response_message` | string | Human-readable response message |
| `confirmation_number` | string | Payment confirmation number |

### Error Responses

#### 400 Bad Request - Missing Fields
```json
{
  "error": "Missing required fields: tran_auth_id, transaction_amount"
}
```

#### 400 Bad Request - Invalid Amount Format
```json
{
  "error": "Invalid transaction_amount format: <error_details>"
}
```

#### 500 Internal Server Error - Payment Failed
```json
{
  "error": "Payment failed",
  "details": "Insufficient funds"
}
```

#### 500 Internal Server Error - Kuickpay Error
```json
{
  "error": "<kuickpay_error_message>"
}
```

#### 500 Internal Server Error - Unexpected Error
```json
{
  "error": "Unexpected error: <error_message>"
}
```

---

## Response Codes

Common Kuickpay response codes:

| Code | Description |
|------|-------------|
| `00` | Success |
| `01` | Invalid consumer number |
| `02` | Bill not found |
| `03` | Payment failed |
| `04` | Insufficient funds |
| `05` | Transaction timeout |
| `99` | System error |

---

## Integration Flow

### Typical Payment Flow:

1. **Bill Inquiry** - First, query the bill details:
   ```
   GET /api/kuickpay/bill-inquiry/?consumer_number=0000812345&bank_mnemonic=KPY
   ```

2. **Display Bill Details** - Show the bill information to the user for confirmation

3. **Process Payment** - If user confirms, make the payment:
   ```
   POST /api/kuickpay/bill-payment/
   {
     "consumer_number": "0000812345",
     "tran_auth_id": "AUTH123456",
     "transaction_amount": "1869.00",
     "tran_date": "20250109",
     "tran_time": "132500",
     "bank_mnemonic": "KPY"
   }
   ```

4. **Record Payment** - Store the transaction details in your database

---

## Important Notes

### Amount Formatting
- The API accepts amounts in decimal string format (e.g., `"1869.00"`)
- Internally, the backend converts this to Kuickpay's AN14 signed format: `"+0000000186900"`
- You don't need to format the amount yourself - just send the decimal string

### Date/Time Format
- **Date:** YYYYMMDD (e.g., `"20250109"` for January 9, 2025)
- **Time:** HHMMSS (e.g., `"143022"` for 14:30:22)

### Transaction Authorization ID
- The `tran_auth_id` should be obtained from a prior bill inquiry or generated by your system
- This ID links the payment to the specific bill

### Bank Mnemonic
- Common value: `"KPY"` for Kuickpay
- Check with your payment provider for the correct mnemonic to use

---

## Testing

### Test Credentials
Configure in Django settings:

```python
KUICKPAY_CONFIG = {
    'BASE_URL': 'https://kuickpay.example.com',
    'USERNAME': 'your_username',
    'PASSWORD': 'your_password',
    'TIMEOUT': 10,
}
```

### Sample cURL Commands

**Bill Inquiry:**
```bash
curl -X GET "http://localhost:8000/api/kuickpay/bill-inquiry/?consumer_number=0000812345&bank_mnemonic=KPY" \
  -H "Authorization: Bearer <your_token>"
```

**Bill Payment:**
```bash
curl -X POST "http://localhost:8000/api/kuickpay/bill-payment/" \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "consumer_number": "0000812345",
    "tran_auth_id": "AUTH123456",
    "transaction_amount": "1869.00",
    "tran_date": "20250109",
    "tran_time": "132500",
    "bank_mnemonic": "KPY",
    "reserved": ""
  }'
```

---

## Related Documentation

- **Implementation Details:** See `docs/kuickpay_endpoints.md`
- **Client Code:** `payments/services/kuickpay.py`
- **View Implementation:** `payments/views.py`
- **URL Configuration:** `payments/urls.py`

---

*Last Updated: January 9, 2025*
