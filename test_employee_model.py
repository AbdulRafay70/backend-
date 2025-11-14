import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from organization.models import Employee, Agency, Branch, Organization
from users.models import User

print("=" * 60)
print("EMPLOYEE MODEL TEST")
print("=" * 60)

# Check if Employee model is accessible
print("\n1. Employee Model Info:")
print(f"   - Model: {Employee._meta.model_name}")
print(f"   - Table: {Employee._meta.db_table}")
print(f"   - App: {Employee._meta.app_label}")

# Count existing employees
employee_count = Employee.objects.count()
print(f"\n2. Existing Employees: {employee_count}")

if employee_count > 0:
    print("\n3. Employee List:")
    for emp in Employee.objects.all()[:5]:
        print(f"   - {emp.employee_code}: {emp.full_name} (Agency: {emp.agency.name})")
        print(f"     Branch: {emp.branch.name if emp.branch else 'N/A'}")
        print(f"     Organization: {emp.organization.name if emp.organization else 'N/A'}")
else:
    print("\n3. No employees found")

# Check agencies
agency_count = Agency.objects.count()
print(f"\n4. Available Agencies: {agency_count}")
if agency_count > 0:
    for agency in Agency.objects.all()[:3]:
        emp_count = agency.employees.count()
        print(f"   - {agency.name}: {emp_count} employees")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)
