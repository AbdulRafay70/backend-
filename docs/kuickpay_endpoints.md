**Kuickpay Integration Reference**

- **Path:** `payments/services/kuickpay.py`
- **Purpose:** Client wrapper used by the project to talk to Kuickpay's REST endpoints for bill inquiry and bill payment.
- **Audience:** Backend developers integrating payments, QA engineers, and devops.

**Overview**

- **Client class:** `KuickpayClient`
- **Base URL:** configured via Django settings `KUICKPAY_CONFIG['BASE_URL']`
- **Auth mechanism:** `username` and `password` are passed as custom HTTP headers by the client (not HTTP Basic).
- **HTTP method:** POST for all public endpoints implemented in the client.
- **Error model:** Network/HTTP errors raise `KuickpayError`. Non-JSON responses are returned as `{'raw_response': <text>}`.

**Configuration**

- Add the following to Django `settings.py` (example):

```
KUICKPAY_CONFIG = {
  'BASE_URL': 'https://kuickpay.example.com',
  'USERNAME': 'your_username',
  'PASSWORD': 'your_password',
  'TIMEOUT': 10,
}
```

- The `KuickpayClient` constructor accepts `base_url`, `username`, `password`, and `timeout` as overrides.

**How the client builds requests**

- Calls are made via `_post(path, json_payload)`.
- The full request `url` is `f"{base_url.rstrip('/')}/{path.lstrip('/')}"`.
- Headers set by `_headers()` are:
  - `username`: configured username
  - `password`: configured password
  - `Content-Type`: `application/json`
- On network errors (`requests.RequestException`) the client logs and raises `KuickpayError`.
- On HTTP status >= 400 the client logs and raises `KuickpayError`.
- On non-JSON responses the client returns `{'raw_response': <text>}`.

**Amount formatting (AN14 signed format)**

- Kuickpay expects monetary amounts in a fixed-width signed string with the last 2 digits as minor units and a total width of 14 characters including sign.
- Example formatting helper provided: `_format_amount(amount: Decimal) -> str`
  - Input: `Decimal('1869.00')`
  - Output: `'+0000000186900'`
- Implementation notes:
  - Convert to minor units by multiplying by 100 then format as a zero-padded 13-digit number preceded by sign.
  - Always pass the formatted string for `transaction_amount` in BillPayment payloads.

**Public Endpoints (client methods)**

1) **Bill Inquiry**
- **Client method:** `KuickpayClient.bill_inquiry(consumer_number: str, bank_mnemonic: str, reserved: Optional[str] = None) -> dict`
- **HTTP:** `POST {BASE_URL}/api/v1/BillInquiry`
- **Payload:**
  - `consumer_number` (string) — required
  - `bank_mnemonic` (string) — required
  - `reserved` (string) — optional; empty string if not provided
- **Response:** Attempt to parse JSON and return it. If not JSON, return `{'raw_response': <text>}`.
- **Errors:** Raises `KuickpayError` for network/HTTP errors.

- Example payload:
```
{
  "consumer_number": "0000812345",
  "bank_mnemonic": "KPY",
  "reserved": ""
}
```

- Example usage:
```
client = KuickpayClient()
resp = client.bill_inquiry(consumer_number='0000812345', bank_mnemonic='KPY')
# handle resp (may be dict or {'raw_response': text})
```

2) **Bill Payment**
- **Client method:** `KuickpayClient.bill_payment(consumer_number: str, tran_auth_id: str, transaction_amount: Decimal, tran_date: str, tran_time: str, bank_mnemonic: str, reserved: Optional[str] = None) -> dict`
- **HTTP:** `POST {BASE_URL}/api/v1/BillPayment`
- **Payload:**
  - `consumer_number` (string) — required
  - `tran_auth_id` (string) — required (transaction auth id)
  - `transaction_amount` (string) — required; must be AN14 signed format (use `_format_amount`)
  - `tran_date` (string) — required (format depends on Kuickpay; match existing integrations)
  - `tran_time` (string) — required (format depends on Kuickpay)
  - `bank_mnemonic` (string) — required
  - `reserved` (string) — optional; empty string if not provided
- **Behavior:** `_format_amount` should be used to prepare `transaction_amount`.
- **Response:** Parsed JSON or `{'raw_response': <text>}`.

- Example payload (after amount formatting):
```
{
  "consumer_number": "0000812345",
  "tran_auth_id": "T123456",
  "transaction_amount": "+0000000186900",
  "tran_date": "20250101",
  "tran_time": "120000",
  "bank_mnemonic": "KPY",
  "reserved": ""
}
```

- Example usage:
```
from decimal import Decimal
client = KuickpayClient()
resp = client.bill_payment(
  consumer_number='0000812345',
  tran_auth_id='T123456',
  transaction_amount=Decimal('1869.00'),
  tran_date='20250101',
  tran_time='120000',
  bank_mnemonic='KPY'
)
```

**Utility helper**

