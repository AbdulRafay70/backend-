import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth import get_user_model
from users.models import UserProfile

User = get_user_model()

# Create super admin user
email = "admin@gmail.com"
username = "admin@gmail.com"
password = "123"

# Check if user already exists
if User.objects.filter(email=email).exists():
    print(f"User with email {email} already exists. Updating...")
    user = User.objects.get(email=email)
    user.set_password(password)
    user.is_staff = True
    user.is_superuser = True
    user.is_active = True
    user.save()
    print(f"Updated existing user: {email}")
else:
    # Create new user
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name="Super",
        last_name="Admin",
        is_staff=True,
        is_superuser=True,
        is_active=True
    )
    print(f"Created new super admin user: {email}")

# Create or update user profile
profile, created = UserProfile.objects.get_or_create(user=user)
profile.type = 'superadmin'
profile.save()

if created:
    print(f"Created user profile with type: superadmin")
else:
    print(f"Updated user profile with type: superadmin")

print("\n" + "="*50)
print("Super Admin User Created Successfully!")
print("="*50)
print(f"Email: {email}")
print(f"Username: {username}")
print(f"Password: {password}")
print(f"Type: superadmin")
print(f"Is Staff: True")
print(f"Is Superuser: True")
print(f"Is Active: True")
print("="*50)
print("\nYou can now login to the admin panel at:")
print("http://localhost:8000/admin/")
print("Or the React admin panel at:")
print("http://localhost:5173/ (or http://localhost:3000/)")
