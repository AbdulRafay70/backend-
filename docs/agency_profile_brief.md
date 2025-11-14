# Agency Profile — Developer Brief

This brief converts the product-level description into a clear, developer-ready plan for implementing the Agency Profile (Relationship & Work Overview) module.

## 1. Purpose
The Agency Profile API lets admins and the Saer.pk team view and manage an agency's relationship, performance, work history, communications, and conflicts. It acts as an "agency behavior dashboard" to gauge reliability and risk.

## 2. Endpoints to build

A. GET /api/agency/profile?agency_id={id}
- Purpose: Return full relationship overview for a single agency.
- Input: `agency_id` (query param, required)
- Output: 200 JSON with all profile fields. 404 if no profile.
- Sort `relation_history` and `recent_communication` by date (latest first).
- Optional future params: `?status=active`, `?include_conflicts=true`.

B. POST /api/agency/profile
- Purpose: Upsert an AgencyProfile (create if not exists, update if exists).
- Input: JSON body (see sample below).
- Behavior: auto-fill `created_by`, `updated_by`, `created_at`, `updated_at` using request.user and model timestamps.
- Output: success JSON with updated_profile summary.

Sample POST body
```json
{
  "agency": 123,
  "relationship_status": "active",
  "relation_history": [{"date":"2025-10-20","type":"meeting","note":"Onboarded"}],
  "working_with_companies": [{"organization_id":55,"organization_name":"HotelCo","work_types":["hotel_booking"]}],
  "performance_summary": {"total_bookings":120,"on_time_payments":110,"late_payments":10},
  "recent_communication": [{"date":"2025-10-27","type":"call","note":"Follow-up"}],
  "conflict_history": [{"date":"2025-09-10","reason":"payment_delay","resolved":true}]
}
```

Success response
```json
{
  "success": true,
  "message": "Agency profile updated successfully",
  "updated_profile": {"agency": 123, "relationship_status": "active", "id": 3}
}
```

## 3. Database design (suggested)
Model: `AgencyProfile` (in `organization/models.py`)

Fields
- id: AutoField (PK)
- agency: OneToOneField(Agency, on_delete=CASCADE) — ensures one profile per agency
- relationship_status: CharField(max_length=32, choices=("active","inactive","risky","dispute"))
- relation_history: JSONField — list of {date, type, note}
- working_with_companies: JSONField — list of {organization_id, organization_name, work_types:[]}
- performance_summary: JSONField — object {total_bookings, on_time_payments, late_payments}
- recent_communication: JSONField — list of {date, type, note, created_by}
- conflict_history: JSONField — list of {date, reason, resolved, resolution_note}
- created_by: ForeignKey(User, null=True, on_delete=SET_NULL)
- updated_by: ForeignKey(User, null=True, on_delete=SET_NULL)
- created_at: DateTimeField(auto_now_add=True)
- updated_at: DateTimeField(auto_now=True)

Notes:
- Use `JSONField` (Django 3.1+) for flexible arrays/objects. If DB doesn't support JSONField, use `TextField` and validate JSON in serializer.
- OneToOneField recommended to guarantee single profile per agency.

## 4. Validation rules (server-side)
- `agency`: required, must exist in `Agency` table.
- `relationship_status`: required, must be one of ["active","inactive","risky","dispute"].
- `relation_history`: if present, must be array; each item must have `date` (YYYY-MM-DD), `type`, `note`.
- `working_with_companies`: array of objects with `organization_id` (int), `organization_name` (str), `work_types` (array of strings).
- `performance_summary`: object containing `total_bookings` (int), `on_time_payments` (int), `late_payments` (int).
- `conflict_history`: array of {date, reason, resolved(bool)}.
- Dates should be validated server-side and returned in ISO-8601.

## 5. API Flow (step-by-step)

GET flow
1. Authenticate (IsAuthenticated permission). If unauthorized → 401.
2. Parse `agency_id` from query params. If missing/invalid → 400.
3. Confirm Agency exists. If not → 404.
4. Retrieve AgencyProfile (OneToOne). If not found → 404 with `{"message":"No profile found"}`.
5. Sort `relation_history` and `recent_communication` by date desc in view/serializer.
6. Return serialized profile (200).

POST flow (Upsert)
1. Authenticate (IsAuthenticated). If unauthorized → 401.
2. Parse and validate request body using serializer.
3. Confirm `agency` exists.
4. Start DB transaction.
5. If profile exists: update fields and set `updated_by` = request.user.
6. Else: create profile; set `created_by` and `updated_by` = request.user.
7. Commit transaction and return success JSON with saved profile.

## 6. Error handling
- Validation errors: 400 with `{ "errors": <field_errors> }`.
- Auth errors: 401.
- Not found: 404.
- Unexpected server error: 500 (log details server-side).

## 7. Integration points (future)
- Booking API: cron or signal updates to `performance_summary.total_bookings`.
- Payments API: update `on_time_payments` / `late_payments`.
- Conflict Management: create conflict entries in `conflict_history` when a dispute is opened.
- Admin Dashboard will read `AgencyProfile` for quick status widgets.

## 8. Acceptance criteria (tests)
| # | Requirement | Pass condition |
|---|-------------|----------------|
|1|GET returns complete profile|All fields present, relation_history and recent_communication sorted| 
|2|GET returns 404 if profile missing|404 with `{ message: "No profile found" }`|
|3|POST upsert works|Creates when none, updates when exists; returns success + profile id|
|4|Audit fields set|created_by, updated_by, created_at, updated_at stored correctly|
|5|Validation enforced|Bad input → 400 and descriptive errors|
|6|Auth enforced|Unauthenticated → 401|

## 9. Tests to implement
- test_get_profile_success
- test_get_profile_not_found
- test_post_create_profile
- test_post_update_profile
- test_post_invalid_agency
- test_post_validation_errors (dates, missing required)
- test_auth_required

Test notes:
- Use DRF `APIClient` with `force_authenticate` for user tests.
- Add a fixture for a sample Agency and an admin user.

## 10. Implementation checklist (developer tasks)
- [ ] Create `AgencyProfile` model (migrations).
- [ ] Create `AgencyProfileSerializer` with JSON validation.
- [ ] Add `GET` & `POST` endpoints in `organization/views.py`.
- [ ] Register route(s) in `organization/urls.py`.
- [ ] Add tests in `organization/tests.py` and run them.
- [ ] Add fixture/seed data for UI testing.

## 11. Dev commands
Run migrations:
```powershell
python manage.py makemigrations organization
python manage.py migrate
```

Run tests:
```powershell
python manage.py test organization.tests
```

Load fixtures (example):
```powershell
python manage.py loaddata docs/fixtures/agency_profiles.json
```

## 12. Next steps I can take for you
I can implement the model, serializer, endpoints, and tests next. Tell me to proceed and I will:
- create model + migrations,
- implement serializer and validation,
- implement views and routes,
- write tests and run them, updating the todo list as I progress.

---

Created: 2025-10-29
