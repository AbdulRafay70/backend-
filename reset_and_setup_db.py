"""
Script to:
1. Delete all data from all tables in the database
2. Create a single organization named "saer.pk"
3. Create a user "admin@gmail.com" with password "admin123"
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.db import connection
from django.contrib.auth.models import Group
from users.models import User
from organization.models import Organization

def delete_all_data():
    """Delete all data from all tables while preserving schema"""
    print("🗑️  Deleting all data from database...")
    
    with connection.cursor() as cursor:
        # Disable foreign key checks
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
        
        # Get all table names
        cursor.execute("SHOW TABLES;")
        tables = cursor.fetchall()
        
        # Truncate each table
        for table in tables:
            table_name = table[0]
            try:
                cursor.execute(f"TRUNCATE TABLE `{table_name}`;")
                print(f"   ✓ Truncated table: {table_name}")
            except Exception as e:
                print(f"   ✗ Error truncating {table_name}: {e}")
        
        # Re-enable foreign key checks
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    
    print("✅ All data deleted successfully!\n")

def create_organization_and_user():
    """Create organization 'saer.pk' and user 'admin@gmail.com'"""
    print("🏢 Creating organization 'saer.pk'...")
    
    # Create organization
    org = Organization.objects.create(
        name="saer.pk",
        email="admin@saer.pk",
        phone_number="+92-300-1234567",
        address="Karachi, Pakistan"
    )
    print(f"   ✓ Organization created: {org.name} (ID: {org.id})\n")
    
    print("👤 Creating user 'admin@gmail.com'...")
    
    # Get or create Admin group
    admin_group, created = Group.objects.get_or_create(name='Admin')
    if created:
        print(f"   ✓ Created 'Admin' group")
    
    # Create user
    user = User.objects.create_user(
        username="admin@gmail.com",
        email="admin@gmail.com",
        password="admin123",
        first_name="Admin",
        last_name="User",
        is_staff=True,
        is_superuser=True,
        is_active=True
    )
    
    # Link user to organization (ManyToMany relationship)
    org.user.add(user)
    
    # Add user to Admin group
    user.groups.add(admin_group)
    
    print(f"   ✓ User created: {user.email}")
    print(f"   ✓ Username: {user.username}")
    print(f"   ✓ Password: admin123")
    print(f"   ✓ Organization: {org.name}")
    print(f"   ✓ Is Superuser: {user.is_superuser}")
    print(f"   ✓ Is Staff: {user.is_staff}")
    print(f"   ✓ Groups: {', '.join([g.name for g in user.groups.all()])}")
    
    print("\n✅ Setup completed successfully!")
    print("\n📋 Login Credentials:")
    print("   Email: admin@gmail.com")
    print("   Password: admin123")


if __name__ == "__main__":
    print("=" * 60)
    print("DATABASE RESET AND SETUP SCRIPT")
    print("=" * 60)
    print()
    
    # Step 1: Delete all data
    delete_all_data()
    
    # Step 2: Create organization and user
    create_organization_and_user()
    
    print("\n" + "=" * 60)
    print("SCRIPT COMPLETED")
    print("=" * 60)
