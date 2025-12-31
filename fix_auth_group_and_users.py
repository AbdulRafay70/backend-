
import os
import django
from django.db import connection
from django.core.management import call_command

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
django.setup()

print("Fixing auth_group schema...")
with connection.cursor() as cursor:
    try:
        cursor.execute("ALTER TABLE auth_group MODIFY id INT NOT NULL AUTO_INCREMENT PRIMARY KEY")
        print("  Added PK to auth_group")
    except Exception as e:
        print(f"  Warning: {e}")

print("\nResetting users migration history...")
try:
    call_command('migrate', '--fake', 'users', 'zero')
except Exception as e:
    print(f"  Warning: {e}")

print("\nRunning users migrations...")
try:
    call_command('migrate', 'users')
    print("SUCCESS: users tables created!")
except Exception as e:
    print(f"ERROR: {e}")
