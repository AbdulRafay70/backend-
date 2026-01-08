from django.contrib.auth.models import User, Group, Permission
from django.contrib.auth.hashers import make_password
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, GroupExtension, PermissionExtension
from organization.models import Organization, Branch, Agency
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class UserProfileSerializer(serializers.ModelSerializer):
    commission_id = serializers.CharField(read_only=False, required=False, allow_null=True)

    class Meta:
        model = UserProfile
        # explicitly include commission_id and avoid exposing user FK through this serializer
        fields = ["id", "type", "commission_id"]
        read_only_fields = ["id"]


class UserSerializer(serializers.ModelSerializer):
    # Make these related fields optional on create/update so API callers
    # can omit them when not needed (previously they were required which
    # caused 400 responses on POST if omitted).
    groups = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(), many=True, write_only=True, required=False
    )
    organizations = serializers.PrimaryKeyRelatedField(
        queryset=Organization.objects.all(), many=True, write_only=True, required=False
    )
    branches = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(), many=True, write_only=True, required=False
    )
    agencies = serializers.PrimaryKeyRelatedField(
        queryset=Agency.objects.all(), many=True, write_only=True, required=False
    )
    # Make profile optional as well — UserProfile fields are nullable in the model
    # and it's common to create a User before attaching a profile.
    profile = UserProfileSerializer(required=False)
    group_details = serializers.SerializerMethodField(read_only=True)
    organization_details = serializers.SerializerMethodField(read_only=True)
    branch_details = serializers.SerializerMethodField(read_only=True)
    agency_details = serializers.SerializerMethodField(read_only=True)
    can_access_agent_panel = serializers.SerializerMethodField(read_only=True)

    def get_group_details(self, obj):
        return [{"id": group.id, "name": group.name} for group in obj.groups.all()]

    def get_organization_details(self, obj):
        return [{"id": org.id, "name": org.name} for org in obj.organizations.all()]

    def get_branch_details(self, obj):
        return [{"id": branch.id, "name": branch.name} for branch in obj.branches.all()]

    def get_agency_details(self, obj):
        return [{"id": agency.id, "name": agency.name} for agency in obj.agencies.all()]
    
    def get_can_access_agent_panel(self, obj):
        """Check if user can access agent panel based on type or permissions"""
        # Subagents always have access
        try:
            if hasattr(obj, 'profile') and obj.profile and obj.profile.type == 'subagent':
                return True
        except:
            pass
        
        # Check if user has the permission
        return obj.has_perm('organization.employee_agent_portal_access')

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "is_active",
            "username",
            "password",
            "is_superuser",
            "is_staff",
            "groups",
            "organizations",
            "branches",
            "profile",
            "agencies",
            "agency_details",
            "organization_details",
            "branch_details",
            "group_details",
            "can_access_agent_panel",
        ]
        extra_kwargs = {"password": {"write_only": True, "required": False}}

    def create(self, validated_data):
        groups = validated_data.pop("groups", [])
        organizations = validated_data.pop("organizations", [])
        branches = validated_data.pop("branches", [])
        agencies = validated_data.pop("agencies", [])
        profile_data = validated_data.pop("profile", None)

        # If email is provided and username is not, use email as username
        # This enables email-based login
        if validated_data.get('email') and not validated_data.get('username'):
            validated_data['username'] = validated_data['email']
        
        if "password" in validated_data:
            validated_data["password"] = make_password(validated_data["password"])
        user = User.objects.create(**validated_data)

        if profile_data:
            profile = UserProfile.objects.create(user=user, **profile_data)

        user.groups.set(groups)
        user.organizations.set(organizations)
        user.branches.set(branches)
        user.agencies.set(agencies)
        return user

    def update(self, instance, validated_data):
        groups = validated_data.pop("groups", None)
        organizations = validated_data.pop("organizations", None)
        branches = validated_data.pop("branches", None)
        agencies = validated_data.pop("agencies", None)

        profile_data = validated_data.pop("profile", None)

        if "password" in validated_data:
            instance.password = make_password(validated_data.pop("password"))

        instance = super().update(instance, validated_data)

        if profile_data:
            profile, created = UserProfile.objects.get_or_create(user=instance)
            for key, value in profile_data.items():
                setattr(profile, key, value)
            profile.save()

        if groups is not None:
            instance.groups.set(groups)

        if organizations is not None:
            instance.organizations.set(organizations)

        if branches is not None:
            instance.branches.set(branches)
            
        if agencies is not None:
            instance.agencies.set(agencies)

        return instance


