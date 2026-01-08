from organization.models import Organization
from django.contrib.auth.models import User

# Check for duplicate organizations
orgs = Organization.objects.filter(email="rafay@gmail.com")
print(f"Found {orgs.count()} organizations with rafay@gmail.com:")
for org in orgs:
    print(f"  - ID: {org.id}, Name: {org.name}, Email: {org.email}")

# Keep only the one named "Rafay", delete others
rafay_org = Organization.objects.filter(name="Rafay", email="rafay@gmail.com").first()
if rafay_org:
    print(f"\nKeeping organization: {rafay_org.name} (ID: {rafay_org.id})")
    # Delete other organizations with same email
    Organization.objects.filter(email="rafay@gmail.com").exclude(id=rafay_org.id).delete()
    print("Deleted duplicate organizations")
else:
    print("No organization named 'Rafay' found")

# Verify final state
print(f"\nFinal count: {Organization.objects.count()} organizations")
for org in Organization.objects.all():
    print(f"  - {org.name} ({org.email})")

print(f"\nUsers: {User.objects.filter(is_superuser=False).count()}")
for user in User.objects.filter(is_superuser=False):
    print(f"  - {user.username} ({user.email})")
