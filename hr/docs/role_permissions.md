# Role & Permission Design — HR Module

This document specifies the design for the Role & Permission system requested by the client. It covers data models, API contracts, UI flows, and enforcement rules (super-admin / admin-org behavior).

Goals
- Provide fine-grained permissions by API/page and write actions (CAN VIEW, CAN EDIT, CAN DELETE, CAN CREATE).
- Support Group Types: AGENCY, AREA_AGENCY, EMPLOYEE, BRANCH, ADMIN_ORG, SUPER_ADMIN.
- Super-admins automatically have all orgs/branches and all writes.
- Admin(Org) auto-assigned all branches of their Org and has Admin & Agent rights for their Org's modules.
- Provide UI flows for Group creation (auto-show permission assignment), permission assignment, and user creation (username auto-derived from email).

Glossary
- Group: logical set of users with a Group Type and assigned permissions and org/branch scope.
- Permission: a specific API/page identifier (e.g., `inventory.items`, `bookings.create`) paired with a label and module.
- GroupPermission: mapping between a Group and a Permission with action flags: `can_view`, `can_edit`, `can_delete`, `can_create`.
- Org: Organization entity (existing `organization` app).
- Branch: Branch entity tied to an Org.

Data model (Django sketch)

- Group (hr.models.Group)
  - id (PK)
  - name (str)
  - type (choices: AGENCY, AREA_AGENCY, EMPLOYEE, BRANCH, ADMIN_ORG, SUPER_ADMIN)
  - extended (JSONField) — metadata (e.g., agent area codes)
  - organization (FK to Organization, null=True) — optional primary org for the group
  - created_at, updated_at

- Permission (hr.models.Permission)
  - id, codename (unique string), label (human name), module (e.g., 'inventory', 'bookings', 'payments'), api_path (string) — optional
  - description

- GroupPermission (hr.models.GroupPermission)
  - id
  - group (FK -> Group)
  - permission (FK -> Permission)
  - can_view (bool)
  - can_create (bool)
  - can_edit (bool)
  - can_delete (bool)
  - extra (JSONField) — optional extras like limits

- GroupBranch (hr.models.GroupBranch)
  - id
  - group (FK -> Group)
  - branch (FK -> Branch)

High-level rules and behaviors

1. Single Group Type selection
- UI enforces one and only one type per group.

2. Super-Admin
- Groups with type SUPER_ADMIN get implicit full access: when evaluating permissions, short-circuit to allow everything across all orgs and branches.
- No manual assignment required, but system may still list permissions for visibility.

3. Admin(Org)
- Groups of type ADMIN_ORG are associated to a single Org and automatically assigned all branches of that Org. They see Admin Panel pages plus Agent Panel rights (as determined by configuration).

4. Agent/Area-Agent
- Groups AGENCY or AREA_AGENCY only show Agent Panel permissions in the UI. Inventory permissions for these groups are limited to `CAN VIEW` when assigned.
- They can have `CAN_CREATE` on Payments/Ledgers if admin allows.
- Special permission `payments.process_public_booking_paid` may be assigned to AREA_AGENT and EMPLOYEE groups to process public-paid bookings and earn commissions.

5. Branch groups
- Branch type groups can be assigned a set of branches (one or many). Permission enforcement must restrict access to APIs for resources scoped to those branches/orgs.

6. Employee groups
- Employee groups can combine Agency and Admin writes for modules allowed to their Org.

Permission evaluation helper (server)
- Implement a helper `hr.permissions.has_permission(user, codename, action, scope)` that:
  - If user is part of any SUPER_ADMIN group return True.
  - If user belongs to ADMIN_ORG group and requested org matches, allow as per flags.
  - For regular groups, check `GroupPermission` entries for `codename` and `action` flag.
  - If multiple groups apply, union of rights applies (OR across groups).

API contract (examples)