# Groups ans Permissions
class GroupExtensionSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupExtension
        exclude = ["group"]


class GroupSerializer(serializers.ModelSerializer):
    extended = GroupExtensionSerializer()

    class Meta:
        model = Group
        fields = "__all__"

    def create(self, validated_data):
        extended_data = validated_data.pop("extended", None)
        group = super(GroupSerializer, self).create(validated_data)

        if extended_data:
            GroupExtension.objects.create(group=group, **extended_data)

        return group

    def update(self, instance, validated_data):
        extended_data = validated_data.pop("extended", None)

        # Update the main instance
        instance = super(GroupSerializer, self).update(instance, validated_data)

        # Update or create the nested instance only if extended_data is provided
        # and has an organization (required field)
        if extended_data and extended_data.get('organization'):
            group_extension, created = GroupExtension.objects.get_or_create(
                group=instance,
                defaults={'organization': extended_data.get('organization')}
            )
            for key, value in extended_data.items():
                setattr(group_extension, key, value)
            group_extension.save()

        return instance


class PermissionExtensionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PermissionExtension
        exclude = ["permission"]


class PermissionSerializer(serializers.ModelSerializer):
    extended = PermissionExtensionSerializer()

    class Meta:
        model = Permission
        fields = "__all__"

    def create(self, validated_data):
        extended_data = validated_data.pop("extended", None)
        permission = super(PermissionSerializer, self).create(validated_data)

        if extended_data:
            PermissionExtension.objects.create(permission=permission, **extended_data)

        return permission

    def update(self, instance, validated_data):
        extended_data = validated_data.pop("extended", None)

        # Update the main instance
        instance = super(PermissionSerializer, self).update(instance, validated_data)

        # Update or create the nested instance
        if extended_data:
            permission_extension, created = PermissionExtension.objects.get_or_create(
                permission=instance
            )
            for key, value in extended_data.items():
                setattr(permission_extension, key, value)
            permission_extension.save()

        return instance


