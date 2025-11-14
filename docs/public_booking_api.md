# Public Booking Status API

This document describes the public booking status API which allows customers to view booking details using a booking number or a secure public reference (used in QR links).

## Purpose
Allow end-users (customers) to check their booking status and public-facing details without authentication. Only non-sensitive data is exposed.

## Endpoints
- GET /api/public/booking-status/<booking_no>/
  - Lookup by booking number (public read-only)
  - Example: GET /api/public/booking-status/BK-20251031-ABC123/

- GET /api/public/booking-status/?ref=PUBLIC_REF
  - Lookup by secure public reference token (recommended for QR links)
  - Example: GET /api/public/booking-status/?ref=INV-BK-20251031-ABCDEF123456

Both endpoints return the same payload structure.

## Response (example)

{
  # Public Booking Status API

  Purpose

  This API allows customers to securely verify their booking details and status without needing authentication. Only public, non-sensitive fields are exposed, ensuring privacy and data protection.

  Endpoints

  1️⃣ Lookup by Booking Number

  GET /api/public/booking-status/<booking_no>/


  Example:

  GET /api/public/booking-status/BK-20251031-ABC123/

  2️⃣ Lookup by Secure Public Reference (Recommended for QR Links)

  GET /api/public/booking-status/?ref=PUBLIC_REF


  Example:

  GET /api/public/booking-status/?ref=INV-BK-20251031-ABCDEF123456


  ✅ Both endpoints return the same response format.

  Response Example

  {
    "booking_number": "BK-20251031-ABC123",
    "public_ref": "INV-BK-20251031-ABCDEF123456",
    "creation_date": "2025-10-31T12:34:56Z",
    "person_details": [
      {
        "person_title": "Mr",
        "first_name": "John",
        "last_name": "Doe",
        "age_group": "ADULT",
        "passport_number": "123456789"
      }
    ],
    "service_summary": {
      "booking_type": "UMRAH",
      "category": "Premium",
      "is_full_package": true
    },
    "booking_type": "UMRAH",
    "hotel_details": [
      {
        "hotel": { "name": "Sample Hotel" },
        "check_in_date": "2026-02-01",
        "check_out_date": "2026-02-10",
        "number_of_nights": 9,
        "room_type": "Deluxe"
      }
    ],
    "transport_details": [],
    "ticket_details": [],
    "payment_status": "Partially Paid",
    "status": "Confirmed",
    "total_paid": 25000.0,
    "remaining_balance": 5000.0,
    "uploaded_documents": [
      {
        "type": "passport_picture",
        "filename": "passport_john.jpg",
        "url": "/media/person/passport_john.jpg"
      }
    ]
  }

  🔒 Data Privacy Notes

  Internal IDs, organizations, agents, commissions, and financial ledgers are never exposed.

  Document URLs are public-safe or signed (no raw file paths).

  Security & Rate Limiting

  Aspect	Description
  Token Generation	public_ref generated with HMAC-SHA256 using Django SECRET_KEY + booking data.
  Rate Limit	10 requests/min per IP (configurable in DRF settings).
  Abuse Prevention	Returns 404 for invalid or expired references. Consider CAPTCHA or temporary blocking for heavy access.

  QR Integration

  Each booking has a public_ref stored in the Booking.public_ref field.

  Suggested QR link format for client emails or invoices:

  https://saer.pk/order-status/?ref={public_ref}

  🧰 Management Command

  To generate or regenerate secure public references:

  python manage.py generate_public_refs --print-qr
  # To regenerate all references (use with caution)
  python manage.py generate_public_refs --regenerate

  Admin & Operational Notes

  Migration file: booking/migrations/0069_add_public_ref.py

  Run migrations after pull:

  python manage.py migrate


  Add public_ref to Django Admin display/search for easy lookup.

  For secure media access, use short-lived signed URLs for any uploaded files.

  Troubleshooting

  Issue	Resolution
  public_ref missing for old bookings	Run python manage.py generate_public_refs
  Throttle limit reached (HTTP 429)	Increase rate limit in settings.py under REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']
  Incorrect data fields returned	Check PublicBookingSerializer for field whitelisting

  Future Enhancements

  Optional verification via email/SMS for customer confirmation

  QR image generation endpoint

  Payment tracking redirect page (linked from QR view)

  Contact

  For bug reports or new feature requests (like signed document URLs or advanced throttling),
  please open a ticket in the project repository or report via the backend enhancement request channel.
