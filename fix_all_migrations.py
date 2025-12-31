
import os
import django
from django.core.management import call_command

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
django.setup()

# List of all apps that likely have existing tables
apps_to_fake = [
    'admin', 'auth', 'contenttypes', 'sessions',
    'area_leads', 'blog', 'booking', 'commissions',
    'customers', 'finance', 'forms', 'hr', 'leads',
    'ledger', 'logs', 'operations', 'organization',
    'packages', 'passport_leads', 'pax_movements',
    'promotion_center', 'tickets', 'universal', 'users'
]

print("Step 1: Faking migrations for apps with existing tables...")
for app in apps_to_fake:
    try:
        print(f"  Faking {app}...")
        call_command('migrate', '--fake', app)
    except Exception as e:
        print(f"  Warning for {app}: {e}")

print("\nStep 2: Running migrate to create any missing tables...")
try:
    call_command('migrate')
    print("Migration successful!")
except Exception as e:
    print(f"Migration error: {e}")
