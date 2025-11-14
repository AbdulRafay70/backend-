from django.contrib import admin
from . import models
from django.utils import timezone


class BlogSectionInline(admin.TabularInline):
    model = models.BlogSection
    extra = 0
    fields = ("order", "section_type", "content")


class BlogCommentInline(admin.TabularInline):
    model = models.BlogComment
    extra = 0
    fields = ("author", "author_name", "body", "is_public")


@admin.register(models.Blog)
class BlogAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "status", "published_at", "is_featured", "likes_count", "comments_count")
    search_fields = ("title", "summary")
    list_filter = ("status", "is_featured", "created_at")
    inlines = [BlogSectionInline, BlogCommentInline]
    prepopulated_fields = {"slug": ("title",)}
    actions = ["make_published", "make_draft"]

    def likes_count(self, obj):
        base = obj.likes.count() if hasattr(obj, 'likes') else 0
        try:
            anon = int((obj.meta or {}).get('anonymous_likes', 0) or 0)
        except Exception:
            anon = 0
        return base + anon
    likes_count.short_description = 'Likes'

    def comments_count(self, obj):
        try:
            # count all comments (public and private) to mirror likes_count behavior
            return obj.comments.count() if hasattr(obj, 'comments') else 0
        except Exception:
            return 0
    comments_count.short_description = 'Comments'

    def make_published(self, request, queryset):
        updated = queryset.update(status="published", published_at=timezone.now())
        self.message_user(request, f"{updated} post(s) marked as published.")

    make_published.short_description = "Mark selected posts as published"

    def make_draft(self, request, queryset):
        updated = queryset.update(status="draft")
        self.message_user(request, f"{updated} post(s) marked as draft.")

    make_draft.short_description = "Mark selected posts as draft"


@admin.register(models.LeadForm)
class LeadFormAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "form_unique_id", "form_page_url", "organization", "active")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    actions = ["export_submissions_csv"]
    readonly_fields = ("form_unique_id", "form_page_url")
    formfield_overrides = {
        models.LeadForm._meta.get_field("schema").__class__: {"widget": admin.widgets.AdminTextareaWidget}
    }

    def export_submissions_csv(self, request, queryset):
        # simple admin action: not implemented here; placeholder for future
        self.message_user(request, "Use the submissions admin to export CSV for a specific form.")

    export_submissions_csv.short_description = "Export submissions for selected forms (see submissions admin)"


@admin.register(models.FormSubmission)
class FormSubmissionAdmin(admin.ModelAdmin):
    list_display = ("id", "form", "status", "created_at")
    readonly_fields = ("payload", "created_at", "user_agent", "submitter_ip", "lead_ref")
    search_fields = ("lead_ref",)
    list_filter = ("status", "form", "created_at")
    actions = ["export_csv"]

    def export_csv(self, request, queryset):
        import csv
        from django.http import HttpResponse

        fields = ["id", "form_id", "status", "lead_ref", "created_at", "payload"]
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = "attachment; filename=form_submissions.csv"
        writer = csv.writer(response)
        writer.writerow(fields)
        for s in queryset.order_by("-created_at"):
            writer.writerow([getattr(s, f) if f != "payload" else str(s.payload) for f in fields])
        return response

    export_csv.short_description = "Export selected submissions as CSV"


@admin.register(models.BlogComment)
class BlogCommentAdmin(admin.ModelAdmin):
    list_display = ("blog", "author", "author_name", "is_public", "created_at")
    search_fields = ("body",)
    actions = ["approve_comments", "mark_private"]

    def approve_comments(self, request, queryset):
        updated = queryset.update(is_public=True)
        self.message_user(request, f"{updated} comment(s) approved.")

    approve_comments.short_description = "Approve selected comments"

    def mark_private(self, request, queryset):
        updated = queryset.update(is_public=False)
        self.message_user(request, f"{updated} comment(s) marked private.")

    mark_private.short_description = "Mark selected comments private"


@admin.register(models.FormSubmissionTask)
class FormSubmissionTaskAdmin(admin.ModelAdmin):
    list_display = ("id", "submission", "status", "attempts", "next_try_at", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("submission__lead_ref", "last_error")
    actions = ["requeue_tasks"]

    def requeue_tasks(self, request, queryset):
        from django.utils import timezone

        updated = 0
        for task in queryset:
            task.attempts = 0
            task.status = "pending"
            task.next_try_at = timezone.now()
            task.save()
            updated += 1
        self.message_user(request, f"{updated} task(s) requeued.")

    requeue_tasks.short_description = "Requeue selected tasks"


@admin.register(models.BlogLike)
class BlogLikeAdmin(admin.ModelAdmin):
    list_display = ("blog", "user", "created_at")
