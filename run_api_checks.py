import os
import sys
import traceback

# Ensure the Django settings module matches the project's manage.py
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')

try:
    import django
    django.setup()
    # Use DRF's test client so we can force-authenticate a user if needed
    from rest_framework.test import APIClient
    from django.contrib.auth import get_user_model

    client = APIClient()

    # Try to find an existing staff/superuser to authenticate as; otherwise create one.
    User = get_user_model()
    user = User.objects.filter(is_active=True, is_staff=True).first()
    if not user:
        # Create a temporary superuser for the purpose of this check
        username = 'apitest_temp'
        email = 'apitest_temp@example.com'
        try:
            user = User.objects.create_superuser(username=username, email=email, password='temporary-password')
            print(f'Created temporary superuser: {username}')
        except Exception:
            # If creation fails for any reason, try to pick any active user
            traceback.print_exc()
            user = User.objects.filter(is_active=True).first()

    if user:
        client.force_authenticate(user=user)
        print(f'Authenticated as: {getattr(user, "username", str(user))}')
    else:
        print('No user available for authentication; requests will be unauthenticated')

    def do_get(path):
        try:
            # Provide a valid HTTP_HOST to avoid DisallowedHost (test client defaults to 'testserver')
            resp = client.get(path, HTTP_HOST='localhost')
            body = resp.content.decode('utf-8', errors='replace')
            # Limit body length to keep output small
            short = (body[:1000] + '...') if len(body) > 1000 else body
            print(f"GET {path} -> {resp.status_code}\n{short}\n")
        except Exception:
            print(f"GET {path} -> EXCEPTION")
            traceback.print_exc()

    do_get('/api/airlines/')
    do_get('/api/airlines/?organization=11')

except Exception:
    print('Failed to run API checks')
    traceback.print_exc()
    sys.exit(2)
