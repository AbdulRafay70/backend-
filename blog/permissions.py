from rest_framework import permissions


class IsStaffOrReadOnly(permissions.BasePermission):
    """Allow safe methods for everyone but write methods for staff only."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)


class IsAuthorOrStaff(permissions.BasePermission):
    """Allow object-level edits to the author or staff users."""

    def has_object_permission(self, request, view, obj):
        # Read perms are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        # Write permissions only to staff or the object's author (if present)
        if hasattr(obj, "author") and obj.author is not None:
            return bool(request.user and (request.user.is_staff or obj.author == request.user))
        return bool(request.user and request.user.is_staff)
