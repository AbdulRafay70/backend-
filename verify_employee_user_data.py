import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from organization.models import Employee
from django.contrib.auth.models import User

print("=" * 70)
print("EMPLOYEE VS USER COMPARISON")
print("=" * 70)

# Get all employees
employees = Employee.objects.all()
print(f"\n📋 EMPLOYEES (from organization_employee table): {employees.count()}")
print("-" * 70)
for emp in employees:
    print(f"  {emp.employee_code} - {emp.full_name}")
    print(f"    Email: {emp.email}")
    print(f"    User: {emp.user.username if emp.user else 'NO USER LINKED'}")
    print(f"    Agency: {emp.agency.name if emp.agency else 'NO AGENCY'}")
    print()

# Get all users
users = User.objects.all()
print(f"\n👤 ALL USERS (from auth_user table): {users.count()}")
print("-" * 70)
for user in users:
    is_employee = hasattr(user, 'employee_profile')
    print(f"  {user.username} ({user.email})")
    print(f"    Is Employee: {'✓ YES' if is_employee else '✗ NO (Admin/Staff)'}")
    if is_employee:
        print(f"    Employee Code: {user.employee_profile.employee_code}")
    print()

print("=" * 70)
print("SUMMARY")
print("=" * 70)
print(f"Total Employees in organization_employee table: {employees.count()}")
print(f"Total Users in auth_user table: {users.count()}")
print(f"Users linked to employees: {User.objects.filter(employee_profile__isnull=False).count()}")
print(f"Users NOT linked to employees (Admins): {User.objects.filter(employee_profile__isnull=True).count()}")
print("=" * 70)
