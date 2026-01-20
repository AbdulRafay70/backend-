"""
Script to delete all existing groups.
WARNING: This will delete all groups and their permission associations.
Run with: python delete_all_groups.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Group

def main():
    print('\n⚠️  WARNING: This will delete ALL groups!\n', flush=True)
    
    try:
        # Get all groups
        all_groups = Group.objects.all()
        
        print(f'Found {all_groups.count()} groups to delete:\n', flush=True)
        
        for group in all_groups:
            print(f'  • {group.name}', flush=True)
        
        print(f'\nDeleting all groups...', flush=True)
        
        # Delete all groups
        deleted_count, _ = Group.objects.all().delete()
        
        print(f'\n✅ Successfully deleted {deleted_count} groups!', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
