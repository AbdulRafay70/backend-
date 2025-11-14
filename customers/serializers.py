from rest_framework import serializers
from .models import Customer, Lead, FollowUpHistory, LoanCommitment


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            "id",
            "full_name",
            "phone",
            "email",
            "passport_number",
            "city",
            "source",
            "branch",
            "organization",
            "is_active",
            "service_type",
            "last_activity",
            "created_at",
            "updated_at",
        ]


class LeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = [
            "id",
            "full_name",
            "phone",
            "email",
            "passport_number",
            "cnic",
            "source",
            "organization",
            "branch",
            "interest",
            "status",
            "created_by",
            "created_at",
        ]


class FollowUpHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FollowUpHistory
        fields = ["id", "lead", "followup_date", "remarks", "contacted_via", "created_by", "created_at"]


class LoanCommitmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanCommitment
        fields = [
            "id",
            "lead",
            "booking",
            "promised_clear_date",
            "status",
            "remarks",
            "created_by",
            "created_at",
        ]
