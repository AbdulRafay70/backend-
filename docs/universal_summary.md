## Universal API — Implementation Summary

This document summarizes the work done to implement the "Universal Registration" API and the automated tests that verify the core flows.

Date: 2025-10-28

### Goal

Provide a single unified registration API that supports Organizations, Branches, Agents, and Employees in one model with:
- Single-table registration with type differentiation
- Atomic prefixed ID generation per entity type (ORG-, BRN-, AGT-, EMP-)
- Parent-child validation and field inheritance (organization_id, branch_id)
- Audit logs for create/update/delete (JSON snapshot of previous/new data)
- Cascade soft-deactivation when a parent is deactivated
- Notifications on creation (best-effort, synchronous helper)

### What we implemented (high-level)

- App: `universal` added to `INSTALLED_APPS` and registered in project URLs at `api/universal/`.
- Models:
  - `UniversalRegistration`: single model storing organizations, branches, agents, employees. Key fields: `id` (char PK), `type`, `parent` (self-FK), `organization_id`, `branch_id`, `email` (unique), `status`, `is_active`, timestamps, and other contact fields.
  - `UniversalIDSequence`: DB-backed per-type counter used to generate concurrency-safe prefixed IDs.
  - `AuditLog`: records `create`, `update`, `delete` with `previous_data` and `new_data` JSON fields and `performed_by`.
- ID generator: `generate_prefixed_id(entity_type)` uses a transactional `select_for_update` increment on `UniversalIDSequence` to produce e.g. `ORG-0001`, `BRN-0001`, `AGT-0001`, `EMP-0001`.
- Serializers and validation:
  - Type-based required fields and parent-type constraints (e.g., a Branch must have an Organization parent).
  - Auto-inherit `organization_id` / `branch_id` from parent when applicable.
  - Email uniqueness validation.
- API endpoints (DRF views)
  - POST `/api/universal/register/` — create a record and return `{"message":..., "data": {...}}` (201).
  - GET `/api/universal/list/` — list registrations.
  - GET `/api/universal/{id}/` — retrieve a registration.
  - PUT `/api/universal/update/{id}/` — update.
  - DELETE `/api/universal/delete/{id}/` — soft-deactivate with cascade to descendants.
- Audit logging and signals:
  - Signals capture previous state and new state on create/update/delete and write `AuditLog` entries.
  - Datetime values are converted to ISO strings before storing in JSONField to avoid serialization errors.
- Cascade deactivation:
  - `UniversalRegistration.get_descendants()` and `deactivate_with_cascade()` implemented to set `is_active=False`, update `status`, and create audit entries for affected records.
- Notifications:
  - A `notify_new_registration` helper is called on create (synchronous best-effort). Recommended to move to async (Celery) in production.

### Files created/edited (one-line purpose)

- `universal/models.py` — core models: `UniversalRegistration`, `UniversalIDSequence`, `AuditLog`.
- `universal/utils.py` — `generate_prefixed_id` and prefix map.
- `universal/serializers.py` — DRF serializers with validation and inheritance logic.
- `universal/views.py` — DRF views for register/list/detail/update/delete.
- `universal/urls.py` — routing for the endpoints under `/api/universal/`.
- `universal/signals.py` — pre_save/post_save/pre_delete signals that write audit logs and call notifications.
- `universal/permissions.py` — placeholder permission checks (basic role stubs; integrate with real role model in production).
- `universal/notifications.py` — simple email helper for creation notifications.
- `universal/tests.py` — tests that cover create chain and cascade deactivation and invalid parent-type validation.
- `configuration/settings.py` — `universal` added to `INSTALLED_APPS`.
- `configuration/urls.py` — included `api/universal/` routes.
- `docs/universal_api.md` — (existing) API documentation (additional summary created here).
- `My API (2).yaml` — OpenAPI spec updated with the new endpoints and component schemas.

### Tests implemented

- A small test suite (in `universal/tests.py`) that covers:
  1. Happy-path creation chain: Organization → Branch → Agent → Employee, ensuring IDs are generated and organization/branch inheritance is correct.
  2. Cascade deactivation: deactivating an Organization cascades `is_active=False` to Branches/Agents/Employees.
  3. Validation error: creating a Branch with an invalid parent type is rejected.

Notes on tests:
- Tests create a superuser in `setUp()` and `force_authenticate` the test client when needed because basic permission checks were enabled.
- Tests run against Django's test database (SQLite memory by default during tests).

### How to run locally (PowerShell)

Open a PowerShell in the project root and activate your virtualenv, then run migrations and tests as follows:

```powershell
& "C:\Users\Abdul Rafay\Downloads\All\All\.venv\Scripts\Activate.ps1"
python manage.py makemigrations universal
python manage.py migrate
python manage.py test universal
```

If you want to run the whole test suite instead of only the `universal` tests:

```powershell
python manage.py test
```

### OpenAPI / Swagger

- The OpenAPI spec is updated in `My API (2).yaml` with paths for the new endpoints and the `UniversalRegistration` / `UniversalRegistrationInput` / `AuditLog` components. You can load that YAML in Swagger UI or a similar tool.

### Next steps / Recommendations

1. Convert notifications to asynchronous tasks (Celery, RQ, or background worker) to avoid blocking requests.
2. Expand tests:
   - Add pagination and list-filter tests for `/list/`.
   - Add concurrency stress tests for `generate_prefixed_id` to validate ID uniqueness under high concurrency.
   - Add permission matrix tests integrating with the project's role model (organization-admin, branch-manager).
3. Add metrics/monitoring for ID generator contention and audit log write rates.
4. Consider using DRF schema tools (drf-spectacular or drf-yasg) to auto-generate OpenAPI from views/serializers instead of hand-editing the YAML.

### Quick contact points (where to look in the repo)

- `universal/` — primary implementation (models, views, serializers, signals, tests).
- `My API (2).yaml` — API spec with examples for the registration payload.

### Completion summary


The universal registration feature, registration rules, and pax_movements (including all integration logic) were implemented, migrations were created and applied, and the `universal` tests were executed and passing after iterative fixes (notably fixing datetime JSON serialization in `AuditLog` and ensuring helper methods are on the correct models).

**As of 2025-10-28:**
- PaxMovement is now auto-created/updated on both booking creation and payment (paid checkpoint), fully matching the Intimation API flow and client requirements.
- All endpoints, admin, and tests are complete and up to date.

This document summarizes the implementation, tests, and next recommended items.

If you'd like, I can:
- Add this summary to the repository README or link it from `docs/` index.
- Add more test cases and CI integration steps (GitHub Actions) to run migrations + tests on PRs.

---

File created: `docs/universal_summary.md` — this file.
