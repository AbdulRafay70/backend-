from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOrgStaff(BasePermission):
    """Allow write access only to users who belong to the organization referenced in the request

    For object-level checks, expects the object to have `organization_id` attribute.
    """

    def has_permission(self, request, view):
        # allow safe methods
        if request.method in SAFE_METHODS:
            return True

        # If view is acting on an object (e.g., update-status with booking_id in kwargs),
        # defer org check to object-level permission (has_object_permission). Allow here
        # if the user is authenticated; object-level will enforce org membership.
        if getattr(view, "kwargs", None) and view.kwargs.get("booking_id"):
            return bool(request.user and request.user.is_authenticated)

        # try to obtain organization id from body or query params
        org_id = None
        if request.data:
            org_id = request.data.get("organization") or request.data.get("organization_id")
        if not org_id:
            org_id = request.query_params.get("organization_id")

        if not org_id:
            # if not provided, allow only superusers
            return bool(request.user and request.user.is_authenticated and request.user.is_superuser)

        try:
            org_id = int(org_id)
        except Exception:
            return False

        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        user_org_ids = [o.id for o in request.user.organizations.all()]
        return org_id in user_org_ids

    def has_object_permission(self, request, view, obj):
        if request.user and request.user.is_superuser:
            return True
        try:
            org_id = getattr(obj, "organization_id", None) or getattr(obj, "organization", None)
            if hasattr(org_id, "id"):
                org_id = org_id.id
        except Exception:
            org_id = None

        if org_id is None:
            return False
        return org_id in [o.id for o in request.user.organizations.all()]
