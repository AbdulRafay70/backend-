from django.contrib.auth.models import User
from organization.models import Organization
from users.models import UserProfile

# Get the rafay user
user = User.objects.filter(email="rafay@gmail.com").first()
if not user:
    print("No user found with rafay@gmail.com")
    exit()

print(f"Found user: {user.username} (ID: {user.id})")
print(f"  Email: {user.email}")
print(f"  First name: {user.first_name}")
print(f"  Is superuser: {user.is_superuser}")
print(f"  Is staff: {user.is_staff}")

# Update user details to match requirements
user.first_name = "Rafay"
user.is_active = True
user.is_staff = True
user.is_superuser = True
user.save()
print("\nUpdated user details")

# Get or create user profile
profile, created = UserProfile.objects.get_or_create(
    user=user,
    defaults={'type': 'admin'}
)
if created:
    print("Created user profile")
else:
    profile.type = 'admin'
    profile.save()
    print("Updated user profile")

# Get Rafay organization
rafay_org = Organization.objects.filter(name="Rafay").first()
if not rafay_org:
    print("Rafay organization not found!")
    exit()

print(f"\nFound organization: {rafay_org.name} (ID: {rafay_org.id})")

# Link user to organization
rafay_org.user.add(user)
print(f"Linked {user.username} to {rafay_org.name}")

# Verify the link
print(f"\nVerification:")
print(f"  User's organizations: {user.organizations.count()}")
for org in user.organizations.all():
    print(f"    - {org.name} ({org.email})")

print(f"  Organization's users: {rafay_org.user.count()}")
for u in rafay_org.user.all():
    print(f"    - {u.username} ({u.email})")

print("\n" + "="*60)
print("SUCCESS: User linked to Rafay organization")
print("="*60)
