## Saer.pk Blog Builder & Dynamic Forms — Design Document

Date: 2025-10-30

This document defines the data models, API contracts, admin UX, signals/integrations, tests, and a migration/rollout plan for a Blog Builder and Dynamic Form system integrated with the existing Leads pipeline.

Goals
- Provide a reusable blog system for marketing content with ordered rich sections and inline media.
- Provide dynamic forms (schema-driven) that can accept submissions and forward them into the existing Leads API with traceability.
- Keep the APIs simple and secure: public read for blog content, authenticated for user interactions (comments, likes), staff-only for create/update/delete.
- Keep implementation incremental with low-risk migrations and strong test coverage.

Models (ER-style)

1) Blog
- Table: `blog_blog`
- Fields:
  - id: AutoField (PK)
  - organization: ForeignKey(Organization, null=True, blank=True, on_delete=SET_NULL) — optional multi-tenant scope
  - title: CharField(max_length=255)
  - slug: SlugField(max_length=255, db_index=True) — unique per organization (UniqueConstraint)
  - summary: TextField(null=True, blank=True)
  - status: CharField(choices=[draft,published,archived], default='draft')
  - is_featured: BooleanField(default=False)
  - published_at: DateTimeField(null=True, blank=True)
  - author: ForeignKey(UserProfile or auth.User, null=True, blank=True, on_delete=SET_NULL)
  - cover_image: ImageField(null=True, blank=True)
  - reading_time_minutes: IntegerField(null=True, blank=True)
  - meta: JSONField(default=dict, blank=True) — SEO, custom attributes
  - created_at, updated_at: DateTimeFields (auto_now_add/auto_now)

Indexes & Constraints
- UniqueConstraint(['organization', 'slug'], name='uniq_org_slug')
- Index on (status, published_at)

2) BlogSection
- Table: `blog_blogsection`
- Purpose: Ordered content blocks for a Blog — supports text, markdown, CTA, image, gallery, embed, HTML.
- Fields:
  - id
  - blog: ForeignKey(Blog, related_name='sections', on_delete=CASCADE)
  - order: PositiveSmallIntegerField(default=0, db_index=True)
  - section_type: CharField(choices=[text, html, markdown, image, gallery, cta, embed], max_length=32)
  - content: JSONField() — shape depends on type. Examples below.
  - created_at, updated_at

Notes: Use `order` for ordering; admin will expose inline reordering. Keep section content flexible (JSON) to allow future additions without schema migrations.

Example section.content shapes
- text: {"body": "<p>...</p>"}
- image: {"url": "/media/..", "alt": "...", "caption": "..."}
- gallery: {"images": [{"url":..., "caption":...}, ...]}
- cta: {"text":"Book now","url":"/book?pkg=...","style":"primary"}

3) BlogComment
- Table: `blog_blogcomment`
- Fields:
  - id
  - blog: ForeignKey(Blog, related_name='comments', on_delete=CASCADE)
  - parent: ForeignKey('self', null=True, blank=True, on_delete=CASCADE)
  - author: ForeignKey(auth.User or UserProfile, null=True, blank=True, on_delete=SET_NULL)
  - author_name: CharField(max_length=150, null=True, blank=True) — for public comment fallback
  - body: TextField()
  - is_public: BooleanField(default=True)
  - created_at, updated_at

Business rule: nested replies allowed up to depth 3. Enforce in serializer and model clean() or signal.

4) BlogLike
- Table: `blog_bloglike`
- Fields:
  - id
  - blog: ForeignKey(Blog, related_name='likes', on_delete=CASCADE)
  - user: ForeignKey(auth.User, on_delete=CASCADE)
  - created_at

UniqueConstraint(['blog', 'user'], name='uniq_blog_user_like')

5) Form (dynamic)
- Table: `blog_form`
- Fields:
  - id
  - organization: FK optional
  - name: CharField(max_length=150)
  - slug: SlugField(db_index=True)
  - description: TextField(blank=True)
  - schema: JSONField() — JSON Schema (draft-07/2019) describing expected fields & validations
  - settings: JSONField(default=dict) — e.g., forward_to_leads: true, lead_type: "inquiry", require_captcha
  - active: BooleanField(default=True)
  - created_by, created_at, updated_at

JSON schema guidance: keep a thin wrapper around standard JSON Schema. Example:

```
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "full_name": {"type":"string", "minLength": 2},
    "email": {"type":"string", "format":"email"},
    "mobile": {"type":"string"}
  },
  "required": ["full_name","email"]
}
```

6) FormSubmission
- Table: `blog_formsubmission`
- Fields:
  - id
  - form: ForeignKey(Form, related_name='submissions', on_delete=CASCADE)
  - payload: JSONField() — raw submitted data
  - submitter_ip: GenericIPAddressField(null=True, blank=True)
  - user_agent: CharField(null=True, blank=True)
  - is_forwarded: BooleanField(default=False)
  - lead_ref: CharField(null=True, blank=True) — remote Leads API id if forwarded
  - status: CharField(choices=[received, forwarded, error], default='received')
  - error_details: JSONField(null=True, blank=True)
  - created_at

Optional helper: FormField model if you want to edit fields in admin as rows (label, type, key, order). Not required if you prefer direct JSON schema editing.

API Design (DRF)

Authentication notes
- Public endpoints: blog list/detail, form rendering (GET), form submission (POST) — submissions protected by rate limits and optional captcha.
- Authenticated endpoints: create comment, like/unlike, submit with user context
- Staff endpoints: blog create/update/delete, section CRUD, form CRUD, view submissions (download CSV)

