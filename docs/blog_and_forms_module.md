# Saer.pk Blog Builder & Form System — Design & Implementation Guide

This document describes a recommended, modular backend for Blogs and dynamic Lead Forms that integrates with the existing Leads API. It contains data models, API contracts, admin behavior, testing strategy, migration notes, and an implementation roadmap.

---

## 1 — Overview & Goals

Goal: Provide a modular Django backend to manage blogs, blog sections, comments, likes and dynamic lead forms that can be linked to blogs or served as standalone pages. Form submissions must be forwarded to the existing Leads API (no duplicate leads DB), support admin control, and be testable.

Success criteria:
- Admin can CRUD Blogs, Sections, Forms.
- Public API for listing & viewing blog content (sections rendered as JSON for the front-end page builder).
- Commenting and likes support (nested comments up to depth 3, like toggling by user/session).
- Admin-definable forms that forward submissions to the Leads endpoint with traceability.
- Tests and docs included.

---

## 2 — Data Models (Django)

Use Django 4.x models. Use `JSONField` for flexible, schema-defined data (sections, media, form fields) and `RichTextField` for content where appropriate.

Models (summary):

1) Blog
- app: `blogs` or `content`
- fields:
  - id: AutoField (PK)
  - title: CharField(max_length=255)
  - slug: SlugField(unique=True, blank=True)
  - short_description: TextField(blank=True)
  - cover_image: URLField / ImageField (use whichever is standard in project)
  - author: FK to `auth.User` (nullable if anonymous authors allowed)
  - status: CharField(choices=('draft','published','archived'), default='draft')
  - tags: JSONField(default=list, blank=True)  # or ArrayField if Postgres
  - hashtags: JSONField(default=list, blank=True)
  - meta_title, meta_description, meta_keywords: TextField(blank=True)
  - published_at: DateTimeField(null=True, blank=True)
  - created_at/updated_at: DateTime fields
  - extra: JSONField(blank=True, default=dict)
- behavior:
  - auto-generate slug from title if blank (on save)
  - set published_at when status becomes `published` and published_at is empty
  - relationship: blog.sections (see BlogSection)

2) BlogSection
- fields:
  - id, blog FK
  - title, sub_title
  - content: TextField (HTML) or a RichTextField
  - style: JSONField to hold background_color, font_color, font_family, font_size, divider_color etc.
  - media: JSONField (list of dicts with type/url/alt)
  - order_index: IntegerField
  - created_at/updated_at
- behavior:
  - order maintained by `order_index` (default integer sequence)
  - serializers should return ordered list of sections for the blog

3) BlogComment
- fields:
  - id, blog FK
  - user FK (optional, allow anonymous: store name/email instead)
  - name, email (nullable)
  - comment: TextField
  - parent_comment FK to self (nullable)
  - depth: IntegerField (computed, max 3)
  - created_at
- behavior:
  - on create, compute depth = parent.depth + 1; reject if depth > 3
  - store `path` or `thread` optional field for efficient tree reads if desired (e.g., materialized path)

4) BlogLike
- fields:
  - id, blog FK
  - user FK (nullable)  # if user-less, store session_id (CharField) to identify unique viewer
  - session_id: CharField(blank=True, null=True)
  - is_liked: BooleanField(default=True)
  - created_at
- behavior:
  - toggle endpoint toggles record for (user or session_id)
  - ensure unique constraint for (blog, user) or (blog, session_id) to avoid duplicates

5) Form (LeadForm)
- fields:
  - id, form_unique_id: CharField(UUID)/UUIDField (unique)
  - form_title: CharField
  - linked_blog: FK Blog (nullable)
  - is_linked_with_blog: Boolean
  - form_page_url: SlugField (auto)  # public page when standalone
  - fields: JSONField (structure: list of {name, type, label, required, validations})
  - buttons: JSONField
  - notes: JSONField
  - display_position: CharField(choices=['end_of_blog','sidebar','popup','standalone'])
  - status: CharField(choices=['active','inactive'])
  - created_at/updated_at
- behavior:
  - on create, generate `form_unique_id` (uuid4) and if standalone, generate `form_page_url` slug

6) FormSubmission
- fields:
  - id
  - form FK or form_unique_id
  - payload: JSONField
  - forwarded: BooleanField (if forwarded to Leads API)
  - forwarded_at: DateTime
  - forwarded_response: JSONField (store Leads API response; careful with PII)
  - created_at
- behavior:
  - upon submission, validate fields per form definition, store submission, then forward to Leads API. Mark forwarded true/false and stash response.

