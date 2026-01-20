from rest_framework import permissions


class HasPermission(permissions.BasePermission):
    """
    Custom permission class to check if user has a specific permission.
    Usage: permission_classes = [HasPermission]
    Set required_permission on the view.
    """
    
    def has_permission(self, request, view):
        # Allow superusers full access
        if request.user and request.user.is_superuser:
            return True
        
        # Get required permission from view
        required_permission = getattr(view, 'required_permission', None)
        if not required_permission:
            return True  # No permission required
        
        # Check if user has the permission
        if request.user and request.user.is_authenticated:
            return request.user.has_perm(required_permission)
        
        return False


class HasAnyPermission(permissions.BasePermission):
    """
    Check if user has ANY of the specified permissions.
    Usage: permission_classes = [HasAnyPermission]
    Set required_permissions (list) on the view.
    """
    
    def has_permission(self, request, view):
        # Allow superusers full access
        if request.user and request.user.is_superuser:
            return True
        
        # Get required permissions from view
        required_permissions = getattr(view, 'required_permissions', [])
        if not required_permissions:
            return True  # No permissions required
        
        # Check if user has any of the permissions
        if request.user and request.user.is_authenticated:
            for perm in required_permissions:
                if request.user.has_perm(perm):
                    return True
        
        return False


class HasAllPermissions(permissions.BasePermission):
    """
    Check if user has ALL of the specified permissions.
    Usage: permission_classes = [HasAllPermissions]
    Set required_permissions (list) on the view.
    """
    
    def has_permission(self, request, view):
        # Allow superusers full access
        if request.user and request.user.is_superuser:
            return True
        
        # Get required permissions from view
        required_permissions = getattr(view, 'required_permissions', [])
        if not required_permissions:
            return True  # No permissions required
        
        # Check if user has all permissions
        if request.user and request.user.is_authenticated:
            return all(request.user.has_perm(perm) for perm in required_permissions)
        
        return False


class PermissionByAction(permissions.BasePermission):
    """
    Permission class that checks different permissions based on the action.
    Usage: permission_classes = [PermissionByAction]
    Set permission_map on the view:
    permission_map = {
        'list': 'app.view_model',
        'retrieve': 'app.view_model',
        'create': 'app.add_model',
        'update': 'app.change_model',
        'partial_update': 'app.change_model',
        'destroy': 'app.delete_model',
    }
    """
    
    def has_permission(self, request, view):
        # Allow superusers full access
        if request.user and request.user.is_superuser:
            return True
        
        # Get permission map from view
        permission_map = getattr(view, 'permission_map', {})
        if not permission_map:
            return True  # No permissions configured
        
        # Get the action
        action = getattr(view, 'action', None)
        if not action:
            return True  # No action specified
        
        # Get required permission for this action
        required_permission = permission_map.get(action)
        if not required_permission:
            return True  # No permission required for this action
        
        # Check if user has the permission
        if request.user and request.user.is_authenticated:
            # Support both single permission and list of permissions (OR logic)
            if isinstance(required_permission, list):
                # If it's a list, check if user has ANY of the permissions
                return any(request.user.has_perm(perm) for perm in required_permission)
            else:
                # Single permission string
                return request.user.has_perm(required_permission)
        
        return False
