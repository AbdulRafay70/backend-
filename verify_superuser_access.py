
import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from organization.models import Organization, OrganizationLink
from organization.views import OrganizationViewSet, OrganizationLinkViewSet, _user_belongs_to_org

def verify_superuser_access():
    User = get_user_model()
    
    # 1. Setup Test Data
    print("Setting up test data...")
    username = "test_super_access"
    email = "test_super_access@example.com"
    password = "password123"
    
    user, created = User.objects.get_or_create(username=username, email=email)
    user.set_password(password)
    user.is_superuser = True
    user.is_staff = True
    user.save()
    
    # Ensure no assignments
    user.organizations.clear()
    user.branches.clear()
    user.agencies.clear()

    # Create Org A and Org B
    org_a, _ = Organization.objects.get_or_create(name="Access_Org_A")
    org_b, _ = Organization.objects.get_or_create(name="Access_Org_B")
    
    print(f"\nTest: Superuser '{user.username}' with NO assignments")
    
    # 2. Verify Helper
    can_see_a = _user_belongs_to_org(user, org_a.id)
    print(f"  _user_belongs_to_org(Org A): {can_see_a} (Expected: True due to superuser)")
    if can_see_a:
        print("  PASSED: Helper allows superuser access.")
    else:
        print("  FAILED: Helper denied superuser access.")

    # 3. Verify OrganizationViewSet Queryset
    factory = RequestFactory()
    request = factory.get('/api/organizations/')
    request.user = user
    
    view = OrganizationViewSet()
    view.request = request
    view.format_kwarg = None
    
    qs = view.get_queryset()
    count = qs.count()
    print(f"  OrganizationViewSet count: {count} (Expected: >= 2)")
    
    found_a = qs.filter(id=org_a.id).exists()
    found_b = qs.filter(id=org_b.id).exists()
    
    if found_a and found_b:
        print("  PASSED: Superuser sees all organizations.")
    else:
        print("  FAILED: Superuser cannot see all organizations.")

    # 4. Verify OrganizationLinkViewSet Queryset
    # Create a link between A and B
    link = OrganizationLink.objects.create(
        main_organization=org_a,
        link_organization=org_b,
        request_status=True
    )
    
    request_link = factory.get('/api/organization-links/')
    request_link.user = user
    
    view_link = OrganizationLinkViewSet()
    view_link.request = request_link
    view_link.format_kwarg = None
    
    qs_link = view_link.get_queryset()
    print(f"  OrganizationLinkViewSet count: {qs_link.count()} (Expected: >= 1)")
    
    if qs_link.filter(id=link.id).exists():
        print("  PASSED: Superuser sees links between unassigned organizations.")
    else:
        print("  FAILED: Superuser cannot see the link.")

    # 5. Cleanup
    print("\nCleaning up...")
    link.delete()
    user.delete()
    org_a.delete()
    org_b.delete()
    print("Done.")

if __name__ == "__main__":
    verify_superuser_access()
