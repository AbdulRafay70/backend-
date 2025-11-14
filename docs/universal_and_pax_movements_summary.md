# Universal API & Pax Movements — Combined Implementation Summary

This document combines the implementation summaries for the Universal Registration API, Registration Rules API, and Pax Movements API, as implemented in this project.

---

## Universal API — Implementation Summary

See: `docs/universal_summary.md`

- Unified registration for Organizations, Branches, Agents, Employees
- Atomic prefixed ID generation (ORG-, BRN-, AGT-, EMP-)
- Parent-child validation, field inheritance
- Audit logs for create/update/delete
- Cascade soft-deactivation
- Notifications on creation
- DRF endpoints for register/list/detail/update/delete
- Signals for audit logging and notifications
- Tests for creation chain, cascade deactivation, validation
- OpenAPI spec in `My API (2).yaml`
- **As of 2025-10-28:** PaxMovement is auto-created/updated on both booking creation and payment (paid checkpoint), fully matching the Intimation API flow and client requirements.

---

## Pax Movements & Registration Rules API — Implementation Summary

See: `docs/pax_movements_summary.md`

- PaxMovement model tracks passenger entry/exit, flight updates, status
- Endpoints for CRUD, status, summary, verify exit, notify agent
- Admin registration with list/search/filter
- Tests for CRUD, status, summary, verify exit, notify agent
- **Integration:** PaxMovement is auto-created on booking creation and payment
- RegistrationRule model and endpoints for dynamic requirements/benefits
- OpenAPI spec in `My API (2).yaml`

---

## How to run tests

```powershell
python manage.py test universal
```

---

For full details, see the individual summary files in `docs/`:
- `universal_summary.md`
- `pax_movements_summary.md`
