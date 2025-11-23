from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Lead, FollowUpHistory, LoanCommitment

User = get_user_model()


class LeadSerializer(serializers.ModelSerializer):
    customer_full_name = serializers.CharField(required=False, allow_blank=True, allow_null=True, default=None)
    last_contacted_date = serializers.DateField(required=False, allow_null=True)
    # Accept any free-text identifier for assignee (string). API will store and return the string.
    assigned_to = serializers.CharField(required=False, allow_blank=True, allow_null=True, default=None)
    task_type = serializers.CharField(required=False, allow_blank=True, allow_null=True, default=None)

    class Meta:
        model = Lead
        fields = "__all__"

    def validate(self, data):
        # If this is an internal task, relax personal data requirements
        is_internal_raw = data.get("is_internal_task")
        if is_internal_raw is None and self.instance is not None:
            is_internal = getattr(self.instance, "is_internal_task", False)
        else:
            # normalize common truthy/falsy representations
            def _to_bool(val):
                if isinstance(val, bool):
                    return val
                if val is None:
                    return False
                s = str(val).strip().lower()
                if s in ("1", "true", "t", "yes", "y"): 
                    return True
                if s in ("0", "false", "f", "no", "n"): 
                    return False
                return False

            is_internal = _to_bool(is_internal_raw)

        # When internal task, do not require customer name/passport/contact
        if is_internal:
            # still enforce uniqueness for passport if provided and organization present
            passport = data.get("passport_number") or getattr(self.instance, "passport_number", None)
            organization = data.get("organization") or getattr(self.instance, "organization", None)
            if passport and organization:
                qs = Lead.objects.filter(organization=organization, passport_number=passport)
                if self.instance:
                    qs = qs.exclude(pk=self.instance.pk)
                if qs.exists():
                    raise serializers.ValidationError({"passport_number": "A lead with this passport already exists for the organization."})
            return data

        # Non-internal leads (branch customers): require customer_full_name and either passport_number or contact_number
        passport = data.get("passport_number") or getattr(self.instance, "passport_number", None)
        contact = data.get("contact_number") or getattr(self.instance, "contact_number", None)
        organization = data.get("organization") or getattr(self.instance, "organization", None)

        # customer_full_name is optional; require at least passport or contact for non-internal leads
        if not passport and not contact:
            raise serializers.ValidationError("Either passport_number or contact_number is required.")

        # enforce uniqueness within organization for passport_number if provided
        if passport and organization:
            qs = Lead.objects.filter(organization=organization, passport_number=passport)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({"passport_number": "A lead with this passport already exists for the organization."})

        return data


class FollowUpHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FollowUpHistory
        fields = "__all__"


class LoanCommitmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanCommitment
        fields = "__all__"


class FollowUpSerializer(serializers.ModelSerializer):
    booking_number = serializers.CharField(source='booking.booking_number', read_only=True)

    class Meta:
        model = None
        fields = ['id', 'booking', 'booking_number', 'lead', 'remaining_amount', 'due_date', 'status', 'notes', 'created_at', 'closed_at', 'created_by']
        read_only_fields = ['created_at', 'closed_at']

    def __init__(self, *args, **kwargs):
        # lazy import to avoid circular import during migrations/tests
        from .models import FollowUp
        self.Meta.model = FollowUp
        super().__init__(*args, **kwargs)