Indexes/Constraints:
- UniqueConstraint(blog, slug)
- UniqueConstraint(BlogLike: blog + user OR blog + session_id)
- Consider indexes on published_at, status, tags (if Postgres GIN for JSON/Array)

---

## 3 — APIs & ViewSets (DRF)

Principles:
- Admin-only create/update/delete operations.
- Public read endpoints for blog listing and detail.
- Authenticated (or optionally anonymous) comments and likes.
- Forms: admin create/list; public fetch by `form_unique_id` and submit.

Endpoints (examples):

- Blogs
  - POST /api/blogs/create/  (admin)
  - PUT /api/blogs/<id>/update/ (admin)
  - GET /api/blogs/  (list; filters: status, tag, author; pagination)
  - GET /api/blogs/<slug_or_id>/  (detail; includes ordered sections, comments tree, like count, forms linked)
  - POST /api/blogs/<id>/page-editor/ (admin: save design data)

- Sections (optionally nested under blog)
  - CRUD can be handled inline via nested serializers or separate endpoints: /api/blogs/<id>/sections/

- Comments
  - POST /api/blogs/<id>/comments/add/  (body: comment, parent_id optional, name/email if anon)
  - GET /api/blogs/<id>/comments/  (returns nested tree up to depth 3)

- Likes
  - POST /api/blogs/<id>/like/  (body: session_id or user present) -> toggles like

- Forms
  - POST /api/forms/create/  (admin)
  - GET /api/forms/  (admin)
  - GET /api/forms/<form_unique_id>/  (public data to render form)
  - PUT /api/forms/<id>/update/  (admin)
  - DELETE /api/forms/<id>/delete/  (admin)
  - POST /api/forms/<form_unique_id>/submit/  (public submission endpoint)  → forwards to Leads API

Implementation notes for endpoints:
- Use DRF ModelViewSet for admin endpoints; use ReadOnlyModelViewSet for public reads.
- For comments: implement a custom create method that enforces depth <= 3.
- For likes: implement toggle logic in a single endpoint.
- For blog detail: include `forms` that are linked with `is_linked_with_blog=True`.

---

## 4 — Serialization & Validation

- Use nested serializers for Blog -> Section (read). For create/update, accept `sections` as an ordered array.
- For `fields` JSON in forms, implement a JSON schema-like validation helper that ensures each field has `name`, `type`, and required flags.
- For comments: validate presence of `comment` and name/email depending on authentication.
- For submissions: validate required fields according to the form definition, normalize phone numbers if necessary, and then transform the payload into the Leads API payload.

Example mapping to Leads API payload:
```
{
  "lead_source": "form",
  "form_id": 14,
  "form_title": "Umrah Leads Form",
  "blog_id": 12,
  "name": "Ali Khan",
  "contact": "03001234567",
  "message": "Interested in Umrah Package",
  "status": "new"
}
```
Store forwarded response in `FormSubmission.forwarded_response` for traceability.

---

## 5 — Signals & Admin Automation

- Blog `post_save` signal:
  - If slug empty, generate from title and enforce uniqueness.
  - When `status` moves to `published` and `published_at` is empty → set published_at to now.

- Form `post_save`:
  - If not linked and `form_page_url` empty → generate slug (ex: `/forms/<slug>`).

- Admin UI:
  - Register `Blog` with inline `BlogSection` editing (TabularInline or StackedInline) with ordering by `order_index`.
  - `BlogComment`: moderation actions (approve/delete), filter by blog and user/email.
  - `LeadForm` admin for fields JSON editor (use a JSON widget); optionally a custom UI for field management.

---

## 6 — Leads API Integration

Requirements:
- Submissions must be forwarded to existing Leads endpoint.
- Do not duplicate Leads database; simply call the internal API or reuse server-side logic via function import (preferred over external HTTP call if same Django project).
- Add retry/backoff and DLQ (simple: store failure state and re-queue via a management command) for transient failures.
# Saer.pk Blog Builder & Form System — Design, How it Works, and Client Requirements

This document explains how the Blog & Dynamic Forms module works, how to create content and forms, how form forwarding to the Leads API works, and what the frontend/client must provide to integrate correctly.

It combines design decisions, implementation notes, operational procedures, and client-side contract details so your frontend and ops teams can integrate with confidence.

---

## Overview

The module provides:

- A content API for creating and displaying blog posts with ordered sections.
- Commenting and like/ toggle support for reader interactions.
- A dynamic Form builder (LeadForm) where admins define a `schema` (JSON). The frontend renders the form and submits payloads to the server.
- A reliable, asynchronous forwarding pipeline that sends submissions to your Leads API with retries and dead-letter marking; submission storage is persisted locally for audit.

