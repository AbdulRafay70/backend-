"""
Dynamic Permission Engine - Backend
Auto-permission decorator and utilities for automatic permission checking
"""
from functools import wraps
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import BasePermission


class AutoPermissionChecker(BasePermission):
    """
    Automatic permission checker based on resource and action
    """
    def __init__(self, resource_name, action='view'):
        self.resource_name = resource_name
        self.action = action
    
    def has_permission(self, request, view):
        # Superusers bypass all permission checks
        if request.user.is_superuser:
            return True
            
        # Determine portal type from user
        portal = 'admin' if request.user.is_staff else 'agent'
        
        # Build permission codename
        permission_codename = f'{self.action}_{self.resource_name}_{portal}'
        
        # Check permission
        return request.user.has_perm(f'auth.{permission_codename}')


def auto_permission(resource_name, action='view'):
    """
    Decorator for automatic permission checking
    
    Usage:
        @auto_permission('hotel', 'view')
        def hotel_list(request):
            pass
    
    This will automatically check for:
    - view_hotel_admin (if user is admin)
    - view_hotel_agent (if user is agent)
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Superusers bypass all permission checks
            if request.user.is_superuser:
                return view_func(request, *args, **kwargs)
                
            # Determine portal type
            portal = 'admin' if request.user.is_staff else 'agent'
            
            # Build permission codename
            permission_codename = f'{action}_{resource_name}_{portal}'
            
            # Check permission
            if not request.user.has_perm(f'auth.{permission_codename}'):
                return Response({
                    'error': 'Permission denied',
                    'message': f'You do not have permission to {action} {resource_name}',
                    'required_permission': permission_codename
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Permission granted, execute view
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


class AutoPermissionMixin:
    """
    Mixin for ViewSets to automatically handle permissions
    
    Usage:
        class HotelViewSet(AutoPermissionMixin, viewsets.ModelViewSet):
            resource_name = 'hotel'
            queryset = Hotel.objects.all()
            serializer_class = HotelSerializer
    
    This automatically handles all CRUD permissions!
    """
    resource_name = None
    
    def get_permissions(self):
        # Map ViewSet actions to permission actions
        action_map = {
            'list': 'view',
            'retrieve': 'view',
            'create': 'add',
            'update': 'edit',
            'partial_update': 'edit',
            'destroy': 'delete'
        }
        
        # Get permission action for current ViewSet action
        permission_action = action_map.get(self.action, 'view')
        
        # Return auto permission checker
        return [AutoPermissionChecker(self.resource_name, permission_action)()]
    
    def handle_no_permission(self):
        """Custom error response when permission is denied"""
        portal = 'admin' if self.request.user.is_staff else 'agent'
        action_map = {
            'list': 'view',
            'retrieve': 'view',
            'create': 'add',
            'update': 'edit',
            'partial_update': 'edit',
            'destroy': 'delete'
        }
        permission_action = action_map.get(self.action, 'view')
        permission_codename = f'{permission_action}_{self.resource_name}_{portal}'
        
        return Response({
            'error': 'Permission denied',
            'message': f'You do not have permission to {permission_action} {self.resource_name}',
            'required_permission': permission_codename
        }, status=status.HTTP_403_FORBIDDEN)
