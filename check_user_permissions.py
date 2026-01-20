"""
Script to check user groups and permissions
Run with: python check_user_permissions.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def main():
    print('\n🔍 Checking user permissions...\n', flush=True)

    try:
        # Find test@gmail.com user
        user = User.objects.get(email='test@gmail.com')
        
        print(f'User: {user.email}', flush=True)
        print(f'Username: {user.username}', flush=True)
        print(f'Is Staff: {user.is_staff}', flush=True)
        print(f'Is Superuser: {user.is_superuser}', flush=True)
        
        # Get user's groups
        groups = user.groups.all()
        print(f'\n📋 Groups ({groups.count()}):', flush=True)
        for group in groups:
            print(f'  • {group.name} (ID: {group.id})', flush=True)
            print(f'    Permissions: {group.permissions.count()}', flush=True)
        
        # Get all permissions from groups
        all_perms = set()
        for group in groups:
            for perm in group.permissions.all():
                all_perms.add(perm.codename)
        
        print(f'\n🔑 Total Permissions: {len(all_perms)}', flush=True)
        if all_perms:
            for perm in sorted(all_perms):
                print(f'  • {perm}', flush=True)
        else:
            print('  ⚠️  No permissions found!', flush=True)

    except User.DoesNotExist:
        print('❌ User test@gmail.com not found!', flush=True)
    except Exception as e:
        print(f'❌ Error: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