Key principles:

- Keep API responses fast — forwarding is asynchronous.
- Do server-side validation of the submission payloads against the form definition.
- Provide traceability: every submission is stored and the forward result is recorded.

---

## High-level flow (submission lifecycle)

1. Client POSTs a JSON payload to the public form endpoint (e.g., POST /api/blog/forms/<slug>/submit/).
2. Server validates payload (optional JSON Schema) and stores a `FormSubmission` record.
3. A `post_save` signal enqueues a `FormSubmissionTask` (a small DB row that acts as the task/queue item). This is created inside `transaction.on_commit()` so it is only added when the DB transaction commits.
4. A background worker/process runs the `process_form_queue` management command (or Celery worker) which:
   - atomically locks/picks pending tasks that are due (by next_try_at),
   - calls `forward_submission_to_leads()` to send the data to the Leads API,
   - updates the `FormSubmission` (status, lead_ref, error_details) and the task record (attempts, status, next_try_at), applying exponential backoff.
5. If forwarding repeatedly fails, the task moves to `failed` after `max_attempts` and requires manual inspection.

This design decouples the user request from external network latencies and failures.

---

## Data model summary (what matters for integration)

- `LeadForm` (admin-defined): slug, name, `schema` (JSON describing fields), `form_settings`.
- `FormSubmission`: stores raw `payload` JSON plus metadata (submitter IP, user agent), `status` (received/forwarded/error), `lead_ref`, and `error_details`.
- `FormSubmissionTask`: DB-backed queue item: tracks `submission`, `attempts`, `max_attempts`, `next_try_at`, `locked`, `status` (pending/processing/done/failed), `last_error`.

Important: the DB queue allows simple deployment (no external broker), visibility in the admin, easy retries, and simple alerts.

---

## API contract & examples (frontend-facing)

Endpoints (common prefixes may vary; project registers `blog` under `api/blog/`):

- GET /api/blog/ — list public blogs (published only for public requests). Supports pagination, search and ordering.
- GET /api/blog/{pk or slug}/ — retrieve blog with ordered `sections`.
- POST /api/blog/{pk}/comments/ — create a comment (authenticated or supply author_name).
- POST /api/blog/{pk}/like/ — toggle like for authenticated user.

- GET /api/blog/forms/ — list forms (admin/staff view may include inactive forms).
- GET /api/blog/forms/{slug}/ — fetch form metadata and `schema` for rendering.
- POST /api/blog/forms/{slug}/submit/ — submit the form payload.

Sample submission request:

POST /api/blog/forms/contact-us/submit/

Headers:

- Content-Type: application/json
- (Optional) X-Trace-Id: <uuid> — helpful for correlating logs

Body (JSON):

{
  "name": "Ali Khan",
  "email": "ali@example.com",
  "phone": "+923001234567",
  "message": "Interested in Umrah package"
}

Immediate Response (201 Created):

{
  "id": 1234,
  "status": "received",
  "message": "Submission received and will be forwarded"
}

Notes:

- The forwarding to Leads API is asynchronous. The frontend should treat the 201 as confirmation of receipt, not delivery to Leads.
- If you require synchronous delivery, we can implement an optional blocking call but that introduces latency and failure surface to the client.

---

## What the client (frontend) must do / requirements

1. Render the form from `LeadForm.schema` or a custom API-supplied UI description.
   - The schema should include field `name`, `type`, `label`, `required`, and validation rules (e.g., regex, min/max length).

2. Validate inputs on the client and let the server re-validate. Always handle server-side validation errors (400) gracefully.

3. Provide a `User-Agent` header (automatically done by browsers). If your frontend uses a non-browser client, set an appropriate User-Agent.

4. Optionally include a client-generated `X-Trace-Id` header to correlate frontend logs and server logs. The server will include `trace_submission_id` in the forwarded payload for backend traceability.

5. Rate-limiting / anti-spam:
   - If the form is public, consider adding client-side reCAPTCHA or hidden-honeypot fields to reduce spam.
   - The backend also implements rate-limiting suggestions (Django throttling or reverse proxy limits).

6. Be ready to accept a simple success UX: the backend will handle retries; the user does not need to resubmit in the event of backend forwarding failures.

7. If the frontend sits behind a proxy, ensure X-Forwarded-For is passed and Django is configured to extract the real client IPs so `FormSubmission.submitter_ip` is accurate.

---

## Configuration & operational instructions

