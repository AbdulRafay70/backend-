"""
Custom permission class for group permission assignment
Allows users to assign permissions to groups if they have assign_permissions_to_groups_admin
BUT only allows them to assign permissions they themselves have
"""
from rest_framework import permissions


class CanAssignGroupPermissions(permissions.BasePermission):
    """
    Custom permission for assigning permissions to groups.
    
    Rules:
    1. Superusers can do anything
    2. Users with 'assign_permissions_to_groups_admin' can assign permissions
    3. Users can only assign permissions they themselves have (prevents privilege escalation)
    """
    
    def has_permission(self, request, view):
        # Superusers bypass all checks
        if request.user.is_superuser:
            return True
        
        # For PATCH/PUT requests to update group permissions
        if request.method in ['PATCH', 'PUT']:
            # Check if user has the assign permission
            portal = 'admin' if request.user.is_staff else 'agent'
            assign_perm = f'auth.assign_permissions_to_groups_{portal}'
            
            if not request.user.has_perm(assign_perm):
                return False
            
            # If updating permissions field, validate user can only assign perms they have
            if 'permissions' in request.data:
                return self._validate_permission_assignment(request)
            
            return True
        
        # For other methods, use standard permission checks
        return True
    
    def _validate_permission_assignment(self, request):
        """
        Validate that user is only assigning permissions they themselves have
        """
        try:
            requested_perm_ids = request.data.get('permissions', [])
            
            # Get all permission IDs the user has (from their groups)
            user_permission_ids = set()
            for group in request.user.groups.all():
                for perm in group.permissions.all():
                    user_permission_ids.add(perm.id)
            
            # Check if all requested permissions are in user's permission set
            for perm_id in requested_perm_ids:
                if perm_id not in user_permission_ids:
                    # User trying to assign a permission they don't have
                    return False
            
            return True
            
        except Exception as e:
            print(f"Error validating permission assignment: {e}")
            return False


class CanManageGroups(permissions.BasePermission):
    """
    Permission for general group management (view, add, edit, delete)
    """
    
    def has_permission(self, request, view):
        # Superusers bypass all checks
        if request.user.is_superuser:
            return True
        
        portal = 'admin' if request.user.is_staff else 'agent'
        
        # Map HTTP methods to permission actions
        action_map = {
            'GET': 'view',
            'POST': 'add',
            'PUT': 'edit',
            'PATCH': 'edit',
            'DELETE': 'delete'
        }
        
        action = action_map.get(request.method, 'view')
        permission_codename = f'{action}_groups_{portal}'
        
        return request.user.has_perm(f'auth.{permission_codename}')
