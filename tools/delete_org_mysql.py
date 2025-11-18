"""
Delete organization by org_code or name using Django ORM and your current settings (MySQL).
Run from project root with your virtualenv active:

    python tools/delete_org_mysql.py

The script will:
 - initialize Django with `configuration.settings`
 - find Organization by `org_code='ORG-0011'` or name containing 'rafay'
 - print related counts (links, resell requests, branches, agencies)
 - delete the Organization (cascade deletes as configured)
 - print summary after deletion

This is destructive. You confirmed earlier — proceed carefully.
"""

import os
import sys
from pathlib import Path

# Ensure project root is on path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')

try:
    import django
    django.setup()
except Exception as e:
    print("Failed to setup Django:", e)
    sys.exit(2)

from organization.models import Organization, OrganizationLink, ResellRequest, Branch, Agency

TARGET_CODE = 'ORG-0011'
TARGET_NAME_SNIPPET = 'rafay'

def find_org():
    org = Organization.objects.filter(org_code=TARGET_CODE).first()
    if org:
        return org
    org = Organization.objects.filter(name__icontains=TARGET_NAME_SNIPPET).first()
    return org


def print_related_counts(org):
    print(f"Organization: {org} (id={org.id})")
    print("Branches count:", org.branches.count())
    # Agencies are linked to Branch via Agency.branch -> Branch.organization
    try:
        print("Agencies count:", Agency.objects.filter(branch__organization=org).count())
    except Exception:
        # defensive fallback if model relations differ
        print("Agencies count: N/A")
    print("Links where main:", OrganizationLink.objects.filter(main_organization=org).count())
    print("Links where link_organization:", OrganizationLink.objects.filter(link_organization=org).count())
    print("Resell requests sent:", ResellRequest.objects.filter(main_organization=org).count())
    print("Resell requests received:", ResellRequest.objects.filter(link_organization=org).count())


if __name__ == '__main__':
    org = find_org()
    if not org:
        print(f"Organization with org_code='{TARGET_CODE}' or name containing '{TARGET_NAME_SNIPPET}' not found.")
        sys.exit(0)

    print("Found organization. Related counts before deletion:")
    print_related_counts(org)

    # Confirm deletion (user already confirmed earlier)
    try:
        print("Proceeding to delete the organization (this will cascade-delete related FK objects)...")
        org.delete()
        print("Deletion complete.")
    except Exception as e:
        print("Error during delete:", e)
        sys.exit(3)

    # Verify removal
    still = Organization.objects.filter(pk=org.pk).exists()
    print("Still exists after delete?", still)
    print("Post-delete related counts (should be 0 where cascaded):")
    print("Links where main:", OrganizationLink.objects.filter(main_organization_id=org.id).count())
    print("Links where link_organization:", OrganizationLink.objects.filter(link_organization_id=org.id).count())
    print("Resell requests sent:", ResellRequest.objects.filter(main_organization_id=org.id).count())
    print("Resell requests received:", ResellRequest.objects.filter(link_organization_id=org.id).count())

    print("Done.")