- `map_response_code(resp: dict) -> str` — helper that extracts common response code keys from returned responses. It checks `response_Code`, `response_code`, `Response_Code`, and `ResponseCode` keys and returns the value as a string or empty string if not found.

**Error handling & best practices**

- Wrap calls to `KuickpayClient` in try/except for `KuickpayError` to surface network/HTTP issues.
- If the downstream service occasionally returns plain text (non-JSON), handle `{'raw_response': text}` responses gracefully.
- Log requests and responses with PII redaction.
- Implement idempotency for payments if Kuickpay supports it (to avoid duplicate charges on retries).
- Add retries with exponential backoff for transient network errors. Keep retry count small to avoid duplicate payments.

**Testing recommendations**

- Unit tests:
  - Mock `requests.post` to assert that:
    - Correct `url` is used (path appended to `BASE_URL`).
    - Headers include `username` and `password`.
    - `transaction_amount` is formatted by `_format_amount` as expected.
  - Test `_format_amount()` for positive/negative values and rounding behavior.

- Integration tests (staging):
  - Run the client against a Kuickpay sandbox (if available) and validate both inquiry and payment flows.
  - Validate error handling for 4xx/5xx responses.

**Security notes**

- `username` and `password` are sent as headers by the client. Ensure the Kuickpay service uses TLS and you don't log full header values in production.
- Consider rotating credentials regularly and storing them in a secrets manager.

**Operational suggestions**

- Add structured logs for each Kuickpay request and response, including a correlation id that ties the payment attempt to your application's transaction id.
- Track metrics: request rate, success rate, latency, and error counts.
- If Kuickpay returns response codes in different casing (`response_Code`, `ResponseCode`, etc.), use `map_response_code()` to normalize.

**Example cURL (for debug only)**

Replace `<BASE_URL>`, `<USERNAME>`, `<PASSWORD>` and the payload values as needed.

```
curl -X POST "<BASE_URL>/api/v1/BillInquiry" \
  -H "Content-Type: application/json" \
  -H "username: <USERNAME>" \
  -H "password: <PASSWORD>" \
  -d '{"consumer_number":"0000812345","bank_mnemonic":"KPY","reserved":""}'
```

**Where this file lives**

- `payments/services/kuickpay.py` — implementation used by the app.
- New documentation created: `docs/kuickpay_endpoints.md` (this file).

**Next steps I can take (pick any)**

- Extract sample request/response pairs from integration tests or logs in the repo.
- Add a thin normalization wrapper that returns a consistent structure like `{'code': 'OK', 'data': {...}}` to make callers easier to implement.
- Add unit tests for `_format_amount()` and `KuickpayClient` request building and error handling.

---

*Document generated by the repo assistant. If you want me to add more complete example responses, or add tests and a README, tell me which one and I'll implement it.*

## End-to-end module flow (how this integration works in this repo)

- User / frontend initiates a Bill Inquiry or Bill Payment via the app UI (examples: public booking checkout, admin AddPayment, or agent checkout components).
- The frontend calls the local API endpoints implemented in `payments.views`:
  - `GET /api/kuickpay/bill-inquiry/?consumer_number=...&bank_mnemonic=...`
  - `POST /api/kuickpay/bill-payment/` with JSON body described above.
- The view (`KuickpayBillInquiryAPIView` / `KuickpayBillPaymentAPIView`) validates required params and instantiates `KuickpayClient()` (from `payments/services/kuickpay.py`).
- The view forwards the request to the Kuickpay provider via the client:
  - `KuickpayClient.bill_inquiry(...)` posts JSON to `{BASE_URL}/api/v1/BillInquiry`
  - `KuickpayClient.bill_payment(...)` formats `transaction_amount` to AN14 signed format using `_format_amount()` then posts JSON to `{BASE_URL}/api/v1/BillPayment`
- The provider response (JSON or plain text) is returned unmodified to the caller by the view. If an exception occurs in the client, the view returns a 500 with `{'error': <message>}`.

## Typical request / response shapes (exact examples from views)

- Bill Inquiry (server endpoint)
  - Request (GET query params): `consumer_number`, `bank_mnemonic`, optional `reserved`
  - Example success response (returned directly from Kuickpay client or normalized provider JSON):
    {
      "consumer_number": "0000812345",
      "bill_amount": "1869.00",
      "due_date": "2024-12-31",
      "consumer_name": "John Doe",
      "response_code": "00"
    }
  - Example error response (view wraps client errors):
    {
      "error": "Kuickpay request failed",
      "details": "Invalid consumer number"
    }

- Bill Payment (server endpoint)
  - Request (JSON body):
    {
      "consumer_number": "0000812345",
      "tran_auth_id": "AUTH123456",
      "transaction_amount": "1869.00",  // decimal string; client will convert to AN14
      "tran_date": "20241215",
      "tran_time": "143022",
      "bank_mnemonic": "KPY",
      "reserved": ""
    }
  - Example success response (provider JSON forwarded to caller):
    {
      "transaction_id": "TXN789012",
      "response_code": "00",
      "response_message": "Payment successful",
      "confirmation_number": "CONF123456"
    }
  - Example error response:
    {
      "error": "Payment failed",
      "details": "Insufficient funds"
    }

