from organization.models import Organization
from django.contrib.auth.models import User
from users.models import UserProfile, GroupExtension

# Get the user
user = User.objects.filter(email="rafay@gmail.com").first()
if not user:
    print("User not found!")
    exit()

print(f"Found user: {user.username} (ID: {user.id})")

# Get the Rafay organization
rafay_org = Organization.objects.filter(name="Rafay").first()
if not rafay_org:
    print("Rafay organization not found!")
    exit()

print(f"Found organization: {rafay_org.name} (ID: {rafay_org.id})")

# Link user to organization
rafay_org.user.add(user)
print(f"✓ Linked {user.username} to {rafay_org.name}")

# Verify the link
if user in rafay_org.user.all():
    print(f"✓ Verification successful: {user.username} is now part of {rafay_org.name}")
else:
    print("❌ Verification failed")

# Show organization details
print(f"\nOrganization Details:")
print(f"  Name: {rafay_org.name}")
print(f"  Email: {rafay_org.email}")
print(f"  Phone: {rafay_org.phone_number}")
print(f"  Address: {rafay_org.address}")
print(f"  Users: {rafay_org.user.count()}")
for u in rafay_org.user.all():
    print(f"    - {u.username} ({u.email})")

# Show user's groups
print(f"\nUser's Groups:")
for group in user.groups.all():
    print(f"  - {group.name}")
    # Check if group has organization link
    if hasattr(group, 'extended'):
        print(f"    Organization: {group.extended.organization.name}")
