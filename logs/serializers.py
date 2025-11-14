from rest_framework import serializers
from .models import SystemLog
from django.contrib.auth import get_user_model


class SystemLogSerializer(serializers.ModelSerializer):
    # Explicitly declare ip_address to avoid DRF schema generation issues
    # Use CharField instead of IPAddressField to avoid version compatibility issues
    ip_address = serializers.CharField(allow_null=True, required=False, allow_blank=True)
    # include a friendly user display when possible
    user_display = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = SystemLog
        fields = [
            "id",
            "timestamp",
            "action_type",
            "model_name",
            "record_id",
            "organization_id",
            "branch_id",
            "agency_id",
            "user_id",
            "user_display",
            "description",
            "ip_address",
            "status",
            "old_data",
            "new_data",
        ]

    def get_user_display(self, obj):
        try:
            uid = getattr(obj, "user_id", None)
            if not uid:
                return None
            User = get_user_model()
            user = User.objects.filter(pk=uid).first()
            if user is None:
                return None
            # prefer full name or username
            return getattr(user, "get_full_name", lambda: None)() or getattr(user, "username", None)
        except Exception:
            return None
