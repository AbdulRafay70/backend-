"""
Custom authentication backend to allow login with email instead of username.
"""
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models import User


class EmailBackend(ModelBackend):
    """
    Authenticate using email address instead of username.
    Falls back to username if email authentication fails.
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        # Try to get the email from kwargs first (for explicit email param)
        email = kwargs.get('email')
        
        # Debug logging
        print(f"[EmailBackend] authenticate called with:")
        print(f"  - request: {request}")
        print(f"  - username: {username}")
        print(f"  - password: {'***' if password else None}")
        print(f"  - kwargs: {kwargs}")
        
        # If no explicit email, treat username as potential email
        if not email and username:
            email = username
        
        if email:
            try:
                # Try to find user by email
                user = User.objects.get(email=email)
                print(f"[EmailBackend] Found user by email: {user.email}")
                if user.check_password(password):
                    print(f"[EmailBackend] Password check passed!")
                    return user
                else:
                    print(f"[EmailBackend] Password check failed!")
            except User.DoesNotExist:
                print(f"[EmailBackend] User not found by email: {email}")
                pass
        
        # Fallback: try username-based authentication
        if username:
            try:
                user = User.objects.get(username=username)
                print(f"[EmailBackend] Found user by username: {user.username}")
                if user.check_password(password):
                    print(f"[EmailBackend] Password check passed!")
                    return user
                else:
                    print(f"[EmailBackend] Password check failed!")
            except User.DoesNotExist:
                print(f"[EmailBackend] User not found by username: {username}")
                pass
        
        print(f"[EmailBackend] Authentication failed - returning None")
        return None
