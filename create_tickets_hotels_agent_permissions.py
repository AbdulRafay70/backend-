"""
Script to create agent view permissions for Tickets and Hotels.
Run with: python create_tickets_hotels_agent_permissions.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension
from tickets.models import Ticket, Hotels

def main():
    print('\n🔧 Creating agent view permissions for Tickets and Hotels...\n', flush=True)

    try:
        # Get content types
        ticket_content_type = ContentType.objects.get_for_model(Ticket)
        hotel_content_type = ContentType.objects.get_for_model(Hotels)

        created_permissions = []

        # Create Ticket view permission
        print('Creating Ticket view permission...', flush=True)
        ticket_perm, created = Permission.objects.get_or_create(
            codename='view_ticket_agent',
            content_type=ticket_content_type,
            defaults={'name': 'Can view tickets in agent portal'}
        )
        
        if created:
            print(f'  ✅ Created: {ticket_perm.codename}', flush=True)
        else:
            print(f'  ℹ️  Exists: {ticket_perm.codename}', flush=True)

        PermissionExtension.objects.get_or_create(
            permission=ticket_perm,
            defaults={'type': 'view'}
        )
        created_permissions.append({'id': ticket_perm.id, 'codename': ticket_perm.codename, 'name': ticket_perm.name})

        # Create Hotel view permission
        print('\nCreating Hotel view permission...', flush=True)
        hotel_perm, created = Permission.objects.get_or_create(
            codename='view_hotel_agent',
            content_type=hotel_content_type,
            defaults={'name': 'Can view hotels in agent portal'}
        )
        
        if created:
            print(f'  ✅ Created: {hotel_perm.codename}', flush=True)
        else:
            print(f'  ℹ️  Exists: {hotel_perm.codename}', flush=True)

        PermissionExtension.objects.get_or_create(
            permission=hotel_perm,
            defaults={'type': 'view'}
        )
        created_permissions.append({'id': hotel_perm.id, 'codename': hotel_perm.codename, 'name': hotel_perm.name})

        print('\n✅ Successfully created agent view permissions!', flush=True)
        
        print(f'\n📊 Created Permissions ({len(created_permissions)} total):', flush=True)
        for perm in created_permissions:
            print(f'  • {perm["codename"]} - {perm["name"]} (ID: {perm["id"]})', flush=True)

        print(f'\n💡 Note: These are agent view-only permissions.', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
