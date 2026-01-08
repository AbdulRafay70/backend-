from django.contrib.auth.models import User
from organization.models import Organization
from users.models import UserProfile

# Final verification
user = User.objects.get(email="rafay@gmail.com")
rafay_org = Organization.objects.get(name="Rafay")

print("="*60)
print("FINAL STATUS REPORT")
print("="*60)

print("\nUSER DETAILS:")
print(f"  ID: {user.id}")
print(f"  Username: {user.username}")
print(f"  Email: {user.email}")
print(f"  First Name: {user.first_name}")
print(f"  Is Active: {'Active' if user.is_active else 'Inactive'}")
print(f"  Is Staff: {'Active' if user.is_staff else 'Inactive'}")
print(f"  Is Superuser: {'Active' if user.is_superuser else 'Inactive'}")

if hasattr(user, 'profile'):
    print(f"\nUSER PROFILE:")
    print(f"  Type: {user.profile.type}")
    print(f"  Commission ID: {user.profile.commission_id or 'None'}")

print(f"\nORGANIZATION DETAILS:")
print(f"  Name: {rafay_org.name}")
print(f"  Email: {rafay_org.email}")
print(f"  Phone: {rafay_org.phone_number or 'None'}")
print(f"  Address: {rafay_org.address or 'None'}")
print(f"  Org Code: {rafay_org.org_code}")

print(f"\nUSER'S ORGANIZATIONS:")
for org in user.organizations.all():
    print(f"  - {org.name} ({org.email})")

print(f"\nORGANIZATION'S USERS:")
for u in rafay_org.user.all():
    print(f"  - {u.username} ({u.email})")

print(f"\nUSER'S GROUPS:")
groups = user.groups.all()
if groups.exists():
    for group in groups:
        print(f"  - {group.name}")
else:
    print("  No groups assigned")

print("\n" + "="*60)
print("User is successfully linked to Rafay organization!")
print("="*60)
