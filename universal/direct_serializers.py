# Additional serializers for direct Organization/Branch/Agency creation
from rest_framework import serializers
from organization.models import Organization, Branch, Agency


class DirectOrganizationSerializer(serializers.ModelSerializer):
    """Serializer for creating Organization directly (admin users)"""
    phone = serializers.CharField(source='phone_number', required=False, allow_blank=True)
    
    class Meta:
        model = Organization
        fields = ['name', 'email', 'phone', 'address', 'logo']
    
    def validate_email(self, value):
        if not value:
            return value
        qs = Organization.objects.filter(email__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This email is already registered for another organization.")
        return value


class DirectBranchSerializer(serializers.ModelSerializer):
    """Serializer for creating Branch directly (admin users)"""
    parent_id = serializers.PrimaryKeyRelatedField(
        queryset=Organization.objects.all(),
        source='organization',
        required=True,
        help_text="Organization ID"
    )
    phone = serializers.CharField(source='contact_number', required=False, allow_blank=True)
    
    class Meta:
        model = Branch
        fields = ['name', 'parent_id', 'email', 'phone', 'address']
    
    def validate_email(self, value):
        if not value:
            return value
        qs = Branch.objects.filter(email__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This email is already registered for another branch.")
        return value


class DirectAgencySerializer(serializers.ModelSerializer):
    """Serializer for creating Agency directly (admin users)"""
    parent_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(),
        source='branch',
        required=True,
        help_text="Branch ID"
    )
    phone = serializers.CharField(source='phone_number', required=False, allow_blank=True)
    
    class Meta:
        model = Agency
        fields = ['name', 'parent_id', 'email', 'phone', 'address']
    
    def validate_email(self, value):
        if not value:
            return value
        qs = Agency.objects.filter(email__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This email is already registered for another agency.")
        return value
