import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
django.setup()

from django.contrib.auth.models import User
from organization.models import Organization

print("=" * 80)
print("CHECKING ORGANIZATION ASSOCIATIONS")
print("=" * 80)

# Check abc@gmail.com
try:
    abc_user = User.objects.get(username="abc@gmail.com")
    print(f"\n✓ Found abc@gmail.com (ID: {abc_user.id}):")
    print(f"  Organizations: {abc_user.organizations.all().count()}")
    for org in abc_user.organizations.all():
        print(f"    - {org.name} (ID: {org.id})")

    # Check if user has employee profile
    if hasattr(abc_user, 'employee_profile'):
        emp = abc_user.employee_profile
        print(f"  Employee Profile: {emp.first_name} {emp.last_name}")
        print(f"  Agency: {emp.agency.name if emp.agency else 'None'}")
        print(f"  Branch: {emp.agency.branch.name if emp.agency and emp.agency.branch else 'None'}")
        print(f"  Organization: {emp.agency.branch.organization.name if emp.agency and emp.agency.branch else 'None'}")
    else:
        print("  Employee Profile: None")

except User.DoesNotExist:
    print("\n✗ abc@gmail.com not found")

# Check abdulrafay@gmail.com
try:
    abdul_user = User.objects.get(username="abdulrafay@gmail.com")
    print(f"\n✓ Found abdulrafay@gmail.com (ID: {abdul_user.id}):")
    print(f"  Organizations: {abdul_user.organizations.all().count()}")
    for org in abdul_user.organizations.all():
        print(f"    - {org.name} (ID: {org.id})")

    # Check if user has employee profile
    if hasattr(abdul_user, 'employee_profile'):
        emp = abdul_user.employee_profile
        print(f"  Employee Profile: {emp.first_name} {emp.last_name}")
        print(f"  Agency: {emp.agency.name if emp.agency else 'None'}")
        print(f"  Branch: {emp.agency.branch.name if emp.agency and emp.agency.branch else 'None'}")
        print(f"  Organization: {emp.agency.branch.organization.name if emp.agency and emp.agency.branch else 'None'}")
    else:
        print("  Employee Profile: None")

except User.DoesNotExist:
    print("\n✗ abdulrafay@gmail.com not found")

print("\n" + "=" * 80)
print("ALL ORGANIZATIONS IN SYSTEM:")
print("=" * 80)
for org in Organization.objects.all():
    print(f"ID: {org.id} - {org.name}")

print("\n" + "=" * 80)