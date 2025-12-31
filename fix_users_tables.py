
import os
import django
from django.core.management import call_command

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
django.setup()

print("Resetting users app migration history to zero...")
try:
    call_command('migrate', '--fake', 'users', 'zero')
    print("Success.")
except Exception as e:
    print(f"Warning: {e}")

print("\nRunning users migrations to create tables...")
try:
    call_command('migrate', 'users')
    print("Migration successful!")
except Exception as e:
    print(f"Migration error: {e}")
