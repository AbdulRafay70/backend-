# Rules Management API — Developer Brief

Created: 2025-10-29

## 1. Purpose
The Rules API allows admins to create, update, deactivate, and fetch dynamic rules (terms & policies) that are displayed across product pages such as Booking, Agent Dashboard, Hotel, Transport, and Visa pages. Rules are multilingual and versioned for compliance tracking. The API enables dynamic content without frontend changes.

## 2. Endpoints (summary)

A. POST /api/rules/create
- Purpose: Create a new rule or update an existing one when `id` is provided (upsert).
- Permissions: Admin-only (IsAuthenticated + admin check)
- Request body example:
```json
{
  "id": null,
  "title": "Umrah Booking Terms",
  "description": "All Umrah bookings are subject to advance payment and visa approval.",
  "rule_type": "terms_and_conditions",
  "pages_to_display": ["booking_page","agent_portal"],
  "is_active": true,
  "language": "en",
  "created_by": "admin_001"
}
```
- Behavior:
  - If `id` is null → create new Rule record.
  - If `id` is present → update existing Rule (upsert semantics).
  - Auto-fill `created_at`, `updated_at`, `created_by`, `updated_by`.
  - Default `is_active` = true when omitted.
- Response example:
```json
{ "success": true, "message": "Rule created successfully", "rule_id": 23 }
```

B. GET /api/rules/list
- Purpose: Fetch active rules for a page or rule type.
- Query params:
  - `type` (optional) → filter by `rule_type`
  - `page` (optional) → filter by `pages_to_display` contains
  - `language` (optional) → filter by language (defaults to `en` if not provided)
- Behavior:
  - Returns only `is_active = true` rules by default.
  - Supports filtering by `type`, `page`, `language`.
  - Sorted by `updated_at` DESC.
- Response example:
```json
{ "rules": [ {"id":23,"title":"Umrah Booking Terms","description":"...","pages_to_display":["booking_page"],"is_active":true}, ... ] }
```

C. PUT /api/rules/update/{id}
- Purpose: Update rule details and increment `version`.
- Permissions: Admin-only
- Request body example:
```json
{ "title":"Updated Umrah Terms","description":"New text...","pages_to_display":["booking_page"],"is_active":true }
```
- Behavior:
  - Validate rule exists.
  - Update provided fields.
  - Increment `version` by 1 and set `updated_by`, `updated_at`.
- Response example:
```json
{ "success": true, "message":"Rule updated successfully","rule_id":23 }
```

D. DELETE /api/rules/delete/{id}
- Purpose: Soft-delete (deactivate) the rule by setting `is_active=false`.
- Permissions: Admin-only
- Behavior:
  - Validate exists.
  - Set `is_active=false` (or permanently delete if required by policy).
- Response example:
```json
{ "success": true, "message":"Rule deleted successfully" }
```

## 3. Database Design
Model: `Rule` (in `organization/models.py`)

| Field | Type | Notes |
|---|---|---|
| id | AutoField | Primary key |
| title | CharField(max_length=255) | required |
| description | TextField | required, min length 10 |
| rule_type | CharField(max_length=100) | e.g., terms_and_conditions, policy, commission_rule |
| pages_to_display | JSONField | e.g., ["booking_page","hotel_page"] |
| is_active | BooleanField(default=True) | whether visible |
| language | CharField(max_length=10, default='en') | supported langs (en, ur) |
| version | IntegerField(default=1) | increment on updates |
| created_by | ForeignKey(User, null=True, on_delete=SET_NULL) | audit |
| updated_by | ForeignKey(User, null=True, on_delete=SET_NULL) | audit |
| created_at | DateTimeField(auto_now_add=True) | |
| updated_at | DateTimeField(auto_now=True) | |

Notes
- Use `JSONField` for `pages_to_display` for flexible multi-page assignment.
- Optionally implement a `RuleVersion` table to store historical versions for compliance: when updating a rule, copy previous version into `RuleVersion` and increment `version` in `Rule`.

