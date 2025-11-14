import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
django.setup()

from django.contrib.auth.models import User
from django.db import connection

print("=" * 60)
print("SEARCHING FOR ADMIN USER: abc@gmail.com")
print("=" * 60)

# Search by email
try:
    user = User.objects.get(email="abc@gmail.com")
    print(f"\n✓ Found User:")
    print(f"  ID: {user.id}")
    print(f"  Username: {user.username}")
    print(f"  Email: {user.email}")
    print(f"  First Name: {user.first_name}")
    print(f"  Last Name: {user.last_name}")
    print(f"  Is Staff: {user.is_staff}")
    print(f"  Is Superuser: {user.is_superuser}")
    print(f"  Is Active: {user.is_active}")
    print(f"  Date Joined: {user.date_joined}")
    print(f"  Last Login: {user.last_login}")
    print(f"\n  Password Hash: {user.password[:50]}...")
    
except User.DoesNotExist:
    print("\n✗ No user found with email: abc@gmail.com")
    print("\nSearching for any admin/superuser accounts...")
    
    superusers = User.objects.filter(is_superuser=True)
    if superusers.exists():
        print(f"\nFound {superusers.count()} superuser(s):")
        for su in superusers:
            print(f"\n  Username: {su.username}")
            print(f"  Email: {su.email}")
            print(f"  ID: {su.id}")
    else:
        print("\n✗ No superusers found in database")
    
    staff_users = User.objects.filter(is_staff=True)
    if staff_users.exists():
        print(f"\nFound {staff_users.count()} staff user(s):")
        for staff in staff_users[:5]:  # Show first 5
            print(f"\n  Username: {staff.username}")
            print(f"  Email: {staff.email}")
            print(f"  Is Superuser: {staff.is_superuser}")

# Also search in database directly
print("\n" + "=" * 60)
print("DIRECT DATABASE QUERY")
print("=" * 60)

with connection.cursor() as cursor:
    cursor.execute("""
        SELECT id, username, email, first_name, last_name, 
               is_staff, is_superuser, is_active 
        FROM auth_user 
        WHERE email LIKE '%abc%' OR username LIKE '%abc%'
    """)
    results = cursor.fetchall()
    
    if results:
        print(f"\nFound {len(results)} matching user(s):")
        for row in results:
            print(f"\n  ID: {row[0]}")
            print(f"  Username: {row[1]}")
            print(f"  Email: {row[2]}")
            print(f"  Name: {row[3]} {row[4]}")
            print(f"  Staff: {row[5]}, Superuser: {row[6]}, Active: {row[7]}")
    else:
        print("\n✗ No users found with 'abc' in email or username")

print("\n" + "=" * 60)
