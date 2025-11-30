HR Frontend — Pages, Endpoints, Actions, Payloads & Styling
=========================================================

This document describes the frontend pages for the `hr` app, the API endpoints they use, example request/response payloads, expected UI actions and validation, and styling/design guidance. The frontend is intended to be implemented in React (existing repo uses React + React-Bootstrap), but the document is framework-agnostic.

Assumptions
- Backend base path for HR API: `/api/hr/` (registered in `hr/urls.py`).
- Authentication: all endpoints require authentication (JWT or session). Use existing auth flows.

Pages (overview)
- Employees List — searchable table of employees with quick actions (view, edit, add, deactivate).
- Employee Profile — detailed view with tabs: Info, Salary, Commissions, Documents, Attendance, Movements, Punctuality.
- Add / Edit Employee — form for onboarding.
- Attendance Page — daily view with quick check-in/check-out controls and calendar.
- Movement Logs Page — list, start movement, end movement (modal or inline).
- Commissions Page — list and filters, mark as paid, export CSV.

1) Employees List
------------------
Purpose
- Browse employees, quick search and filter, bulk/export, and add employee.

UI Elements
- Header with page title, "Add Employee" button, and global search box.
- Filters: role dropdown, branch (if applicable), active toggle.
- Table columns: `ID`, `Name`, `Role`, `Salary`, `Status`, `Last Updated`, `Actions`.
- Actions per row: View (open profile), Edit (open form), Deactivate/Activate, Quick Pay/Commission link.

Endpoints & actions
- GET `/api/hr/employees/` — list employees (supports `?search=` and pagination).
  - Query params: `search`, `page`.
  - Response: list of employee objects.

- POST `/api/hr/employees/` — create employee.
  - Request payload example:
    {
      "first_name": "Aisha",
      "last_name": "Khan",
      "role": "Sales",
      "joining_date": "2025-11-01",
      "salary": "50000.00",
      "currency": "PKR",
      "is_active": true
    }
  - Validation: `first_name` required. `joining_date` optional.

- GET `/api/hr/employees/{id}/` — read employee.
- PUT `/api/hr/employees/{id}/` — update employee.
- DELETE `/api/hr/employees/{id}/` — delete employee (soft-delete can be implemented later via `is_active` flag).

UX details
- Inline confirmation for deactivate.
- Paginated table with page-size selector and CSV export.

2) Employee Profile
-------------------
Purpose
- Single-page profile with tabs for all HR related information.

Tabs
- Info: editable contact and identity fields (first/last name, role, joining date, user link).
- Salary: current salary summary and `SalaryHistory` table with create salary-change modal.
- Commissions: list of commissions associated with this employee and status filter.
- Documents: file list and upload button (store in existing media endpoints).
- Attendance: calendar + list of attendance for the employee. Each day row shows check-in/checkout and working hours.
- Movements: list + button to start a movement (modal) and ability to end movement inline.
- Punctuality: list of punctuality records (late / early leave / absence), ability to create a record.

Endpoints used by Profile
- GET `/api/hr/employees/{id}/` — base employee data.
- GET `/api/hr/salary-history/?employee={id}` — salary history list.
- POST `/api/hr/salary-history/` — create salary change (payload: employee, previous_salary, new_salary, reason).
- GET `/api/hr/commissions/?employee={id}` — commission list for employee.
- GET `/api/hr/attendance/?employee={id}` — attendance list (supports `?date=` filter).
- POST `/api/hr/attendance/check_in/` — check-in for employee (see Attendance API below).
- POST `/api/hr/attendance/check_out/` — check-out for employee.
- GET `/api/hr/movements/?employee={id}` — movement logs for employee.
- POST `/api/hr/movements/start/` — start a movement (see below).
- POST `/api/hr/movements/{id}/end/` — end movement.

Profile UI actions (examples)
- Add Salary Change (modal) — fields: previous salary (readonly if read from model), new salary, reason. Submit calls POST `/api/hr/salary-history/`.
- Add Commission (admin-only) — create commission record referencing booking id.
- Check-in/Check-out Buttons — visible when viewing today's row in Attendance tab. Clicking triggers the corresponding endpoint and updates the row in-place.
- Start Movement — opens a small modal: reason, optional start_time. Submit triggers POST `/api/hr/movements/start/` and adds a row to Movements table.
- End Movement — the Movements table row has an "End" button (if `end_time` is null). Clicking calls POST `/api/hr/movements/{id}/end/`.

3) Attendance Page
------------------
Purpose
- Global attendance management and daily check-in/out control.

