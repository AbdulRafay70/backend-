"""
Script to create CRUD permissions for Blogs (admin only).
Run with: python create_blog_permissions.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension
from blog.models import Blog

def main():
    print('\n🔧 Creating CRUD permissions for Blogs (Admin only)...\n', flush=True)

    try:
        # Get content type for Blog model
        blog_content_type = ContentType.objects.get_for_model(Blog)

        # Define admin-only permissions for blogs
        permissions_to_create = [
            {
                'codename': 'view_blog_admin',
                'name': 'Can view blogs in admin portal',
                'type': 'view'
            },
            {
                'codename': 'add_blog_admin',
                'name': 'Can add blogs in admin portal',
                'type': 'add'
            },
            {
                'codename': 'edit_blog_admin',
                'name': 'Can edit blogs in admin portal',
                'type': 'edit'
            },
            {
                'codename': 'delete_blog_admin',
                'name': 'Can delete blogs in admin portal',
                'type': 'delete'
            },
        ]

        created_permissions = []

        for perm_data in permissions_to_create:
            # Create or get the permission
            permission, created = Permission.objects.get_or_create(
                codename=perm_data['codename'],
                content_type=blog_content_type,
                defaults={'name': perm_data['name']}
            )
            
            if created:
                print(f'✅ Created permission: {permission.name} ({permission.codename})', flush=True)
            else:
                print(f'ℹ️  Permission already exists: {permission.name} ({permission.codename})', flush=True)

            # Create permission extension
            perm_ext, ext_created = PermissionExtension.objects.get_or_create(
                permission=permission,
                defaults={'type': perm_data['type']}
            )
            
            if ext_created:
                print(f'   ✅ Created permission extension (type: {perm_data["type"]})', flush=True)

            created_permissions.append({
                'id': permission.id,
                'codename': permission.codename,
                'name': permission.name,
                'type': perm_data['type']
            })

        print('\n✅ Successfully created all blog permissions!', flush=True)
        print(f'\n📊 Admin Permissions ({len(created_permissions)} total):', flush=True)
        for perm in created_permissions:
            print(f'  • [{perm["type"].upper()}] {perm["name"]}', flush=True)
            print(f'    Codename: {perm["codename"]} | ID: {perm["id"]}', flush=True)

        print(f'\n💡 Note: These are admin-only permissions. View permission will be automatically checked when add/edit/delete is selected.', flush=True)
        print(f'💡 No agent permissions created for blogs as requested.', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
