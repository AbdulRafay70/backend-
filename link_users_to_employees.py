import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from organization.models import Employee
from users.models import User

print("=" * 70)
print("LINKING USERS TO EMPLOYEES")
print("=" * 70)

# Get employee without user
emp = Employee.objects.filter(user__isnull=True).first()

if emp:
    print(f"\nEmployee without user: {emp.full_name} ({emp.employee_code})")
    print(f"Email: {emp.email}")
    
    # Create user for this employee
    username = emp.email.split('@')[0]  # Use email prefix as username
    
    # Check if user already exists
    existing_user = User.objects.filter(username=username).first()
    if existing_user:
        print(f"User '{username}' already exists, linking to employee...")
        emp.user = existing_user
        emp.save()
        print(f"✓ Linked employee to existing user: {existing_user.username}")
    else:
        # Create new user
        user = User.objects.create_user(
            username=username,
            email=emp.email,
            password='password123',  # Default password
            first_name=emp.first_name,
            last_name=emp.last_name
        )
        emp.user = user
        emp.save()
        print(f"✓ Created new user: {user.username}")
        print(f"✓ Linked to employee: {emp.employee_code}")
        print(f"  Password: password123 (please change after first login)")
else:
    print("\n✓ All employees have linked user accounts!")

print("\n" + "=" * 70)
print("EMPLOYEE-USER SUMMARY")
print("=" * 70)

for employee in Employee.objects.all():
    user_info = f"{employee.user.username}" if employee.user else "NO USER"
    print(f"{employee.employee_code} - {employee.full_name}: {user_info}")

print("\n" + "=" * 70)
