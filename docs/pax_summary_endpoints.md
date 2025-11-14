## Pax Summary Endpoints — how they work and how to use them

This document explains the grouped Pax summary endpoints implemented in the `booking` app:
- Hotel Pax Summary: `/api/pax-summary/hotel-status/`
- Transport Pax Summary: `/api/pax-summary/transport-status/`
- Flight Pax Summary: `/api/pax-summary/flight-status/`

Each endpoint returns DB-level aggregated counts of bookings and pax grouped by the relevant entity (hotel / transport / airline + sector).

## Purpose
These endpoints provide a compact dashboard-style summary so the frontend can render grouped stats with minimal queries and low network overhead. Aggregation is performed at the database level using Django ORM `values().annotate()` to avoid fetching individual rows into Python.

## Authentication & Scope
- The project uses DRF's authentication classes (JWT in settings). Tests and programmatic calls use DRF `force_authenticate` or a valid token.
- Every endpoint applies `apply_user_scope(qs, request.user)` to the underlying `Booking` queryset prior to aggregation. This enforces organization/branch/agency/user-level access rules.
  - Staff / superuser: full access
  - Non-staff: access restricted to bookings created by the user or within user's organizations/branches/agencies (see `universal/scope.py`)

## Query parameters
- `date_from` (optional): ISO date or datetime string. Filters bookings with `created_at >= date_from`.
- `date_to` (optional): ISO date or datetime string. Filters bookings with `created_at <= date_to`.

Usage examples (powershell):

```powershell
# All hotels/travels/flights in your scope
python -m http.client get "http://localhost:8000/api/pax-summary/hotel-status/" -H "Authorization: Bearer <TOKEN>"

# Hotels in a specific created_at range
python -m http.client get "http://localhost:8000/api/pax-summary/hotel-status/?date_from=2025-01-01&date_to=2025-01-31" -H "Authorization: Bearer <TOKEN>"
```

(Replace with your favorite HTTP client; the `Authorization` header is required unless endpoint is publicly exposed.)

## Response shapes
- Hotel summary: array of objects
  - `hotel`: hotel name (string)
  - `city`: city name (string or null)
  - `bookings`: integer (count of distinct bookings linked to the hotel)
  - `pax`: float (sum of `booking.total_pax` for the included bookings)

Example:

```json
[
  {"hotel": "Hilton Makkah", "city": "Makkah", "bookings": 5, "pax": 23.0},
  {"hotel": "Zamzam Tower", "city": "Madinah", "bookings": 2, "pax": 7.0}
]
```

- Transport summary: array of objects
  - `transport`: vehicle name
  - `route`: string like `Departure → Arrival` (or `---` placeholders)
  - `bookings`: integer
  - `pax`: float

- Flight summary: array of objects
  - `airline`: airline name
  - `sector`: `Departure → Arrival`
  - `bookings`: integer
  - `pax`: float

## Implementation details (brief)
- The endpoints use DB-level aggregation for performance and to avoid double-counting when a booking has multiple detail rows. Implementation idioms:
  - Build a `Booking` base queryset `bs = Booking.objects.all()`
  - Enforce scope: `bs = apply_user_scope(bs, request.user)`
  - Apply optional date filters on `bs` using `created_at`
  - Aggregate via detail model (hotel/transport/ticket) with a `filter(booking__in=bs)` and `values(...).annotate(...)`.

- Example (Hotel):
  - ORM snippet:

```python
agg_qs = (
    BookingHotelDetails.objects.filter(booking__in=bs)
    .values('hotel__name', 'hotel__city__name')
    .annotate(
        bookings=Count('booking', distinct=True),
        pax=Coalesce(Sum('booking__total_pax', output_field=FloatField()), Value(0, output_field=FloatField()), output_field=FloatField())
    )
)
```

- Important: the code explicitly sets `output_field=FloatField()` on `Sum` and `Coalesce`. This ensures Django does not complain about mixed numeric types when building the SQL expression.

## Why aggregate on detail models?
- When one Booking has many HotelDetails/TransportDetails/TicketDetails, counting on Booking directly from the detail table without `distinct` can over-count. The detail-table aggregation + `Count('booking', distinct=True)` gives a correct count of the number of bookings affecting each entity while still aggregating pax via `booking__total_pax`.

## Edge cases & notes
- Timezone-aware filtering: the project has `USE_TZ=True`. Tests should set `created_at` as timezone-aware datetimes when updating auto_now_add fields. The test code demonstrates updating the `created_at` value via `Booking.objects.filter(pk=...).update(created_at=timezone.make_aware(...))`.
- Numeric types: pax values are returned as floats in the JSON to keep parity with Sum(..., output_field=FloatField()).
- Missing names: the endpoints return foreign-name lookups like `hotel__name` or `ticket__airline__name`. If the related record was deleted or name is null, you may get nulls in results.

## Tests
- A focused test file exists for hotels: `booking/tests/test_hotel_summary_fixed.py`. It tests two things:
  1. Basic aggregation across two hotels (multiple bookings)
  2. Date filtering (ensures an older booking is excluded when `date_from` is provided)

Run individual tests (powershell):

```powershell
# run only hotel summary tests
python manage.py test booking.tests.test_hotel_summary_fixed -v 2

# run the whole booking testset
python manage.py test booking -v 2
```

Notes when writing tests:
- Use `APIClient().force_authenticate(user=...)` so DRF views see the test user (project uses JWT auth by default).
- When you need to assert date filters, create the booking normally then update `created_at` via `Booking.objects.filter(pk=...).update(created_at=aware_dt)` because `auto_now_add` prevents passing created_at on create.

## Caching (optional)
To speed up dashboard calls you can add caching per user/scope+params:

- Cache key suggestion: `f"pax_summary:hotel:{user_id}:{org_id}:{branch_id}:{agency_id}:{date_from}:{date_to}"`
- TTL: small (30–300 seconds) depending on freshness requirements.
- Use `django.core.cache.cache.get_or_set(key, compute_fn(), timeout=TTL)`.
- Keep a short TTL or invalidate on booking creation/update if strong consistency is required (more complex).

## Common troubleshooting
- FieldError: "Expression contains mixed types" → fix with `output_field=FloatField()` on Sum/Coalesce.
- Empty results in tests → ensure `apply_user_scope` isn't filtering everything out; test with a staff user (is_staff=True) or add test user to the organization/branch/agency membership as appropriate.
- Date filtering not excluding older rows → ensure `created_at` was set to a timezone-aware datetime for tests when `USE_TZ=True`.

## Next steps & enhancements
- Add transport & flight test modules following the hotel test pattern.
- Add multi-role tests (agent / branch user / org user / staff) to validate apply_user_scope behavior.
- Add optional caching and an invalidation strategy for booking writes.
- Add drf-spectacular schema docs or inline OpenAPI examples for the three endpoints.

---

File location: `docs/pax_summary_endpoints.md`

If you want, I can:
- Move `test_hotel_summary_fixed.py` back to the canonical `test_hotel_summary.py` (clean rename) and remove the shim.
- Add the transport and flight tests (create files `booking/tests/test_transport_summary.py` and `booking/tests/test_flight_summary.py`) and run the full test suite.
- Implement per-endpoint caching and add tests/benchmark for response speed.

Tell me which of the next tasks you'd like me to do and I'll proceed and run the tests for verification.