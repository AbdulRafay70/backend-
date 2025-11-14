from rest_framework import serializers
from .models import PassportLead, PaxProfile, FollowUpLog


class PaxProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaxProfile
        fields = ['id', 'lead', 'first_name', 'last_name', 'age', 'gender', 'passport_number', 'nationality', 'phone', 'notes']


class FollowUpLogSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    class Meta:
        model = FollowUpLog
        fields = ['id', 'lead', 'remark_text', 'created_by', 'created_at']
        read_only_fields = ['lead', 'created_by']


class PassportLeadCreateSerializer(serializers.ModelSerializer):
    pax = PaxProfileSerializer(many=True, required=False)
    # accept 'pax_details' as an alias for 'pax' in incoming payloads
    pax_details = PaxProfileSerializer(many=True, required=False, write_only=True)

    class Meta:
        model = PassportLead
        # include pax_details (write-only alias) so DRF recognizes the declared field
        fields = ['id', 'branch_id', 'organization_id', 'lead_source', 'customer_name', 'customer_phone', 'cnic', 'passport_number', 'city', 'remarks', 'followup_status', 'next_followup_date', 'assigned_to', 'pending_balance', 'pax_details', 'pax']

    def validate_customer_phone(self, value):
        if not value:
            raise serializers.ValidationError('Phone is required')
        return value

    def create(self, validated_data):
        # support both 'pax' and 'pax_details' keys (client may send either)
        pax_data = validated_data.pop('pax', []) + validated_data.pop('pax_details', [])
        lead = PassportLead.objects.create(**validated_data)
        for p in pax_data:
            PaxProfile.objects.create(lead=lead, **p)
        return lead


class PassportLeadSerializer(serializers.ModelSerializer):
    pax = PaxProfileSerializer(many=True, read_only=True)
    assigned_to = serializers.StringRelatedField(read_only=True)
    # alias to match response shape requested by clients
    pax_details = PaxProfileSerializer(many=True, read_only=True, source='pax')

    class Meta:
        model = PassportLead
        fields = ['id', 'branch_id', 'organization_id', 'lead_source', 'customer_name', 'customer_phone', 'cnic', 'passport_number', 'city', 'remarks', 'followup_status', 'next_followup_date', 'assigned_to', 'pending_balance', 'pax', 'pax_details', 'created_at', 'updated_at']