Settings to add or confirm in `settings.py`:

- `LEADS_API_URL` — full URL to the Leads API endpoint (required for forwarding to work).
- `LEADS_API_TIMEOUT` — HTTP timeout in seconds (default 10).

Database & migrations:

```powershell
cd "C:\Users\Abdul Rafay\Downloads\All\All"
python -m pip install -r requirements.txt
python manage.py makemigrations blog
python manage.py migrate
```

Queue processing (two options):

- Lightweight, DB-backed: schedule the management command periodically:

```powershell
python manage.py process_form_queue --limit 50
```

  - Schedule with cron, systemd timers, or Windows Task Scheduler. Running every 30s–1m is common for low-latency delivery.

- Celery-based (optional): implement `forward_submission_to_leads` as a Celery task and call it from the signal or schedule tasks for processing. Celery gives you concurrency and built-in retry semantics.

Logging & monitoring:

- Log task failures with `form_id` and sanitized payload.
- Track metrics: processed tasks, forwarding success rate, average task attempts, failed tasks count.
- Add an alert for sudden spikes in failed tasks.

---

## Internal forwarding behaviour and retry strategy

- Each attempt to forward to Leads API is recorded by the `FormSubmissionTask` row (`attempts` incremented).
- On failure, the command sets `next_try_at` using exponential backoff (e.g., 2^attempts minutes capped at 24 hours).
- After `max_attempts` the task is marked `failed` and will not be retried automatically. Admins should inspect and optionally requeue or fix.

Backoff policy example:

- Attempt 1 failure -> next_try_at = now + 2 minutes
- Attempt 2 failure -> now + 4 minutes
- ... capped at 24 hours

---

## Security and privacy considerations

- Validate payloads and sanitize stored text (avoid re-displaying raw HTML without sanitization).
- Keep PII handling and retention policies aligned with your privacy rules.
- Protect the forms endpoint with throttling and optional CAPTCHA for public forms.
- Secrets (LEADS API keys) must be kept in environment variables and not stored in source control.

---

## Testing guidance

- Unit tests:
  - Model behaviors (slug generation, publication state, comment depth enforcement).
  - Serializer validation for forms.

- Integration tests:
  - Use `requests-mock`/`responses` to simulate the Leads API and assert task processing updates `FormSubmission` and `FormSubmissionTask` appropriately.
  - Test DLQ: simulate repeated failures and assert `task.status == 'failed'` after max attempts.

- Running queue in tests:

```python
from django.core.management import call_command
call_command('process_form_queue', limit=5)
```

---

## Admin improvements & UX

- Add an admin dashboard for pending/failed `FormSubmissionTask` rows with filters by form, date and failure reason.
- Add quick actions to requeue a failed task or view the forwarded response in a safe, read-only pane.

---

## Quick commands & checklist

- Create migrations and migrate (once):

```powershell
python manage.py makemigrations blog
python manage.py migrate
```

- Run tests:

```powershell
python manage.py test
```

- Start a one-off worker run for immediate processing:

```powershell
python manage.py process_form_queue --limit 100
```

Checklist before deploying to production:

- [ ] `LEADS_API_URL` is configured and reachable from the server.
- [ ] A periodic job or worker is scheduled to run `process_form_queue`.
- [ ] Monitoring & alerting for failed tasks are in place.
- [ ] Rate-limiting or CAPTCHA is configured for public forms.

---

If you'd like, I can now:

- create the migration for `FormSubmissionTask` and apply it,
- add example cURL commands for creating a blog/form and for submitting a form (to include in this document), or
- scaffold tests for the forwarding behavior and run them.

Tell me which of these to do next and I will continue.

---

## Recent implementation & quick start (added in-code)

This project recently received several concrete implementations to make the Blog + Forms module deployable and testable. The following notes summarize the code-level changes and how to operate them.

- New fields saved on submissions:
  - `FormSubmission.forwarded_at` (DateTime) — when the submission was forwarded successfully.
  - `FormSubmission.forwarded_response` (JSON) — best-effort capture of the Leads API response.

- LeadForm enhancements:
  - `form_unique_id` (UUID) — assigned automatically, read-only.
  - `form_page_url` (SlugField) — auto-generated on save when blank, convenient for standalone form pages.

- Forwarding pipeline:
  - DB-backed queue: `FormSubmissionTask` model tracks pending/processing/done/failed tasks, attempts, and next_try_at.
  - Management command `process_form_queue` processes due tasks, applies exponential backoff on failure, and marks tasks `failed` after `max_attempts`.
  - `blog/tasks.py` contains `forward_submission_to_leads()` which performs the HTTP POST (or can be swapped to call an internal function), updates `FormSubmission` state, and writes logs.

