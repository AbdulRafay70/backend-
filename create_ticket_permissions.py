"""
Script to create CRUD permissions for Tickets (both admin and agent).
Run with: python create_ticket_permissions.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension
from tickets.models import Ticket

def main():
    print('\n🔧 Creating CRUD permissions for Tickets...\n', flush=True)

    try:
        # Get content type for Ticket model
        ticket_content_type = ContentType.objects.get_for_model(Ticket)

        # Define permissions to create
        permissions_to_create = [
            # Admin permissions
            {
                'codename': 'view_ticket_admin',
                'name': 'Can view tickets in admin portal',
                'type': 'view',
                'group': 'admin'
            },
            {
                'codename': 'add_ticket_admin',
                'name': 'Can add tickets in admin portal',
                'type': 'add',
                'group': 'admin'
            },
            {
                'codename': 'edit_ticket_admin',
                'name': 'Can edit tickets in admin portal',
                'type': 'edit',
                'group': 'admin'
            },
            {
                'codename': 'delete_ticket_admin',
                'name': 'Can delete tickets in admin portal',
                'type': 'delete',
                'group': 'admin'
            },
            # Agent permissions
            {
                'codename': 'view_ticket_agent',
                'name': 'Can view tickets in agent portal',
                'type': 'view',
                'group': 'agent'
            },
            {
                'codename': 'book_ticket_agent',
                'name': 'Can book tickets in agent portal',
                'type': 'book',
                'group': 'agent'
            },
        ]

        created_permissions = {
            'admin': [],
            'agent': []
        }

        for perm_data in permissions_to_create:
            # Create or get the permission
            permission, created = Permission.objects.get_or_create(
                codename=perm_data['codename'],
                content_type=ticket_content_type,
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

            created_permissions[perm_data['group']].append({
                'id': permission.id,
                'codename': permission.codename,
                'name': permission.name,
                'type': perm_data['type']
            })

        print('\n✅ Successfully created all ticket permissions!', flush=True)
        
        # Admin permissions summary
        print(f'\n📊 Admin Permissions ({len(created_permissions["admin"])} total):', flush=True)
        for perm in created_permissions['admin']:
            print(f'  • [{perm["type"].upper()}] {perm["name"]}', flush=True)
            print(f'    Codename: {perm["codename"]} | ID: {perm["id"]}', flush=True)

        # Agent permissions summary
        print(f'\n📊 Agent Permissions ({len(created_permissions["agent"])} total):', flush=True)
        for perm in created_permissions['agent']:
            print(f'  • [{perm["type"].upper()}] {perm["name"]}', flush=True)
            print(f'    Codename: {perm["codename"]} | ID: {perm["id"]}', flush=True)

        print(f'\n💡 Note: View permission will be automatically checked when add/edit/delete/book is selected.', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
