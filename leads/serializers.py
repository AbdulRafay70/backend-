from rest_framework import serializers
from .models import Lead, FollowUpHistory, LoanCommitment


class LeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = "__all__"

    def validate(self, data):
        # require either passport_number or contact_number
        passport = data.get("passport_number") or getattr(self.instance, "passport_number", None)
        contact = data.get("contact_number") or getattr(self.instance, "contact_number", None)
        organization = data.get("organization") or getattr(self.instance, "organization", None)

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
