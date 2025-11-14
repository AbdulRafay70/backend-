from rest_framework.permissions import BasePermission


class IsBranchUser(BasePermission):
    """
    Allow only branch users (or org admins) to create/update leads.
    """
    message = "Only branch users can create or update leads."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        # Assumption: user model has a `role` attribute; fallback to staff as org_admin
        role = getattr(user, "role", None)
        if role in ["branch_user", "branch_admin", "org_admin"]:
            return True
        # allow Django superusers/staff as org admins
        if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
            return True
        return False
