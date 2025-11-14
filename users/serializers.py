from django.contrib.auth.models import User, Group, Permission
from django.contrib.auth.hashers import make_password
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, GroupExtension, PermissionExtension
from organization.models import Organization, Branch, Agency


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

    def get_group_details(self, obj):
        return [{"id": group.id, "name": group.name} for group in obj.groups.all()]

    def get_organization_details(self, obj):
        return [{"id": org.id, "name": org.name} for org in obj.organizations.all()]

    def get_branch_details(self, obj):
        return [{"id": branch.id, "name": branch.name} for branch in obj.branches.all()]

    def get_agency_details(self, obj):
        return [{"id": agency.id, "name": agency.name} for agency in obj.agencies.all()]

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
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
        ]
        extra_kwargs = {"password": {"write_only": True, "required": False}}

    def create(self, validated_data):
        groups = validated_data.pop("groups", [])
        organizations = validated_data.pop("organizations", [])
        branches = validated_data.pop("branches", [])
        agencies = validated_data.pop("agencies", [])
        profile_data = validated_data.pop("profile", None)

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
            profile = instance.profile
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

        # Update or create the nested instance
        if extended_data:
            group_extension, created = GroupExtension.objects.get_or_create(
                group=instance
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
