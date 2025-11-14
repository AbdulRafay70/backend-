
from django.contrib import admin
from .models import PromotionContact


@admin.register(PromotionContact)
class PromotionContactAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "phone",
        "email",
        "contact_type",
        "city",
        "organization_id",
        "branch_id",
        "status",
        "created_at",
    )
    list_filter = (
        "contact_type",
        "status",
        "city",
        "organization_id",
        "branch_id",
        "source",
    )
    search_fields = ("name", "phone", "email", "city")
    readonly_fields = ("created_at", "updated_at")
    ordering = ("-created_at",)

    # Optional UX improvements for marketing/admins
    list_display_links = ("name", "phone")
    list_editable = ("status",)
    list_per_page = 50
    # Django >=4.2 supports search_help_text on ModelAdmin; provide guidance
    try:
        search_help_text = "Search by name, phone, or email"
    except Exception:
        # Older Django versions ignore unknown attributes — safe fallback
        pass
