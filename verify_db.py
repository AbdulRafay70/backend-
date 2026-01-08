"""
Quick verification script to check the database state
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import User
from organization.models import Organization

print("=" * 60)
print("DATABASE VERIFICATION")
print("=" * 60)
print()

# Check organizations
orgs = Organization.objects.all()
print(f"📊 Total Organizations: {orgs.count()}")
for org in orgs:
    print(f"   • {org.name} (ID: {org.id}, Code: {org.org_code})")
    print(f"     Email: {org.email}")
    print(f"     Phone: {org.phone_number}")
    print(f"     Users: {org.user.count()}")
print()

# Check users
users = User.objects.all()
print(f"👥 Total Users: {users.count()}")
for user in users:
    print(f"   • {user.username} ({user.email})")
    print(f"     Name: {user.first_name} {user.last_name}")
    print(f"     Superuser: {user.is_superuser}")
    print(f"     Staff: {user.is_staff}")
    print(f"     Active: {user.is_active}")
    print(f"     Groups: {', '.join([g.name for g in user.groups.all()])}")
    # Check organizations this user belongs to
    user_orgs = Organization.objects.filter(user=user)
    print(f"     Organizations: {', '.join([o.name for o in user_orgs])}")
print()

print("=" * 60)
print("VERIFICATION COMPLETE")
print("=" * 60)