Notes: the server returns whatever the Kuickpay client returns. If Kuickpay returns plain text, the client wraps it as `{"raw_response": "..."}`.

## How invoices and consumer identifiers are handled in this app

- Invoice numbers for bookings (public or admin-created bookings) are generated by the Booking model method `Booking.generate_invoice_no()` (see `booking/models.py`).
  - Implementation summary: the method uses Python `secrets.token_hex(6)` to build a short random token and prefixes it with `INV-`. It ensures uniqueness by looping and appending a counter if needed.
  - Example invoice format: `INV-4E5F2A9B7C3D` (short hex token). In some test helpers a more descriptive invoice is used like `INV-SEED-...`.
- Transaction / Payment numbers (internal transaction_number stored on `Payment` model):
  - If a `Payment.transaction_number` is not provided, the `Payment.save()` logic auto-generates one using a per-month sequence: `TRN-YYYYMM-00001`.
  - The implementation uses a DB-backed counter (`booking_trnsequence` table) and falls back to `select_for_update` or timestamp+random on errors.
  - This number is different from Kuickpay's provider transaction/confirmation ids; internal code stores Kuickpay's returned reference in `Payment.kuickpay_trn`.
- Consumer numbers are not auto-created by this module — they are provided by the caller (frontend/customer) and correspond to the utility/account identifier that Kuickpay expects. The app does not invent utility consumer numbers.

## How payment results should be recorded in this app

- The Kuickpay endpoints in `payments.views` only proxy requests to the provider and return its response. Recording the payment (creating/updating `Payment` objects and linking them to `Booking`) is done by the app code that initiates the payment flow (e.g., booking creation endpoints, public payment endpoints, or admin AddPayment flow).
- Typical pattern used in the repo:
  1. Create a `Payment` record with `status='Pending'`, `method='online'`, `amount` and `booking` reference.
 2. Call `GET /api/kuickpay/bill-inquiry/` to validate/confirm the bill (frontend step).
 3. Call `POST /api/kuickpay/bill-payment/` with the `tran_auth_id` from inquiry and payment details.
 4. If the response indicates success, store provider reference in `payment.kuickpay_trn`, update `payment.status='Completed'`, and let the `Payment.save()` post-save handlers create ledger entries and update booking paid/pending totals.

## Common responses & error handling

- Success codes: many Kuickpay-like providers use `response_code` `'00'` for success; the repo has helper `map_response_code()` to normalize casing differences in provider fields.
- Non-JSON responses: the client returns `{'raw_response': '<text>'}` — callers must handle this shape.
- Network / HTTP >=400: `KuickpayClient._post()` logs and raises `KuickpayError`. Views catch this and return 500 with `{'error': '<message>'}`.
- Validation errors: the `KuickpayBillPaymentAPIView` returns 400 if required fields are missing or if `transaction_amount` can't be parsed as Decimal.

## Implementation notes & recommended improvements

- Webhooks: the repo includes UI pages for webhook logs and webhook_url config, but there is no generic webhook processing view for Kuickpay in `payments.views`. If you want real-time status updates from Kuickpay, add a webhook endpoint (POST) that:
  - verifies Kuickpay signature (if provided),
  - parses provider payload, maps provider reference to local `Payment` (match by `kuickpay_trn` or `transaction_number`),
  - updates `Payment.status` and triggers ledger/booking updates.
- Idempotency: add an idempotency key to payment requests to avoid duplicate charges. Store a per-payment idempotency token and reject duplicate attempts.
- Normalize provider responses: consider adding a small normalization wrapper that returns a consistent shape to callers, e.g. `{'ok': True, 'code': '00', 'data': {...}, 'raw': {...}}` so frontend and internal code can rely on uniform structure.
- Security: remove Kuickpay credentials from source-controlled `settings.py` and read them from environment variables in production. Update `docs/kuickpay_endpoints.md` to show the env var pattern.

## Quick reference — storage fields (where to look in code)

- `payments/services/kuickpay.py` — Kuickpay low-level client and amount formatting helper (`_format_amount`).
- `payments/views.py` — `KuickpayBillInquiryAPIView` and `KuickpayBillPaymentAPIView` (proxied HTTP endpoints used by frontend).
- `booking.models.Payment` — payment model with fields: `amount`, `status`, `transaction_number`, `kuickpay_trn`, `booking` reference, and `save()` logic that generates internal `transaction_number` and creates ledger entries when `status` becomes `Completed`.
- `booking.models.Booking.generate_invoice_no()` — invoice generation (INV-... token) used during booking creation.

---

If you want, I can now:
- Add a sample webhook endpoint and example payload/handler in `payments/views.py` (safe default implementation), or
- Add an adapter that normalizes Kuickpay responses before returning them to the frontend, or
- Move `KUICKPAY_CONFIG` to environment variables and update `docs/kuickpay_endpoints.md` with usage examples.

Which of those would you like next?