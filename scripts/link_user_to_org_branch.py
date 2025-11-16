#!/usr/bin/env python
"""Link a user to an organization and a branch.

Usage examples:
  # link existing user to existing org and branch by ids/emails
  python scripts/link_user_to_org_branch.py --user-email agent1@gmail.com --org-email abc@gmail.com --branch-id 21

  # link user to org and pick/create a branch by name if branch-id not provided
  python scripts/link_user_to_org_branch.py --user-email agent1@gmail.com --org-email abc@gmail.com --create-branch-name "Main Branch"

The script will:
 - find the User by email
 - find the Organization by email or id
 - find or create the Branch as requested
 - add the user to Organization.user and Branch.user M2M
 - ensure UserProfile.type='agent' if UserProfile exists
"""
import os
import sys
from pathlib import Path
import argparse

repo_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")

def main():
    parser = argparse.ArgumentParser(description="Link user to organization and branch")
    parser.add_argument("--user-email", required=True, help="User email to link")
    parser.add_argument("--user-username", required=False, help="Optional username override")
    parser.add_argument("--org-email", required=False, help="Organization email to link to")
    parser.add_argument("--org-id", type=int, required=False, help="Organization id to link to")
    parser.add_argument("--branch-id", type=int, required=False, help="Branch id to link to")
    parser.add_argument("--create-branch-name", required=False, help="If set and no branch-id provided, create branch with this name under the organization")
    args = parser.parse_args()

    try:
        import django
        django.setup()
    except Exception as e:
        print("Failed to setup Django:", e)
        sys.exit(1)

    from django.contrib.auth import get_user_model
    from organization.models import Organization, Branch

    User = get_user_model()

    user = User.objects.filter(email__iexact=args.user_email).first()
    if not user:
        print(f"User with email={args.user_email} not found")
        sys.exit(1)

    # find org
    org = None
    if args.org_id:
        org = Organization.objects.filter(pk=args.org_id).first()
    elif args.org_email:
        org = Organization.objects.filter(email__iexact=args.org_email).first()

    if not org:
        print("Organization not found. Provide --org-id or --org-email that exists.")
        sys.exit(1)

    # determine branch
    branch = None
    if args.branch_id:
        branch = Branch.objects.filter(pk=args.branch_id, organization=org).first()
        if not branch:
            print(f"Branch id={args.branch_id} not found under organization id={org.pk}")
            sys.exit(1)
    else:
        # if create-branch-name provided, try to create a branch
        if args.create_branch_name:
            branch = Branch.objects.create(organization=org, name=args.create_branch_name)
            print(f"Created branch id={branch.pk} name={branch.name} under org id={org.pk}")
        else:
            # pick first existing branch if available
            branch = org.branches.first()
            if branch:
                print(f"Selected existing branch id={branch.pk} name={branch.name} under org id={org.pk}")
            else:
                print("No branch found for organization and no --create-branch-name provided. Provide a branch or create one.")
                sys.exit(1)

    # link user to organization and branch
    try:
        org.user.add(user)
        org.save()
        print(f"Linked user {user.email} to organization id={org.pk} name={org.name}")
    except Exception as e:
        print("Failed to link user to organization:", e)

    try:
        branch.user.add(user)
        branch.save()
        print(f"Linked user {user.email} to branch id={branch.pk} name={branch.name}")
    except Exception as e:
        print("Failed to link user to branch:", e)

    # ensure user profile type 'agent' if model present
    try:
        from users.models import UserProfile
        profile, created = UserProfile.objects.get_or_create(user=user)
        profile.type = 'agent'
        profile.save()
        print(f"UserProfile ensured: type='agent' for user id={user.pk}")
    except Exception:
        # users app may not be installed; skip silently
        pass

    print("Done.")

if __name__ == '__main__':
    main()