1) List available permissions
GET `/api/hr/permissions/`
Response: [{ "id":1, "codename":"inventory.items", "label":"Inventory: Items", "module":"inventory" }, ...]

2) Create group
POST `/api/hr/groups/`
Payload example:
{
  "name": "Area Agents - Lahore",
  "type": "AREA_AGENCY",
  "organization": 5,
  "extended": { "area_code": "LAH01" }
}
Response: created Group object

Behavior: UI must automatically open the Assign Permissions UI after successful creation.

3) Assign permissions to group
POST `/api/hr/groups/{group_id}/permissions/`
Payload example:
{
  "permissions": [
    {"codename": "bookings.create", "can_create": true, "can_view": true},
    {"codename": "inventory.items", "can_view": true}
  ]
}
Response: updated list of GroupPermission entries

4) Get group permissions
GET `/api/hr/groups/{group_id}/permissions/`
Response: list of permissions with flags and optional branch scope

User creation / UX rules
- Frontend removes `username` field on user create; backend derives `username` = `email`.
- Selecting User Type auto-loads groups of that type:
  - AGENCY: show Agency selector (text / dropdown)
  - AREA-AGENCY: show list limited to that branch's area agencies
  - BRANCH: multiple branches selector (only branches of chosen org)
  - ADMIN(ORG): nothing to select (admin auto has this group's branch coverage)
  - SUPER-ADMIN: nothing to select
  - EMPLOYEE: select a single employee from employee list

Frontend flows (RoleAndPermission.jsx)
- When "Add Group" is clicked, show form with Name + Group Type selector (single-select). After creating the group (POST), automatically open the Assign Permissions UI.
- Assign Permissions UI
  - Left: hierarchical list of modules/pages (Admin Panel & Agent Panel). Right: permission grid per selected module/API with checkboxes: CAN VIEW, CAN EDIT, CAN DELETE, CAN CREATE.
  - For Agent group types, only show Agent Panel modules. Disable `CAN_CREATE` for inventory entries if config forbids it (show tooltip).
  - For Admin(Org) groups, auto-populate branch list with all branches of the selected organization (readonly in the UI).

Special features
- Super-Admin UX: in UI, when a group is SUPER_ADMIN, show an informative badge "Full access — no assignment required" and disable the assignment form or show read-only permissions.
- Admin(Org) UX: show assigned org and list all branches as selected and read-only.

Backend enforcement & middleware
- Add a permission evaluator used by DRF permission classes: e.g., `HasGroupPermission(codename, action)` that checks helper described above.
- Use that in critical endpoints: inventory, bookings, payments, commissions. For endpoints that require branch/org scoping, ensure the permission check receives the target org/branch.

Migrations & Backfill
- Write migrations to add Permission entries for modules used in the system.
- Backfill: optionally create default GroupPermission entries for existing groups (if mapping exists). Provide a script to do a dry-run.

Testing
- Unit tests for group creation, permission assignment, permission check helper, and sample DRF view permission enforcement.

Acceptance criteria
- Creating a group auto-opens permission assignment UI.
- Super-Admin groups have implicit global write rights.
- Admin(Org) groups have auto assigned branches and can be granted Admin+Agent panel rights for their org.
- Frontend user creation uses email as username and auto-loads groups by selected User Type.

Next actions (implementation order)
1. Finalize this doc with your feedback.
2. Add Django models and migrations for Group/Permission/GroupPermission/GroupBranch.
3. Add serializers & viewsets for the Group and Permission endpoints.
4. Implement server-side permission evaluator and DRF permission class.
5. Implement frontend UI changes (Group create flow and Assign Permissions UI).
6. Backfill permissions and write tests.

Notes
- I recommend fine-grained API/page-level permissions (this doc) since it's future-proof and maps cleanly to the client's requirement for per-page CAN VIEW/EDIT/DELETE/CREATE rights.
- Implementation will be incremental; I'd deliver the backend models + APIs first, then the frontend UI.


Prepared by: Assistant
Date: 2025-12-02
