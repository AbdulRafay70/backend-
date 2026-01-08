from organization.models import Organization
from django.contrib.auth.models import User

# Get all users and their organizations
users = User.objects.filter(is_superuser=False)
print(f"Total users: {users.count()}")
for user in users:
    print(f"\nUser: {user.username} ({user.email})")
    orgs = user.organizations.all()
    print(f"  Organizations: {orgs.count()}")
    for org in orgs:
        print(f"    - {org.name} ({org.email})")
    
    # Show groups
    groups = user.groups.all()
    print(f"  Groups: {groups.count()}")
    for group in groups:
        print(f"    - {group.name}")

# Get all organizations and their users
print("\n" + "="*60)
orgs = Organization.objects.all()
print(f"Total organizations: {orgs.count()}")
for org in orgs:
    print(f"\nOrganization: {org.name} ({org.email})")
    users_in_org = org.user.all()
    print(f"  Users: {users_in_org.count()}")
    for user in users_in_org:
        print(f"    - {user.username} ({user.email})")
