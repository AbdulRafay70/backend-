"""
Script to add view_users_admin permission to Add Users section.
Run with: python add_view_users_permission.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension
from django.contrib.auth.models import User

def main():
    print('\n🔧 Adding view_users_admin permission...\n', flush=True)

    try:
        user_content_type = ContentType.objects.get_for_model(User)

        # Create view_users_admin permission
        print('Creating view_users_admin permission...', flush=True)
        users_perm, created = Permission.objects.get_or_create(
            codename='view_users_admin',
            content_type=user_content_type,
            defaults={'name': 'Can view users in admin portal'}
        )
        
        if created:
            print(f'  ✅ Created: {users_perm.codename}', flush=True)
        else:
            print(f'  ℹ️  Exists: {users_perm.codename}', flush=True)

        PermissionExtension.objects.get_or_create(
            permission=users_perm,
            defaults={'type': 'view'}
        )

        print('\n✅ Successfully added view_users_admin permission!', flush=True)
        
        print(f'\n📊 Permission Details:', flush=True)
        print(f'  • Codename: {users_perm.codename}', flush=True)
        print(f'  • Name: {users_perm.name}', flush=True)
        print(f'  • ID: {users_perm.id}', flush=True)

        print(f'\n💡 Add Users section now has 2 permissions:', flush=True)
        print(f'  • view_add_users_admin (view add users page)', flush=True)
        print(f'  • view_users_admin (view users list) ← NEW', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
