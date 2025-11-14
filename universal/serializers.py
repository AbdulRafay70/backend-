# Serializer for PaxMovement
from rest_framework import serializers
from .models import PaxMovement, UniversalRegistration
from django.db import transaction

class PaxMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaxMovement
        fields = '__all__'


TYPE_REQUIRED_FIELDS = {
    "organization": ["name"],
    "branch": ["name", "parent"],
    "agent": ["name", "parent"],
    "employee": ["name", "parent"],
}


class UniversalRegistrationSerializer(serializers.ModelSerializer):
    # Block organization_id and branch_id from being input - they are auto-generated
    # These will only be displayed in responses
    
    # Make image fields optional and allow null values for Swagger/JSON testing
    cnic_front = serializers.ImageField(required=False, allow_null=True)
    cnic_back = serializers.ImageField(required=False, allow_null=True)
    visiting_card = serializers.ImageField(required=False, allow_null=True)
    dts_license = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    
    # Field aliases for API consistency
    parent_id = serializers.PrimaryKeyRelatedField(
        queryset=UniversalRegistration.objects.all(),
        source='parent',
        required=False,
        allow_null=True,
        help_text="ID of parent entity (organization/branch)"
    )
    # Read-only convenience field for frontend display
    parent_name = serializers.SerializerMethodField(read_only=True)
    phone = serializers.CharField(
        source='contact_no',
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Contact phone number"
    )
    
    class Meta:
        model = UniversalRegistration
        fields = [
            "id", "type", "parent_id", "name", "owner_name", "email", "phone", 
            "parent_name",
            "cnic", "cnic_front", "cnic_back", "visiting_card", "dts_license",
            "license_no", "ntn_no", "address", "city", "country", 
            "created_by", "created_at", "updated_at", "status", "is_active",
            "organization_id", "branch_id"
        ]
        read_only_fields = ("id", "organization_id", "branch_id", "created_at", "updated_at")

    def validate_email(self, value):
        if not value:
            return value
        qs = UniversalRegistration.objects.filter(email__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This email is already registered for another entity.")
        return value

    def validate(self, data):
        t = data.get("type") or getattr(self.instance, "type", None)
        parent = data.get("parent") or getattr(self.instance, "parent", None)

        # Basic type validation
        if t not in [c[0] for c in UniversalRegistration.TYPE_CHOICES]:
            raise serializers.ValidationError({"type": "Invalid type"})

        # Parent type constraints - MANDATORY SELECTION
        if t == UniversalRegistration.TYPE_BRANCH:
            if not parent:
                raise serializers.ValidationError({
                    "parent_id": "Branch must have an Organization as parent_id. Please provide a valid organization ID."
                })
            if parent.type != UniversalRegistration.TYPE_ORGANIZATION:
                raise serializers.ValidationError({
                    "parent_id": f"Branch parent_id must be an organization. Selected parent is {parent.type}."
                })

        if t == UniversalRegistration.TYPE_AGENT:
            if not parent:
                raise serializers.ValidationError({
                    "parent_id": "Agent must have a Branch as parent_id. Please provide a valid branch ID."
                })
            if parent.type != UniversalRegistration.TYPE_BRANCH:
                raise serializers.ValidationError({
                    "parent_id": f"Agent parent_id must be a branch. Selected parent is {parent.type}. Agents can only be linked to branches."
                })

        if t == UniversalRegistration.TYPE_EMPLOYEE:
            if not parent:
                raise serializers.ValidationError({
                    "parent_id": "Employee must have an Organization or Branch as parent_id. Please provide a valid parent ID."
                })
            if parent.type not in [UniversalRegistration.TYPE_ORGANIZATION, UniversalRegistration.TYPE_BRANCH]:
                raise serializers.ValidationError({
                    "parent_id": f"Employee parent_id must be an organization or branch. Selected parent is {parent.type}. Employees can only be linked to organizations or branches."
                })

        # Enforce required fields per type
        required = TYPE_REQUIRED_FIELDS.get(t, [])
        missing = [f for f in required if not data.get(f) and not getattr(self.instance, f, None)]
        if missing:
            raise serializers.ValidationError({"missing_fields": missing})

        return data

    def create(self, validated_data):
        from .utils import generate_prefixed_id
        
        entity_type = validated_data.get("type")
        parent = validated_data.get("parent")
        
        # Auto-generate organization_id for organizations
        if entity_type == UniversalRegistration.TYPE_ORGANIZATION:
            if not validated_data.get("organization_id"):
                # Generate a unique organization ID
                validated_data["organization_id"] = generate_prefixed_id("organization")
        
        # Auto-generate branch_id for branches
        elif entity_type == UniversalRegistration.TYPE_BRANCH:
            if not validated_data.get("branch_id"):
                # Generate a unique branch ID
                validated_data["branch_id"] = generate_prefixed_id("branch")
            
            # Inherit organization_id from parent organization
            if parent and parent.type == UniversalRegistration.TYPE_ORGANIZATION:
                validated_data["organization_id"] = parent.organization_id or parent.id
        
        # For agents and employees, inherit from parent
        elif entity_type == UniversalRegistration.TYPE_AGENT:
            if parent:
                if parent.type == UniversalRegistration.TYPE_BRANCH:
                    validated_data["branch_id"] = parent.branch_id or parent.id
                    # Inherit organization from branch's parent
                    if parent.parent and parent.parent.type == UniversalRegistration.TYPE_ORGANIZATION:
                        validated_data["organization_id"] = parent.parent.organization_id or parent.parent.id
                    elif parent.organization_id:
                        validated_data["organization_id"] = parent.organization_id
        
        elif entity_type == UniversalRegistration.TYPE_EMPLOYEE:
            if parent:
                # Inherit branch and organization IDs from parent
                if parent.branch_id:
                    validated_data.setdefault("branch_id", parent.branch_id)
                if parent.organization_id:
                    validated_data.setdefault("organization_id", parent.organization_id)

        # default status
        # New registrations should start pending; admin will approve to activate.
        validated_data.setdefault("status", UniversalRegistration.STATUS_PENDING)

        return super().create(validated_data)

    def get_parent_name(self, obj):
        parent = getattr(obj, 'parent', None)
        return parent.name if parent else None

    def to_representation(self, instance):
        """Normalize status in API output so frontend shows consistent values.

        Rules:
        - If is_active is True -> status = 'active'
        - If is_active is False and stored status is 'inactive' or 'suspended' -> keep that
        - Otherwise treat as 'pending'
        """
        data = super().to_representation(instance)
        is_active = getattr(instance, 'is_active', False)
        stored_status = getattr(instance, 'status', None)
        if is_active:
            data['status'] = 'active'
        else:
            if stored_status in [UniversalRegistration.STATUS_INACTIVE, UniversalRegistration.STATUS_SUSPENDED]:
                data['status'] = stored_status
            else:
                data['status'] = 'pending'
        # ensure is_active is boolean in response
        data['is_active'] = bool(is_active)
        return data

    def update(self, instance, validated_data):
        # When parent changes, ensure inheritance updates
        parent = validated_data.get("parent")
        if parent:
            if parent.type == UniversalRegistration.TYPE_ORGANIZATION:
                validated_data.setdefault("organization_id", parent.id)
            elif parent.type == UniversalRegistration.TYPE_BRANCH:
                validated_data.setdefault("branch_id", parent.id)
                if parent.parent and parent.parent.type == UniversalRegistration.TYPE_ORGANIZATION:
                    validated_data.setdefault("organization_id", parent.parent.id)

        return super().update(instance, validated_data)


# Serializer for RegistrationRule
from .models import RegistrationRule

class RegistrationRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistrationRule
        fields = '__all__'


# Simple serializer for parent selection options
class ParentSelectionSerializer(serializers.ModelSerializer):
    """Lightweight serializer for displaying parent selection options with IDs"""
    
    class Meta:
        model = UniversalRegistration
        fields = ['id', 'type', 'name', 'organization_id', 'branch_id', 'is_active']
        read_only_fields = fields