## 4. Validation Rules
- `title`: required, non-empty.
- `description`: required, min length 10.
- `rule_type`: required, one of allowed types (configurable): `terms_and_conditions`, `policy`, `commission_rule`, etc.
- `pages_to_display`: required, must be list of allowed page identifiers (booking_page, hotel_page, transport_page, visa_page, agent_portal, etc.).
- `language`: default `en`; must be in supported langs list (['en','ur']).
- `is_active`: boolean.
- `id`: optional (used for upsert).

## 5. API Flow (step-by-step)

POST /api/rules/create (Upsert)
1. Authenticate user. Require admin privileges (or a specific permission).
2. Validate payload.
3. If `id` provided and rule exists:
   - Update fields, increment `version`, set `updated_by` = request.user.
   - Optionally store previous version in `RuleVersion`.
4. Else:
   - Create new rule, set `created_by` and `updated_by` = request.user.
5. Return success JSON with `rule_id`.

GET /api/rules/list
1. Parse query params `type`, `page`, `language`.
2. Build filters: `is_active=True`, optional `rule_type`, `language`, and `pages_to_display__contains=page`.
3. Return serialized rules sorted by `updated_at` DESC.

PUT /api/rules/update/{id}
1. Authenticate admin.
2. Validate payload and rule existence.
3. Update fields, increment `version`, set `updated_by`.
4. Return success.

DELETE /api/rules/delete/{id}
1. Authenticate admin.
2. Validate rule exists.
3. Set `is_active=False` and set `updated_by`.
4. Return success.

## 6. Permissions & Security
- Only admin users (or users with a `manage_rules` permission) can create, update, or delete rules.
- GET/list should be publicly readable in some contexts, but may require auth depending on product decisions. For now, allow authenticated users or public read by default.
- Ensure XSS-sanitization on `description` if HTML is allowed; otherwise restrict to plain text or safe-markdown.

## 7. Frontend Integration (dynamic display)
- Frontend calls `GET /api/rules/list?page={page}&language={lang}`.
- Backend returns only active rules for that page and language.
- Versioning: Frontend may display rule version for compliance if needed.

## 8. Acceptance Criteria / Tests
| # | Requirement | Pass condition |
|---|-------------|----------------|
|1|POST creates or updates rule|Returns success and `rule_id`; DB has correct values|
|2|GET returns filtered rules|Filters by page, type, language and shows only `is_active` rules|
|3|PUT updates rule and increments version|`version` increased and `updated_at` changed|
|4|DELETE sets is_active=false|Rule no longer returned by GET|
|5|Validation enforced|Invalid inputs return 400 with field errors|
|6|Auth enforced|Only admins can create/update/delete (401/403 otherwise)|

Tests to add
- test_create_rule_success
- test_create_rule_validation_errors
- test_upsert_update_by_post_with_id
- test_get_rules_filters_by_page_type_language
- test_put_update_increments_version
- test_delete_soft_deactivates
- test_admin_only_create_update_delete

## 9. Implementation hints (Django + DRF)
- Model: `Rule` in `organization/models.py` with `JSONField` for `pages_to_display` and `version` integer.
- Serializer: `RuleSerializer` in `organization/serializers.py` with `validate_*` methods and `create()`/`update()` that manage `version` and audit fields.
- Views: Prefer DRF `APIView` or `GenericAPIView` with explicit methods, or a `ViewSet` with custom actions:
  - `create` action for POST upsert,
  - `list` action for GET,
  - `update` for PUT,
  - `destroy` for DELETE (soft-delete override).
- Routes: add routes in `organization/urls.py` under `/api/rules/`.
- Permissions: use `IsAuthenticated` plus `IsAdminUser` or custom permission.

## 10. Dev commands
Run migrations:
```powershell
python manage.py makemigrations organization
python manage.py migrate
```

Run tests for rules (example):
```powershell
python manage.py test organization.tests.RuleTests
```

## 11. Next steps I can take
If you want, I can implement this feature now. I will:
- Add the `Rule` model + migration,
- Implement serializer and validations,
- Implement the views and route registrations,
- Add tests and run them.

Tell me to proceed and I'll start with the model (I will update the todo list status to `in-progress` as I work).