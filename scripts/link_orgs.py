#!/usr/bin/env python
"""Create or accept an OrganizationLink between two organizations.

Usage (from repo root, with virtualenv activated):
  python scripts/link_orgs.py --main 13 --link 40

The script ensures DJANGO_SETTINGS_MODULE is set and the repo root is on sys.path.
"""
import os
import sys
from pathlib import Path
import argparse

# Ensure project root on sys.path and correct settings module
repo_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")

def main():
    parser = argparse.ArgumentParser(description="Link two organizations (main -> link)")
    parser.add_argument("--main", type=int, required=True, help="Main organization id")
    parser.add_argument("--link", type=int, required=True, help="Link organization id (reseller)")
    args = parser.parse_args()

    try:
        import django
        django.setup()
    except Exception as e:
        print("Failed to setup Django:", e)
        sys.exit(1)

    from organization.models import Organization, OrganizationLink

    main_id = args.main
    link_id = args.link

    if not Organization.objects.filter(pk=main_id).exists():
        print(f"Main organization {main_id} not found")
        sys.exit(1)
    if not Organization.objects.filter(pk=link_id).exists():
        print(f"Link organization {link_id} not found")
        sys.exit(1)

    ol, created = OrganizationLink.objects.get_or_create(
        main_organization_id=main_id,
        link_organization_id=link_id,
    )

    # Mark both sides accepted and request_status True
    try:
        ol.link_organization_request = OrganizationLink.STATUS_ACCEPTED
        ol.main_organization_request = OrganizationLink.STATUS_ACCEPTED
        # If model has explicit request_status field, set it True (many implementations compute it)
        if hasattr(ol, 'request_status'):
            ol.request_status = True
        ol.save()
    except Exception as e:
        print('Warning: could not set acceptance flags on OrganizationLink:', e)

    print('OrganizationLink', 'created' if created else 'updated')
    print('main:', main_id, 'link:', link_id, 'request_status:', getattr(ol, 'request_status', '(unknown)'))

if __name__ == '__main__':
    main()
