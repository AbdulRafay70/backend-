#!/usr/bin/env python
"""Create a Django user and link to a branch and organization.

Usage (from repo root, with virtualenv activated):
  python scripts/create_agent_user.py \
    --email agent@example.com --username agent1 --password secret \
    --branch-id 21 --org-email abc@gmail.com

The script will:
 - create or update a Django `User` with the provided email/username
 - set the provided password
 - add the user to Branch.user and Organization.user M2M if matching branch/org found

Be sure `DJANGO_SETTINGS_MODULE` is set correctly (manage.py uses `configuration.settings`).
"""
import os
import sys
import argparse

# Ensure we use the project's settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")

# Ensure the project root is on sys.path so `configuration` package can be imported
from pathlib import Path
repo_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

def main():
    parser = argparse.ArgumentParser(description="Create an agent user and link to branch/org")
    parser.add_argument("--email", required=True)
    parser.add_argument("--username", required=False,
                        help="(optional) username to set; will be overridden to the email address by default")
    parser.add_argument("--password", required=True)
    parser.add_argument("--branch-id", type=int, help="Branch ID to link the user to")
    parser.add_argument("--branch-code", help="Branch code to lookup branch")
    parser.add_argument("--org-email", help="Organization email to link user to (preferred)")
    parser.add_argument("--org-id", type=int, help="Organization ID to link user to")
    args = parser.parse_args()

    try:
        import django
        django.setup()
    except Exception as e:
        print("Failed to setup Django environment:", e)
        sys.exit(1)

    from django.contrib.auth import get_user_model
    from organization.models import Branch, Organization

    User = get_user_model()

    # create or update user
    user, created = User.objects.get_or_create(email=args.email, defaults={
        "username": args.email
    })
    # Ensure username equals email (project uses email for login)
    if getattr(user, "username", None) != args.email:
        user.username = args.email

    # Ensure user is active and usable for login/testing
    user.is_active = True
    # Make this user staff so admin login works for quick testing
    user.is_staff = True

    user.set_password(args.password)
    user.save()

    print(f"User {'created' if created else 'updated'}: id={user.pk}, email={user.email}")

    # Ensure a UserProfile exists and set type to 'agent' so agent login is allowed
    try:
        from users.models import UserProfile
        profile, pcreated = UserProfile.objects.get_or_create(user=user)
        profile.type = 'agent'
        profile.save()
        if pcreated:
            print(f"Created UserProfile for user id={user.pk}")
        else:
            print(f"Updated UserProfile.type='agent' for user id={user.pk}")
    except Exception as e:
        print("Could not ensure UserProfile (users app may be missing):", e)

    # Link to branch if provided
    branch_obj = None
    if args.branch_id:
        try:
            branch_obj = Branch.objects.get(pk=args.branch_id)
        except Branch.DoesNotExist:
            print(f"Branch with id={args.branch_id} not found")
    elif args.branch_code:
        try:
            branch_obj = Branch.objects.get(branch_code=args.branch_code)
        except Branch.DoesNotExist:
            print(f"Branch with code={args.branch_code} not found")

    if branch_obj is not None:
        try:
            branch_obj.user.add(user)
            branch_obj.save()
            print(f"Added user to Branch id={branch_obj.pk} name={branch_obj.name}")
        except Exception as e:
            print("Failed to add user to branch:", e)

    # Link to organization
    org_obj = None
    if args.org_id:
        try:
            org_obj = Organization.objects.get(pk=args.org_id)
        except Organization.DoesNotExist:
            print(f"Organization with id={args.org_id} not found")
    elif args.org_email:
        try:
            org_obj = Organization.objects.filter(email__iexact=args.org_email).first()
            if org_obj is None:
                print(f"Organization with email={args.org_email} not found")
        except Exception as e:
            print("Organization lookup failed:", e)

    if org_obj is not None:
        try:
            org_obj.user.add(user)
            org_obj.save()
            print(f"Added user to Organization id={org_obj.pk} name={org_obj.name}")
            # If branch not provided but org has branches, optionally attach user to first branch
            if branch_obj is None:
                first_branch = org_obj.branches.first()
                if first_branch:
                    first_branch.user.add(user)
                    first_branch.save()
                    print(f"Also added user to Branch id={first_branch.pk} name={first_branch.name}")
        except Exception as e:
            print("Failed to add user to organization:", e)

    print("Done.")

if __name__ == "__main__":
    main()
