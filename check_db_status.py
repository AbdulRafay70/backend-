import os
import sys
import django

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from organization.models import Organization
from django.contrib.auth.models import User

print("\n=== Current Database Status ===")
print(f"Organizations: {Organization.objects.count()}")
for org in Organization.objects.all():
    print(f"  - {org.name} ({org.email})")

print(f"\nUsers: {User.objects.filter(is_superuser=False).count()}")
for user in User.objects.filter(is_superuser=False):
    print(f"  - {user.username} ({user.email})")
