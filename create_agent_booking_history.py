"""
Script to create agent Booking History permission.
1 view permission
Run with: python create_agent_booking_history.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission, Group
from django.contrib.contenttypes.models import ContentType
from users.models import PermissionExtension

def main():
    print('\n🔧 Creating agent Booking History permission...\n', flush=True)

    try:
        # Use Group content type
        group_content_type = ContentType.objects.get_for_model(Group)

        # Booking History - 1 view permission
        print('Creating Booking History permission for agent...', flush=True)
        perm, created = Permission.objects.get_or_create(
            codename='view_booking_history_agent',
            content_type=group_content_type,
            defaults={'name': 'Can view booking history in agent portal'}
        )
        if created:
            print(f'  ✅ Created: {perm.codename} (ID: {perm.id})', flush=True)
        else:
            print(f'  ℹ️  Exists: {perm.codename} (ID: {perm.id})', flush=True)
        PermissionExtension.objects.get_or_create(permission=perm, defaults={'type': 'view'})

        print(f'\n✅ Successfully created agent Booking History permission!', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
