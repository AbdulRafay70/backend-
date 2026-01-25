import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from packages.models import UmrahPackage

def delete_all_packages():
    count, _ = UmrahPackage.objects.all().delete()
    print(f"Deleted {count} packages.")

if __name__ == "__main__":
    delete_all_packages()
