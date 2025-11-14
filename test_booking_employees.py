import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from organization.models import Employee

print("=" * 70)
print("EMPLOYEES THAT WILL SHOW IN BOOKING DROPDOWN")
print("=" * 70)

emps = Employee.objects.filter(
    user__isnull=False
).select_related('user', 'agency', 'agency__branch', 'agency__branch__organization')

print(f"\nTotal employees with users: {emps.count()}\n")

for e in emps:
    print(f"{e.employee_code} - {e.full_name}")
    print(f"  Email: {e.email}")
    print(f"  User: {e.user.username}")
    print(f"  Agency: {e.agency.name if e.agency else 'N/A'}")
    print(f"  Branch: {e.branch.name if e.branch else 'N/A'}")
    print(f"  Org: {e.organization.name if e.organization else 'N/A'}")
    print()

print("=" * 70)
