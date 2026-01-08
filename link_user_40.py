from django.contrib.auth.models import User
from organization.models import Organization
from users.models import UserProfile

# Try to find user by ID 40
try:
    user = User.objects.get(id=40)
    print(f"Found user ID 40: {user.username} ({user.email})")
    print(f"  First name: {user.first_name}")
    print(f"  Is active: {user.is_active}")
    print(f"  Is staff: {user.is_staff}")
    print(f"  Is superuser: {user.is_superuser}")
    
    # Check profile
    if hasattr(user, 'profile'):
        print(f"  Profile type: {user.profile.type}")
        print(f"  Commission ID: {user.profile.commission_id}")
    
    # Check organizations
    orgs = user.organizations.all()
    print(f"  Organizations: {orgs.count()}")
    for org in orgs:
        print(f"    - {org.name}")
    
    # Now link to Rafay organization
    rafay_org = Organization.objects.filter(name="Rafay").first()
    if rafay_org:
        rafay_org.user.add(user)
        print(f"\nLinked user to {rafay_org.name}")
        
        # Verify
        orgs = user.organizations.all()
        print(f"Updated organizations: {orgs.count()}")
        for org in orgs:
            print(f"  - {org.name} ({org.email})")
    else:
        print("Rafay organization not found!")
        
except User.DoesNotExist:
    print("User with ID 40 not found")
    print("\nAll users in database:")
    for u in User.objects.all():
        print(f"  ID {u.id}: {u.username} ({u.email}) - Superuser: {u.is_superuser}")
