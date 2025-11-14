from django.db import models
from django.contrib.auth.models import User, Group, Permission
from organization.models import Organization

# Create your models here.


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    type = models.CharField(max_length=30, null=True, blank=True)
    # optional commission account identifier for the user
    commission_id = models.CharField(max_length=64, null=True, blank=True)


class GroupExtension(models.Model):
    group = models.OneToOneField(
        Group, related_name="extended", on_delete=models.CASCADE
    )
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    type = models.CharField(max_length=50, blank=True, null=True)


class PermissionExtension(models.Model):
    permission = models.OneToOneField(
        Permission, related_name="extended", on_delete=models.CASCADE
    )
    type = models.CharField(max_length=50, blank=True, null=True)
