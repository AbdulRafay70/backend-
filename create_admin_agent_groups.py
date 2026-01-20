"""
Script to create Admin and Agent groups with login permissions.
Run with: python create_admin_agent_groups.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from users.models import GroupExtension, PermissionExtension
from organization.models import Organization

def main():
    print('\n🔧 Creating Admin and Agent groups with login permissions...\n', flush=True)

    try:
        # Get the first organization or create a default one
        organization = Organization.objects.first()
        if not organization:
            print('❌ No organization found in database. Please create an organization first.', flush=True)
            return

        print(f'ℹ️  Using organization: {organization.name} (ID: {organization.id})', flush=True)

        # Get or create content type for auth/user (for login permissions)
        from django.contrib.auth.models import User
        user_content_type = ContentType.objects.get_for_model(User)

        # Create login permissions
        admin_login_perm, created = Permission.objects.get_or_create(
            codename='admin_portal_access',
            name='Can access admin portal',
            content_type=user_content_type
        )
        if created:
            print(f'✅ Created permission: {admin_login_perm.name} ({admin_login_perm.codename})', flush=True)
        else:
            print(f'ℹ️  Permission already exists: {admin_login_perm.name}', flush=True)

        agent_login_perm, created = Permission.objects.get_or_create(
            codename='agent_portal_access',
            name='Can access agent portal',
            content_type=user_content_type
        )
        if created:
            print(f'✅ Created permission: {agent_login_perm.name} ({agent_login_perm.codename})', flush=True)
        else:
            print(f'ℹ️  Permission already exists: {agent_login_perm.name}', flush=True)

        # Create permission extensions
        admin_perm_ext, created = PermissionExtension.objects.get_or_create(
            permission=admin_login_perm,
            defaults={'type': 'login'}
        )
        if created:
            print(f'✅ Created permission extension for admin login', flush=True)

        agent_perm_ext, created = PermissionExtension.objects.get_or_create(
            permission=agent_login_perm,
            defaults={'type': 'login'}
        )
        if created:
            print(f'✅ Created permission extension for agent login', flush=True)

        # Create Admin group
        admin_group, created = Group.objects.get_or_create(name='Admin')
        if created:
            print(f'\n✅ Created group: Admin', flush=True)
        else:
            print(f'\nℹ️  Group already exists: Admin', flush=True)

        # Add admin login permission to Admin group
        admin_group.permissions.add(admin_login_perm)
        print(f'✅ Added admin_portal_access permission to Admin group', flush=True)

        # Create group extension for Admin
        admin_group_ext, created = GroupExtension.objects.get_or_create(
            group=admin_group,
            defaults={
                'organization': organization,
                'type': 'admin'
            }
        )
        if created:
            print(f'✅ Created group extension for Admin', flush=True)

        # Create Agent group
        agent_group, created = Group.objects.get_or_create(name='Agent')
        if created:
            print(f'\n✅ Created group: Agent', flush=True)
        else:
            print(f'\nℹ️  Group already exists: Agent', flush=True)

        # Add agent login permission to Agent group
        agent_group.permissions.add(agent_login_perm)
        print(f'✅ Added agent_portal_access permission to Agent group', flush=True)

        # Create group extension for Agent
        agent_group_ext, created = GroupExtension.objects.get_or_create(
            group=agent_group,
            defaults={
                'organization': organization,
                'type': 'agent'
            }
        )
        if created:
            print(f'✅ Created group extension for Agent', flush=True)

        print('\n✅ Successfully created Admin and Agent groups with login permissions!', flush=True)
        print(f'\n📊 Summary:', flush=True)
        print(f'  • Admin Group ID: {admin_group.id}', flush=True)
        print(f'  • Agent Group ID: {agent_group.id}', flush=True)
        print(f'  • Admin Login Permission: {admin_login_perm.codename}', flush=True)
        print(f'  • Agent Login Permission: {agent_login_perm.codename}', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