Endpoints
- GET /api/blogs/ — public list with filters: ?status=published&organization=...&q=search — returns paginated list
- GET /api/blogs/{slug}/ — detail with sections and aggregated stats (comments_count, likes_count)
- POST /api/blogs/ — staff only — create blog (title, slug, summary, status)
- PATCH /api/blogs/{id}/ — staff only
- POST /api/blogs/{blog_id}/comments/ — authenticated — create comment (parent optional)
- GET /api/blogs/{blog_id}/comments/ — list comments (nested) — depth limited
- POST /api/blogs/{blog_id}/likes/ — toggle like (idempotent)

Forms
- GET /api/forms/{slug}/ — returns form schema & settings for client rendering
- POST /api/forms/{slug}/submit/ — accepts payload JSON; server validates against stored schema and returns 201 with trace id. If settings.forward_to_leads true, queue forward job.

Example: Submit

Request POST /api/forms/contact-us/submit/
Payload:
```
{ "full_name": "John Doe", "email": "john@example.com", "message": "Hi" }
```

Response 201
```
{ "id": 1234, "trace_id": "form-20251030-7f3a", "status": "received" }
```

Permissions & Rate-limiting
- Public form submit endpoints must be protected with per-IP rate limits and optional captcha. Use Django-Ratelimit or DRF throttling classes.
- Staff views use IsAdminUser or custom IsStaffOrReadOnly.

Admin UI
- Blog: admin.ModelAdmin with list_display: (title, author, status, published_at) and search_fields. Inline `BlogSection` with ordering support (use `SortableInlineAdminMixin` or drag-and-drop plugin). Bulk actions: publish/unpublish.
- Form: admin to edit JSON schema; preview button that renders a simple HTML form; link to export submissions CSV.

Signals & Integrations
- Slug auto-generation: pre_save signal when slug missing -> generate slug from title (slugify) with uniqueness per org.
- Publish timestamp: when status transitions to 'published' and published_at is null -> set published_at=now.
- FormSubmission forwarding: on create, schedule an async task (Celery/RQ) to POST payload to configured Leads API endpoint. Store `lead_ref` and mark `is_forwarded` and status accordingly. On error, retry with backoff and finally push to DLQ table or set status=error with error_details.
- SystemLog: create SystemLog entries for forwarded leads and final failures for observability.

Async worker considerations
- If the project already has Celery, add a `tasks.send_form_to_leads(submission_id)` task. If not, implement a simple database-backed queue and a management command `process_form_queue` to be run by supervisor or cron.

Validation
- Use `jsonschema` python library to validate `FormSubmission.payload` against `Form.schema`. Capture validation errors and return 400 with details to client.
- Also run server-side normalization (strip strings, optional phone number normalization) before forwarding.

Testing Strategy
- Unit tests:
  - Model tests: slug uniqueness, publish timestamp logic, nested comment depth enforcement.
  - Serializer tests: validate form schema acceptance and submission validation errors.
  - Like idempotency: toggling twice doesn't create duplicate rows.
- Integration tests:
  - FormSubmission → queue → mocked Leads API endpoint (requests-mock) verifies forwarding, retries, and error handling.
  - Admin form rendering and section inline ordering.

Migration plan
- Phase 1 (safe): Add models with tables and minimal indexes; no destructive changes. Deploy and run migrations.
- Phase 2: Wire admin & public read endpoints; deploy frontend/clients to use new endpoints.
- Phase 3: Add optional indices after observing traffic patterns (e.g., indexing slug+org if needed) and add more constraints.

Backfill & Data Hygiene
- If converting existing content into blog posts, provide scripts to import CSV/Markdown into `Blog` and `BlogSection` rows.
- Provide management command `find_orphan_blog_references` similar to the booking cleanup we created earlier.

Open Questions / Decisions
- Multi-tenancy: Should `organization` be required or optional? Recommendation: optional for now; make unique slug per org when org present.
- Form schema editing UX: raw JSON vs UI field editor. Start with raw JSON in admin (faster) and add a field editor later.
- Async backend: prefer Celery if already used in repo; otherwise a lightweight queued management command is acceptable.

Next concrete step (recommended)
- Implement the Django models and migrations (todo list item 2). I can scaffold the models and a first migration in the repo, then run `makemigrations`/`migrate` locally and add basic serializers and endpoints.

Appendix: Minimal model pseudocode

```
class Blog(models.Model):
    organization = models.ForeignKey(Organization, null=True, blank=True, on_delete=models.SET_NULL)
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    summary = models.TextField(blank=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='draft')
    published_at = models.DateTimeField(null=True, blank=True)

class BlogSection(models.Model):
    blog = models.ForeignKey(Blog, related_name='sections', on_delete=models.CASCADE)
    order = models.PositiveSmallIntegerField(default=0)
    section_type = models.CharField(...) 
    content = models.JSONField()

class BlogComment(models.Model):
    blog = models.ForeignKey(Blog, related_name='comments', on_delete=models.CASCADE)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE)
    body = models.TextField()

class Form(models.Model):
    name = models.CharField(max_length=150)
    slug = models.SlugField()
    schema = models.JSONField()

class FormSubmission(models.Model):
    form = models.ForeignKey(Form, related_name='submissions', on_delete=models.CASCADE)
    payload = models.JSONField()
    status = models.CharField(default='received')
    lead_ref = models.CharField(null=True, blank=True)
```

Contact / Ownership
- If you'd like I can now scaffold these models and add an initial migration (I recommend doing that next). Tell me if you want me to enforce `organization` on the models or keep it optional.