UI Elements
- Date picker (defaults to today).
- Employee selector or filtered list for branch/role.
- Table: Employee, Check-in time, Check-out time, Working hours, Status, Actions.
- Actions: Check In (if missing), Check Out (if check_in present), Edit (open form to fix times), Mark Absent.

Endpoints
- POST `/api/hr/attendance/check_in/`
  - Payload example: `{ "employee": 12, "time": "2025-11-25T09:00:00Z" }` (time optional; server uses current time if omitted).
  - Successful Response: attendance object

- POST `/api/hr/attendance/check_out/`
  - Payload example: `{ "employee": 12, "time": "2025-11-25T18:00:00Z" }`
  - Backend computes `working_hours` and may set `status` to `half_day` if hours < 4.

- GET `/api/hr/attendance/?date=2025-11-25` — fetch records for date.

Client-side validations
- Prevent check-out without a check-in for that day (UI should grey out the button or ask for confirmation to create a check-in automatically).
- Show friendly messages for timezone differences; use ISO8601 strings when sending times.

4) Movement Logs Page
---------------------
Purpose
- Track when employees leave the office temporarily.

UI Elements
- Table of movement logs with columns: `ID`, `Employee`, `Start Time`, `End Time`, `Duration`, `Reason`, `Actions`.
- Actions: Start (global modal), End (per-row), Edit, Export.

Endpoints
- POST `/api/hr/movements/start/` — payload `{ "employee": <id>, "start_time": "ISO8601", "reason": "string" }`
  - Response: movement object with `id` and `start_time`.

- POST `/api/hr/movements/{id}/end/` — payload `{ "end_time": "ISO8601" }` (optional)
  - Response: movement object with `end_time` and computed duration.

UX details
- Start movement via a modal or inline quick action. After start, show a small toast confirming start time.
- To end movement, present a confirmation modal with computed duration and an optional note field.

5) Commissions Page
-------------------
Purpose
- Review unpaid/paid commissions, export, and mark commissions as paid during payroll.

UI Elements
- Filters: employee, date-range, status (unpaid/paid), booking id.
- Table: `ID`, `Employee`, `Booking ID`, `Amount`, `Date`, `Status`, `Actions`.
- Actions: Mark as Paid (modal to confirm and optionally attach payment reference), Export CSV.

Endpoints & actions
- GET `/api/hr/commissions/` — list with filters `?employee=&status=`.
- GET `/api/hr/commissions/unpaid-by-employee/?employee=<id>` — quick unpaid list used in employee profile.
- POST `/api/hr/commissions/` — create commission record.
- PATCH `/api/hr/commissions/{id}/` — update status to `paid` with `status: "paid"` and optional payment reference.

6) Add / Edit Employee Form
---------------------------
Fields
- first_name (required)
- last_name
- role (select)
- joining_date (date)
- salary (number)
- currency (select)
- user (link to existing user account) — optional
- documents (upload area)

Validations
- `first_name` required.
- `salary` must be numeric if present.
- `joining_date` format YYYY-MM-DD.

Endpoints
- POST `/api/hr/employees/` — create (see example above)
- PUT `/api/hr/employees/{id}/` — update

7) Punctuality Management (Admin)
---------------------------------
Purpose
- Manually add late/early leave/absence records for audit and reports.

Endpoints
- GET `/api/hr/punctuality/?employee=<id>`
- POST `/api/hr/punctuality/` — payload example:
  {
    "employee": 1,
    "date": "2025-11-15",
    "record_type": "late",
    "minutes": 15,
    "notes": "Traffic"
  }

Design & Styling Guidance
------------------------
Design System
- Use existing React-Bootstrap components for consistency with the app:
  - `Container`, `Row`, `Col`, `Card`, `Table`, `Button`, `Modal`, `Form`, `Badge`.
- Color palette: reuse the app's primary/secondary colors. Provide special badges for statuses:
  - `badge-success` for `present`/`paid`, `badge-warning` for `late`/`unpaid`, `badge-danger` for `absent`.

Layout
- Desktop: two-column layout for Employee Profile — left column (30%) summary card, right column (70%) tabs/content.
- Mobile: stacked layout; tabs become an accordion.

Components & Patterns
- Table component: paginated, with server-side sorting and filtering. Keep columns compact and allow column chooser.
- Modal forms: use small modals for quick actions (check-in/out confirmation, movement start/end, mark commission paid). Larger forms (employee onboarding) use a full-page form.
- Inline editing: allow quick inline edits for small fields (salary, role) with inline save icon.
- Toast notifications: use for success/failure of actions.

Accessibility
- All action buttons must have aria-labels (e.g., `aria-label="Check in Aisha Khan"`).
- Keyboard accessible modals and forms.

