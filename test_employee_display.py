import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from organization.models import Employee

print("=" * 70)
print("EMPLOYEE DISPLAY TEST FOR BOOKING ADMIN")
print("=" * 70)

employees = Employee.objects.select_related('agency', 'agency__branch', 'agency__branch__organization').all()

print(f"\nTotal Employees: {employees.count()}")
print("\nEmployee List (as they will appear in booking form):")
print("-" * 70)

for emp in employees:
    print(f"\n{emp}")  # This will use the __str__ method
    print(f"  → User: {emp.user.username if emp.user else 'No user linked'}")
    print(f"  → Agency: {emp.agency.name if emp.agency else 'N/A'}")
    print(f"  → Branch: {emp.branch.name if emp.branch else 'N/A'}")
    print(f"  → Organization: {emp.organization.name if emp.organization else 'N/A'}")

print("\n" + "=" * 70)
print("✓ Employee display test complete!")
print("=" * 70)
