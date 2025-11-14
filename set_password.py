import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
django.setup()

from django.contrib.auth.models import User

print("=" * 60)
print("SETTING PASSWORD FOR USER: abc@gmail.com")
print("=" * 60)

try:
    user = User.objects.get(username="abc@gmail.com")
    print(f"\n✓ Found User:")
    print(f"  ID: {user.id}")
    print(f"  Username: {user.username}")
    print(f"  Email: {user.email}")
    print(f"  Old Password Hash: {user.password[:50]}...")

    # Set new password
    user.set_password("12345")
    user.save()

    print(f"\n✓ Password updated successfully!")
    print(f"  New Password Hash: {user.password[:50]}...")

    # Verify by checking password
    from django.contrib.auth import authenticate
    test_user = authenticate(username=user.username, password="12345")
    if test_user:
        print("✓ Password verification successful!")
    else:
        print("✗ Password verification failed!")

except User.DoesNotExist:
    print("\n✗ No user found with username: abc@gmail.com")
except Exception as e:
    print(f"\n✗ Error: {e}")

print("\n" + "=" * 60)