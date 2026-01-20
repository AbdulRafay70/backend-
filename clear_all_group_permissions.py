"""
Script to remove all permissions from all groups.
This will clear all group-permission associations.
Run with: python clear_all_group_permissions.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Group

def main():
    print('\n🔧 Clearing all permissions from all groups...\n', flush=True)

    try:
        # Get all groups
        all_groups = Group.objects.all()
        
        print(f'Found {all_groups.count()} groups\n', flush=True)
        
        for group in all_groups:
            perm_count = group.permissions.count()
            print(f'Group: {group.name} - Removing {perm_count} permissions...', flush=True)
            
            # Clear all permissions from this group
            group.permissions.clear()
            
            print(f'  ✅ Cleared all permissions from {group.name}', flush=True)
        
        print(f'\n✅ Successfully cleared all permissions from all groups!', flush=True)
        print(f'📊 Total groups processed: {all_groups.count()}', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
