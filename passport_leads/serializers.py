from rest_framework import serializers
from .models import PassportLead, PaxProfile, FollowUpLog


class PaxProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaxProfile
        fields = [
            'id', 'lead', 'first_name', 'last_name', 'nickname', 'passport_number',
            'date_of_birth', 'date_of_issue', 'date_of_expiry',
            'issuing_country', 'nationality', 'address', 'email',
            'phone', 'whatsapp_number', 'age', 'gender', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


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
    customer_id = serializers.SerializerMethodField()

    def get_customer_id(self, obj):
        return obj.customer.id if obj.customer else None

    class Meta:
        model = PassportLead
        # include pax_details (write-only alias) so DRF recognizes the declared field
        fields = ['id', 'branch_id', 'organization_id', 'customer', 'customer_id', 'lead_source', 'customer_name', 'customer_phone', 'cnic', 'passport_number', 'city', 'remarks', 'followup_status', 'next_followup_date', 'assigned_to', 'assigned_to_name', 'pending_balance', 'pax_details', 'pax']

    def validate_customer_phone(self, value):
        if not value:
            raise serializers.ValidationError('Phone is required')
        return value

    def create(self, validated_data):
        from customers.models import Customer
        from organization.models import Branch, Organization
        
        # support both 'pax' and 'pax_details' keys (client may send either)
        pax_data = validated_data.pop('pax', []) + validated_data.pop('pax_details', [])
        
        # Get or create customer
        customer_phone = validated_data.get('customer_phone')
        customer_name = validated_data.get('customer_name')
        passport_number = validated_data.get('passport_number')
        city = validated_data.get('city')
        branch_id = validated_data.get('branch_id')
        organization_id = validated_data.get('organization_id')
        
        # Try to find existing customer
        customer = None
        if customer_phone:
            customer = Customer.objects.filter(phone=customer_phone, is_active=True).first()
        
        if not customer and passport_number:
            customer = Customer.objects.filter(passport_number=passport_number, is_active=True).first()
        
        # Create customer if doesn't exist
        if not customer:
            # Get Branch and Organization objects
            branch = None
            organization = None
            
            if branch_id:
                try:
                    branch = Branch.objects.get(id=branch_id)
                except Branch.DoesNotExist:
                    pass
            
            if organization_id:
                try:
                    organization = Organization.objects.get(id=organization_id)
                except Organization.DoesNotExist:
                    pass
            
            customer = Customer.objects.create(
                full_name=customer_name,
                phone=customer_phone,
                passport_number=passport_number,
                city=city,
                source="Passport Lead",
                branch=branch,
                organization=organization,
                service_type="Passport",
                is_active=True
            )
        
        # Link customer to lead
        validated_data['customer'] = customer
        
        lead = PassportLead.objects.create(**validated_data)
        for p in pax_data:
            PaxProfile.objects.create(lead=lead, **p)
        return lead


class PassportLeadSerializer(serializers.ModelSerializer):
    assigned_to = serializers.StringRelatedField(read_only=True)
    # pax_details contains all passenger information
    pax_details = PaxProfileSerializer(many=True, read_only=True, source='pax')
    customer_id = serializers.SerializerMethodField()

    def get_customer_id(self, obj):
        return obj.customer.id if obj.customer else None

    class Meta:
        model = PassportLead
        fields = ['id', 'branch_id', 'organization_id', 'customer', 'customer_id', 'lead_source', 'customer_name', 'customer_phone', 'cnic', 'passport_number', 'city', 'remarks', 'followup_status', 'next_followup_date', 'assigned_to', 'assigned_to_name', 'pending_balance', 'pax_details', 'created_at', 'updated_at']
