"""
Quick script to assign Employee Agent Portal Access permission to a user
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import User, Permission

# Get the user
email = 'aqib@gmail.com'
try:
    user = User.objects.get(email=email)
    print(f"✅ Found user: {user.username} ({user.email})")
except User.DoesNotExist:
    print(f"❌ User with email {email} not found!")
    exit(1)

# Get the permission
try:
    perm = Permission.objects.get(codename='employee_agent_portal_access')
    print(f"✅ Found permission: {perm.name} (codename: {perm.codename})")
except Permission.DoesNotExist:
    print(f"❌ Permission 'employee_agent_portal_access' not found!")
    print("Run: python manage.py setup_permissions")
    exit(1)

# Assign permission to user
user.user_permissions.add(perm)
print(f"✅ Assigned permission '{perm.name}' to user {user.email}")

# Verify
if user.has_perm(f'{perm.content_type.app_label}.{perm.codename}'):
    print(f"✅ Verification successful! User {user.email} now has agent portal access")
else:
    print(f"⚠️  Warning: Permission assignment may not have worked correctly")

print("\n✨ Done! User can now access the agent panel.")
