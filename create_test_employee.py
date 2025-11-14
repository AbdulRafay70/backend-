import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from organization.models import Employee, Agency
from users.models import User
from datetime import date

print("=" * 60)
print("CREATING TEST EMPLOYEE")
print("=" * 60)

# Get first available agency
agency = Agency.objects.first()
if not agency:
    print("ERROR: No agencies found. Please create an agency first.")
    exit(1)

print(f"\nUsing Agency: {agency.name}")

# Create a test user for the employee
try:
    # Check if test user already exists
    user = User.objects.filter(username='test_employee_user').first()
    if user:
        print(f"Using existing user: {user.username}")
    else:
        user = User.objects.create_user(
            username='test_employee_user',
            email='testemployee@example.com',
            password='testpass123'
        )
        print(f"Created new user: {user.username}")

    # Create employee
    employee = Employee.objects.create(
        user=user,
        agency=agency,
        first_name='Test',
        last_name='Employee',
        email='testemployee@example.com',
        phone_number='+923001234567',
        address='123 Test Street, Test City',
        date_of_birth=date(1990, 1, 1),
        position='Sales Executive',
        department='Sales',
        status='active',
        salary=50000.00,
        commission_rate=5.00
    )

    print(f"\n✓ Employee created successfully!")
    print(f"  Employee Code: {employee.employee_code}")
    print(f"  Full Name: {employee.full_name}")
    print(f"  Agency: {employee.agency.name}")
    print(f"  Branch: {employee.branch.name if employee.branch else 'N/A'}")
    print(f"  Organization: {employee.organization.name if employee.organization else 'N/A'}")
    print(f"  Position: {employee.position}")
    print(f"  Department: {employee.department}")
    print(f"  Status: {employee.status}")
    print(f"  Salary: {employee.salary}")
    print(f"  Commission Rate: {employee.commission_rate}%")

    # Test employee count on agency
    print(f"\n✓ Agency '{agency.name}' now has {agency.employees.count()} employee(s)")

except Exception as e:
    print(f"\n✗ Error creating employee: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
