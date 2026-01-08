"""
Check if email exists in UniversalRegistration table.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from universal.models import UniversalRegistration

def check_email_exists():
    email = "abdulrafay7665@gmail.com"
    
    print("=" * 80)
    print(f"CHECKING EMAIL: {email}")
    print("=" * 80)
    
    # Check if email exists
    existing = UniversalRegistration.objects.filter(email=email)
    
    if existing.exists():
        print(f"\n✗ EMAIL ALREADY EXISTS!")
        print(f"  Found {existing.count()} record(s) with this email:\n")
        for record in existing:
            print(f"  - ID: {record.id}")
            print(f"    Type: {record.type}")
            print(f"    Name: {record.name}")
            print(f"    Email: {record.email}")
            print(f"    Status: {record.status}")
            print()
    else:
        print(f"\n✓ Email is available - no conflicts found")
    
    # List all emails
    print("\n" + "=" * 80)
    print("ALL EMAILS IN DATABASE:")
    print("=" * 80)
    all_records = UniversalRegistration.objects.all()
    for record in all_records:
        print(f"  {record.email:40} - {record.type:15} - {record.name}")
    
    print("=" * 80)

if __name__ == '__main__':
    check_email_exists()
