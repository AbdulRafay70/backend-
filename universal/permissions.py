from rest_framework.permissions import BasePermission


class UniversalPermission(BasePermission):
    """Custom permission enforcing simple role rules for creation.

    Rules (basic placeholders — integrate with your real role system later):
      - Create Organization: user must be superuser
      - Create Branch: user must be staff or superuser
      - Create Agent: user must be staff or superuser
      - Create Employee: any authenticated user

    Update/Delete: allowed for superuser or staff (placeholder)
    """

    def has_permission(self, request, view):
        # Allow safe methods
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True

        # Creation endpoint
        if getattr(view, "action", None) == "create" or request.method == "POST":
            t = request.data.get("type")
            if t == "organization":
                return bool(request.user and request.user.is_authenticated and request.user.is_superuser)
            if t == "branch":
                return bool(request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser))
            if t == "agent":
                return bool(request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser))
            if t == "employee":
                return bool(request.user and request.user.is_authenticated)

        # For updates/deletes require staff or superuser
        if request.method in ("PUT", "PATCH", "DELETE"):
            return bool(request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser))

        return False
