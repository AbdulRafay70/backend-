from rest_framework import serializers
from .models import PromotionContact


class PromotionContactSerializer(serializers.ModelSerializer):
    # expose API-friendly names required by spec
    full_name = serializers.CharField(source="name", allow_blank=True, allow_null=True, required=False)
    contact_number = serializers.CharField(source="phone")
    org_id = serializers.IntegerField(source="organization_id", required=False, allow_null=True)
    br_id = serializers.IntegerField(source="branch_id", required=False, allow_null=True)

    class Meta:
        model = PromotionContact
        # keep internal fields but expose aliased names
        fields = [
            "id",
            "full_name",
            "contact_number",
            "email",
            "contact_type",
            "source",
            "source_reference",
            "org_id",
            "br_id",
            "city",
            "status",
            "is_duplicate",
            "is_subscribed",
            "last_seen",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "is_duplicate", "last_seen", "created_at", "updated_at"]


class PromotionContactImportResultSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    created = serializers.IntegerField()
    updated = serializers.IntegerField()
    errors = serializers.ListField(child=serializers.CharField(), default=list)