- Enqueue behavior:
  - A `post_save` signal creates `FormSubmissionTask` inside `transaction.on_commit()` to avoid enqueuing for rolled-back transactions.
  - The public submit endpoint also ensures a task exists (useful in test environments and to guarantee immediate visibility in admin).

- Throttling & validation:
  - The public form submit endpoint is protected with DRF throttles: `AnonRateThrottle` and `UserRateThrottle`. Configure rates in `REST_FRAMEWORK.DEFAULT_THROTTLE_RATES`.
  - Payloads are validated against `LeadForm.schema` using `jsonschema` when available.

- Admin UX & automation:
  - `Blog` admin: inline `BlogSection` editing is enabled.
  - `BlogComment` admin: moderation actions (approve/mark private).
  - `LeadForm` admin: shows `form_unique_id` and `form_page_url` (read-only) and exposes `schema` for editing (textarea widget). Consider a richer JSON editor if desired.
  - `FormSubmissionTask` admin: list/filter by status, requeue action to reset attempts and reschedule processing.

- Tests added:
  - Unit/integration tests were added for forwarding success & failure, slug/publish logic, comment depth validation, like toggling, and DLQ behavior.

### Migrations & runbook

If you pulled changes that include the new fields and migrations, run:

```powershell
cd "C:\Users\Abdul Rafay\Downloads\All\All"
python -m pip install -r requirements.txt
python manage.py migrate
```

One-off processing (run periodically or via scheduler):

```powershell
python manage.py process_form_queue --limit 100
```

Schedule `process_form_queue` every 30s–1m for low-latency forwarding, or convert to Celery if you need higher throughput/concurrency.

### cURL examples

- Create a LeadForm (admin/staff API):

```bash
curl -X POST "https://your.api.example/api/blog/forms/" \
  -H "Authorization: Bearer <STAFF_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Contact Us", "slug": "contact-us", "schema": {"type":"object","properties":{"name":{"type":"string"},"phone":{"type":"string"}},"required":["name","phone"]}}'
```

- Submit a form (public endpoint):

```bash
curl -X POST "https://your.api.example/api/blog/forms/<form_pk>/submit/" \
  -H "Content-Type: application/json" \
  -d '{"name":"Ali Khan","phone":"03001234567","message":"Interested"}'
```

Immediate response will be 201 Created with JSON: {"id": <submission_id>, "status": "received"} — forwarding is asynchronous.

### Monitoring & metrics suggestions

- Logging: ensure logs for `blog.tasks` (info/warn/error) are aggregated. Log the `submission_id` and `form_id` when forwarding and on errors.
- Metrics: export counters for processed, succeeded, failed tasks and gauge for pending tasks. Example metrics:
  - `saer_form_tasks_processed_total`
  - `saer_form_tasks_failed_total`
  - `saer_form_tasks_pending`

### Security & privacy

- Do not store sensitive PII in `forwarded_response` long-term. Consider redaction or storing just correlation ids and status codes.
- Keep `LEADS_API_URL` and any auth keys in environment variables and out of source control.

---

If you want, I can also append a short admin quickstart (screenshots or admin URL paths), a backfill migration to populate `form_page_url` for existing forms, or add Prometheus metrics and an alerting playbook. Tell me which you'd like next.

---

## Implementation updates (recent)

Small follow-up notes about what was implemented in code:

- `FormSubmission` now includes `forwarded_at` (DateTime) and `forwarded_response` (JSON) to record when a submission was forwarded and what the remote API returned.
- The forwarder (`blog/tasks.py`) saves these fields and logs success/failure.
- A DB-backed queue model `FormSubmissionTask` was added and a management command `process_form_queue` processes tasks with exponential backoff on failure.
- The `LeadForm` submit endpoint ensures a task exists (signals also create a task inside `transaction.on_commit`).
- The submit endpoint is throttled with `AnonRateThrottle` and `UserRateThrottle` (configure rates via `REST_FRAMEWORK` in settings).
- Tests were added (`blog/tests/test_forwarding.py`) which mock the Leads API and exercise success/failure flows.

Run the migrations I added before deploying or running the tests locally:

```powershell
python manage.py makemigrations blog
python manage.py migrate
```

Note: I created migration files (`blog/migrations/0002_add_forwarding_fields.py` and `0003_create_formsubmissiontask.py`) so you can run `migrate` directly if you prefer to use these generated migrations.
