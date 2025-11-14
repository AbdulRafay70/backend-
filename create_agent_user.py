import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')

try:
    django.setup()
except Exception as e:
    print(f"Failed to setup Django: {e}")
    exit(1)

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from users.models import UserProfile
from organization.models import Organization

User = get_user_model()

def create_agent_user():
    username = 'agent'
    email = 'agent@panel.com'
    password = 'agent123'  # Change this to a secure password
    first_name = 'Agent'
    last_name = 'User'

    # Check if user already exists
    if User.objects.filter(username=username).exists():
        print(f"User '{username}' already exists. Updating email and ensuring superuser status.")
        user = User.objects.get(username=username)
        user.email = email
        user.is_staff = True
        user.is_superuser = True
        user.save()
        # Assign to agent group
        try:
            agent_group = Group.objects.get(name='agent')
        except Group.DoesNotExist:
            agent_group = Group.objects.create(name='agent')
        user.groups.add(agent_group)
        # Ensure UserProfile exists and set type to 'agent'
        profile, created = UserProfile.objects.get_or_create(user=user)
        profile.type = 'agent'
        profile.save()

        # Attach the user to the first available organization if not already attached
        try:
            first_org = Organization.objects.first()
            if first_org and not user.organizations.filter(id=first_org.id).exists():
                user.organizations.add(first_org)
                print(f"Assigned user '{username}' to organization {first_org.id}")
        except Exception:
            pass
        print(f"User '{username}' updated and assigned to 'agent' group.")
        return

    # Create the user
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        is_staff=True,  # Allow access to admin panel
        is_superuser=True,  # Give full admin access
        is_active=True
    )

    # Optionally assign to a group (if 'agent' group exists)
    try:
        agent_group = Group.objects.get(name='agent')
        user.groups.add(agent_group)
        print(f"Assigned user '{username}' to 'agent' group.")
    except Group.DoesNotExist:
        # Create the agent group if it doesn't exist
        agent_group = Group.objects.create(name='agent')
        user.groups.add(agent_group)
        print(f"Created 'agent' group and assigned user '{username}' to it.")

    # Create or update UserProfile and set type to 'agent'
    try:
        profile, created = UserProfile.objects.get_or_create(user=user)
        profile.type = 'agent'
        profile.save()
        print(f"UserProfile created/updated for '{username}' with type 'agent'.")
    except Exception as e:
        print(f"Failed to create/update UserProfile: {e}")

    # Attach the user to the first available organization if possible
    try:
        first_org = Organization.objects.first()
        if first_org:
            user.organizations.add(first_org)
            print(f"Assigned user '{username}' to organization {first_org.id}")
    except Exception as e:
        print(f"Failed to assign organization: {e}")

    print(f"Agent user created successfully!")
    print(f"Username: {username}")
    print(f"Password: {password}")
    print(f"Email: {email}")
    print("You can now login to the admin panel with these credentials.")

if __name__ == '__main__':
    create_agent_user()