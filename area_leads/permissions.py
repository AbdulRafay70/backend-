from rest_framework.permissions import BasePermission


class IsBranchUser(BasePermission):
    message = "Only branch users can access or modify customer leads."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        role = getattr(request.user, "role", None)
        # fallback to staff/superuser
        if role in ["branch_user", "branch_admin"]:
            return True
        if getattr(request.user, "is_staff", False) or getattr(request.user, "is_superuser", False):
            return True
        return False