Validation UX
- Show inline errors under each field.
- For time fields, accept and display ISO-8601 and local formatted times, but always send ISO-8601 in requests.

Example React component map
- `EmployeesPage` — `EmployeesList` (table), `EmployeeFilters`, `AddEmployeeModal`.
- `EmployeeProfile` — `ProfileHeader`, `Tabs` (InfoTab, SalaryTab, CommissionsTab, DocumentsTab, AttendanceTab, MovementTab, PunctualityTab).
- `AttendanceControls` — check-in/out buttons, day selector.
- `MovementModal` — start movement; `MovementRow` has End action.

API Client notes
- Reuse existing axios instance with auth headers.
- For endpoints that accept/return datetimes, ensure serialization uses `new Date().toISOString()` on the client.

Integration & Developer Notes
- Use the DRF schema (Swagger) `/api/schema/swagger-ui/` to copy exact request/response shapes (the HR endpoints include examples).
- For testing, use the provided test settings that disable unrelated migrations when running the HR-focused unit tests locally.

Deliverables
- A set of React pages and components mapped above.
- A small CSS module for HR custom spacing and overrides: `hr/styles/hr.css` with variables for badge colors and spacing.

Optional next steps
- Build the React skeleton pages and wire them to the endpoints.
- Implement client-side caching for employee lookups and optimistic UI updates for quick actions.

If you want, I can scaffold the React pages and example components next (I can generate the components and a tiny demo page wired to the existing API).  

Static Pages To Build (summary)
--------------------------------
The frontend should include a set of static pages (single-purpose React pages or static HTML prototypes) that cover the general HR module workflows. Below is the concise list of pages to create, what each contains, and how they should be implemented as static prototypes first and then wired to the API.

- Count & list: 8 pages (recommended minimum)
  - `Employees List` — searchable, paginated table with quick actions (View/Edit/Add/Export).
  - `Employee Profile` — two-column profile with tabs: Info, Salary, Commissions, Documents, Attendance, Movements, Punctuality.
  - `Add / Edit Employee` — full-page form (or modal) for employee onboarding and updates.
  - `Attendance Dashboard` — daily view with date picker, per-employee check-in/out controls and bulk actions.
  - `Movement Logs` — list of movements with Start (modal/inline) and End actions, filters and export.
  - `Commissions` (Payments) — list, filters, mark-as-paid modal, export CSV (covers payment flows for commissions).
  - `Punctuality Management` — create and list late/early/absence records for audit.
  - `HR Overview / Dashboard` (optional) — summary KPIs (headcount, present today, unpaid commissions) and quick links.

- What each static page should include (short):
  - Header with page title and primary actions (Add / Export / Filters).
  - Search/filters area and a main content region (table or cards) showing sample data rows.
  - Inline action buttons for the most common flows (View, Edit, Check-in, Start/End Movement, Mark Paid).
  - Small modals for confirmation and lightweight forms used by quick actions (these can be static JS-driven modals in the prototype).

- How to build them as static prototypes first (recommended workflow):
  1. Create plain HTML/CSS prototypes (like the existing `hr/wireframe/` files) for each page so stakeholders can review layout and flows.
  2. Add a small JS helper (`wireframe.js`) to open modals and simulate actions; no data persistence required.
  3. Provide JSON fixtures (static `.json` files) to populate tables in prototypes for a more realistic preview.
  4. Once approved, scaffold React pages/components (one page per route) and hook them to the live API endpoints described earlier in this doc.

- Implementation notes for React
  - Page layout: use React-Bootstrap `Container` + `Row/Col`. Keep `Employee Profile` as 30% summary / 70% tabs layout.
  - Components: `EmployeesList`, `EmployeeForm`, `AttendancePage`, `MovementsPage`, `CommissionsPage`, `PunctualityPage`, `Dashboard`.
  - Shared widgets: `Filters`, `Table`, `ModalForm`, `Toast` (notifications), `DatePicker`.
  - Wire to API endpoints listed in this doc. For quick actions (check-in/check-out/start/end/mark-paid), use endpoint actions (`/check_in/`, `/check_out/`, `/movements/start/`, `/movements/{id}/end/`, `/commissions/{id}/` PATCH) so client code stays thin.

- Testing & developer convenience
  - Use the provided static wireframes for UI review. Keep them under `hr/wireframe/` and include `README.md` for how to preview locally.
  - For feature development, run focused HR tests with the `configuration.test_settings_no_migrations` settings when migrations from other apps interfere with local SQLite test runs.

If you'd like, I can now scaffold the React page skeletons (routes + placeholder components) and wire them to the HR API (or generate JSON fixtures and convert the static prototypes into a single navigable demo). Tell me which you'd prefer next and I'll proceed.
