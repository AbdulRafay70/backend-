from rest_framework.permissions import BasePermission


class IsBranchUser(BasePermission):
    """
    Allow only branch users to create/update leads.
    Branch users are those who have branches assigned or are subagents.
    Organization admins (staff without branches) should NOT be able to create/update leads.
    """
    message = "Only branch users can create or update leads."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        
        # Check if user has branches assigned
        if hasattr(user, 'branches') and user.branches.exists():
            return True
        
        # Check if user is a subagent (branch user type)
        if hasattr(user, 'profile') and user.profile and user.profile.type == 'subagent':
            return True
        
        return False
