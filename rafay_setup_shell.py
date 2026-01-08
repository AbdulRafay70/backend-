from organization.models import Organization
from django.contrib.auth.models import User, Group
from users.models import UserProfile, GroupExtension

# Delete all organizations
print(f"Deleting {Organization.objects.count()} organizations...")
Organization.objects.all().delete()

# Delete all regular users
regular_users = User.objects.filter(is_superuser=False)
print(f"Deleting {regular_users.count()} users...")
regular_users.delete()

# Delete all groups
print(f"Deleting {Group.objects.count()} groups...")
Group.objects.all().delete()

# Create Rafay organization
rafay_org = Organization.objects.create(
    name="Rafay",
    email="rafay@gmail.com",
    phone_number="+92-300-1234567",
    address="Rafay Office, Karachi, Pakistan"
)
print(f"Created organization: {rafay_org.name}")


# Create admin user
admin_user = User.objects.create_user(
    username="rafay_admin",
    email="rafay@gmail.com",
    password="admin@123",
    first_name="Rafay",
    last_name="Admin",
    is_staff=True,
    is_active=True
)
print(f"Created user: {admin_user.username}")

# Create user profile
UserProfile.objects.create(user=admin_user, type="admin")
print("Created user profile")

# Create admin group
admin_group = Group.objects.create(name="Rafay_Admin")
print(f"Created group: {admin_group.name}")

# Link group to organization
GroupExtension.objects.create(group=admin_group, organization=rafay_org, type="admin")
print("Linked group to organization")

# Add user to group
admin_user.groups.add(admin_group)
print(f"Added user to group")

print("\n" + "="*60)
print("✓ SETUP COMPLETE!")
print("="*60)
print("Login: rafay@gmail.com / admin@123")
print("="*60)
