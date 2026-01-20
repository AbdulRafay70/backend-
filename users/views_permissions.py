"""
User Permissions API Endpoint
Returns all permissions for the current authenticated user
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_permissions(request):
    """
    Get all permissions for the current user
    Returns array of permission codenames
    """
    user = request.user
    
    # Get all permissions from user's groups
    permissions = set()
    
    # Get permissions from all groups user belongs to
    for group in user.groups.all():
        for perm in group.permissions.all():
            permissions.add(perm.codename)
    
    # Convert to sorted list
    permissions_list = sorted(list(permissions))
    
    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser  # Added for superuser detection
        },
        'permissions': permissions_list,
        'groups': [g.name for g in user.groups.all()],
        'total_permissions': len(permissions_list)
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """
    Get current user details
    """
    user = request.user
    
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'is_staff': user.is_staff,
        'groups': [g.name for g in user.groups.all()]
    })
