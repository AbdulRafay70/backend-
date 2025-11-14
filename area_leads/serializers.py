from rest_framework import serializers
from .models import AreaLead, LeadFollowUp, LeadConversation, LeadPaymentPromise


class AreaLeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = AreaLead
        fields = "__all__"

    def validate(self, data):
        passport = data.get("passport_number")
        contact = data.get("contact_number")
        branch = data.get("branch_id")
        if not passport and not contact:
            raise serializers.ValidationError("Either passport_number or contact_number is required.")

        # Ensure passport unique (db constraint exists) — additional validation across branch
        if passport:
            qs = AreaLead.objects.filter(passport_number=passport)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({"passport_number": "A lead with this passport already exists."})

        return data


class LeadFollowUpSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadFollowUp
        fields = "__all__"


class LeadConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadConversation
        fields = "__all__"


class LeadPaymentPromiseSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadPaymentPromise
        fields = "__all__"