# ============================================================
# CUSTOM JWT TOKEN SERIALIZERS
# ============================================================

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer that:
    1. Accepts 'email' field for authentication (in addition to username)
    2. Adds organization/agency context to the token claims
    3. Returns user's organizations/agencies in the response
    """
    
    # Don't override username_field - causes issues
    # Instead, add email as field and handle in validate()
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Add email as an accepted field (in addition to username)
        self.fields['email'] = serializers.CharField(required=False, write_only=True)
        # Make username optional since we can use email
        self.fields['username'].required = False
        self.fields['password'].required = True  # Password is always required
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['email'] = user.email
        token['username'] = user.username
        token['is_staff'] = user.is_staff
        token['is_superuser'] = user.is_superuser
        
        # Add user type from profile if exists
        try:
            if hasattr(user, 'profile') and user.profile:
                token['user_type'] = user.profile.type if user.profile.type else None
        except:
            token['user_type'] = None
        
        # Check if user can access agent panel
        # 1. Branches (subagents) always get access to both panels
        # 2. Users with the permission via groups also get access
        can_access_agent = False
        try:
            if hasattr(user, 'profile') and user.profile and user.profile.type == 'subagent':
                can_access_agent = True
        except:
            pass
        
        # Check if user has the permission via groups (if not already granted by branch type)
        if not can_access_agent:
            can_access_agent = user.has_perm('organization.employee_agent_portal_access')
        
        token['can_access_agent_panel'] = can_access_agent
        
        # For admin panel users (staff), add organizations
        if user.is_staff:
            try:
                orgs = list(user.organizations.values_list('id', flat=True))
                token['organizations'] = orgs
                token['organization_id'] = orgs[0] if orgs else None
            except:
                token['organizations'] = []
                token['organization_id'] = None
        else:
            # For agent panel users (non-staff), add agencies
            try:
                agencies = list(user.agencies.values_list('id', flat=True))
                token['agencies'] = agencies
                token['agency_id'] = agencies[0] if agencies else None
            except:
                token['agencies'] = []
                token['agency_id'] = None
        
        return token
    
    @classmethod
    def get_user(cls, validated_data):
        """
        Override to allow fetching user by email in addition to username.
        This is called by the parent validate() method.
        """
        from django.contrib.auth.models import User
        
        # Try to get username from validated data
        username = validated_data.get(cls.username_field, None)
        
        if not username:
            return None
        
        # First try to find by email (if username looks like an email or is an email)
        if '@' in username:
            try:
                return User.objects.get(email=username)
            except User.DoesNotExist:
                pass
        
        # Fallback to username lookup
        try:
            return User.objects.get(**{cls.username_field: username})
        except User.DoesNotExist:
            return None
    
    def validate(self, attrs):
        # Allow both 'email' and 'username' fields
        email = attrs.get('email')
        username = attrs.get('username')
        password = attrs.get('password')
        
        # Use email if provided (prioritize email over username)
        if email:
            # Map email to username for authentication
            attrs['username'] = email
        
        # Ensure username field is set before calling parent validate
        if not attrs.get('username'):
            raise serializers.ValidationError('No credentials provided')
        
        # Call parent validation (this triggers authentication)
        data = super().validate(attrs)
        
        # Add user details to response
        user = self.user
        data['user'] = {
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'first_name': user.first_name,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
        }
        
        # Add user type from profile
        try:
            if hasattr(user, 'profile') and user.profile:
                data['user']['user_type'] = user.profile.type
        except:
            data['user']['user_type'] = None
        
        # Check if user can access agent panel
        # 1. Branches (subagents) always get access to both panels
        # 2. Users with the permission via groups also get access
        can_access_agent = False
        try:
            if hasattr(user, 'profile') and user.profile and user.profile.type == 'subagent':
                can_access_agent = True
        except:
            pass
        
        # Check if user has the permission via groups (if not already granted by branch type)
        if not can_access_agent:
            can_access_agent = user.has_perm('organization.employee_agent_portal_access')
        
        data['user']['can_access_agent_panel'] = can_access_agent
        
        # For admin panel users, return organizations
        if user.is_staff:
            try:
                orgs = user.organizations.all()
                data['user']['organizations'] = [
                    {'id': org.id, 'name': org.name, 'org_code': org.org_code} 
                    for org in orgs
                ]
            except:
                data['user']['organizations'] = []
            
            # Also include branches for staff users (employees)
            try:
                user_branches = user.branches.all()
                data['user']['branches'] = [
                    {'id': branch.id, 'name': branch.name, 'branch_code': branch.branch_code}
                    for branch in user_branches
                ]
            except:
                data['user']['branches'] = []
        else:
            # For agent panel users, return agencies
            try:
                agencies = user.agencies.all()
                data['user']['agencies'] = [
                    {'id': agency.id, 'name': agency.name, 'agency_code': agency.agency_code}
                    for agency in agencies
                ]
            except:
                data['user']['agencies'] = []
            
            # Also include branches for non-staff users
            try:
                user_branches = user.branches.all()
                data['user']['branches'] = [
                    {'id': branch.id, 'name': branch.name, 'branch_code': branch.branch_code}
                    for branch in user_branches
                ]
            except:
                data['user']['branches'] = []
        
        return data
