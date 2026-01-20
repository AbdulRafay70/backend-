"""
Script to verify blog permissions were created.
Run with: python verify_blog_permissions.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission

def main():
    print('\n📊 Verifying Blog Permissions...\n', flush=True)

    try:
        # Check for blog permissions
        blog_perms = Permission.objects.filter(codename__contains='blog_admin')
        print(f'✅ Blog Permissions: {blog_perms.count()}', flush=True)
        for perm in blog_perms:
            print(f'   • {perm.codename} - {perm.name} (ID: {perm.id})', flush=True)

        if blog_perms.count() == 0:
            print('❌ No blog permissions found!', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
