import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from organization.models import Employee
from booking.admin import BookingForm

print("=" * 70)
print("TESTING BOOKING FORM EMPLOYEE QUERYSET")
print("=" * 70)

# Create form instance
form = BookingForm()

# Get the employee queryset
employee_qs = form.fields['employee'].queryset

print(f"\nTotal employees in dropdown: {employee_qs.count()}")
print("\nEmployees that will appear in booking form:")
print("-" * 70)

for emp in employee_qs:
    label = form.fields['employee'].label_from_instance(emp)
    print(f"\n{label}")
    print(f"  → Model: {emp.__class__.__name__}")
    print(f"  → Table: {emp._meta.db_table}")
    print(f"  → Employee Code: {emp.employee_code}")
    print(f"  → User: {emp.user.username if emp.user else 'No user'}")

print("\n" + "=" * 70)
print("VERIFICATION")
print("=" * 70)
print(f"✓ Using Employee model from: {Employee._meta.app_label}")
print(f"✓ Database table: {Employee._meta.db_table}")
print(f"✓ Total employees: {employee_qs.count()}")
print("=" * 70)
