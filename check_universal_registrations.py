"""
Check what's in the UniversalRegistration table to see if there are duplicate emails.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from universal.models import UniversalRegistration

def check_universal_registrations():
    print("=" * 80)
    print("CHECKING UNIVERSAL REGISTRATIONS")
    print("=" * 80)
    
    registrations = UniversalRegistration.objects.all()
    
    print(f"\nTotal registrations: {registrations.count()}")
    
    if registrations.exists():
        print("\nExisting registrations:")
        for reg in registrations:
            print(f"\n  ID: {reg.id}")
            print(f"  Type: {reg.type}")
            print(f"  Name: {reg.name}")
            print(f"  Email: {reg.email}")
            print(f"  Status: {reg.status}")
            print(f"  Created: {reg.created_at}")
    else:
        print("\nNo registrations found in database.")
    
    # Check for duplicate emails
    from django.db.models import Count
    duplicates = UniversalRegistration.objects.values('email').annotate(
        count=Count('email')
    ).filter(count__gt=1)
    
    if duplicates:
        print("\n" + "!" * 80)
        print("DUPLICATE EMAILS FOUND:")
        for dup in duplicates:
            print(f"  Email: {dup['email']} - Used {dup['count']} times")
        print("!" * 80)
    
    print("\n" + "=" * 80)

if __name__ == '__main__':
    check_universal_registrations()
