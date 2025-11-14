"""
Script: org_token_login.py
Purpose:
 - Given an organization id, find an associated user
 - Optionally set/update that user's email and password
 - Obtain JWT tokens from /api/token/ using the user's credentials

Usage examples:
 python org_token_login.py --org 8 --email admin@example.com --password Pass123!

If email is provided and a user with that email exists under the organization it will be used.
If email is provided but not present, the script picks the first user in the organization and updates its email.
If password is provided the script will set the user's password to the value (saved in DB).

Returns: prints access and refresh tokens on success.
"""

import os
import sys
import argparse
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth import get_user_model
from organization.models import Organization

User = get_user_model()

DEFAULT_BASE = 'http://127.0.0.1:8000'


def main():
    parser = argparse.ArgumentParser(description='Login using a user linked to an organization and obtain JWT token')
    parser.add_argument('--org', type=int, required=True, help='Organization id')
    parser.add_argument('--email', type=str, help='Email to use or set for the user')
    parser.add_argument('--password', type=str, required=True, help='Password to set/use for the user')
    parser.add_argument('--base', type=str, default=DEFAULT_BASE, help='Base URL for API (default http://127.0.0.1:8000)')
    parser.add_argument('--set-email-if-missing', action='store_true', help='If email not found, update first user email to provided email')
    args = parser.parse_args()

    org = Organization.objects.filter(id=args.org).first()
    if not org:
        print(f"Organization with id={args.org} not found")
        sys.exit(1)

    users_qs = org.user.all()
    if not users_qs.exists():
        # Create a new user for this organization when none exist
        print(f"No users linked to organization id={args.org}. Creating a new user.")
        # derive username from email if provided, else use org name
        if args.email:
            username_candidate = args.email.split('@')[0]
            email_to_use = args.email
        else:
            username_candidate = f"org{args.org}_user"
            email_to_use = f"{username_candidate}@example.com"

        # ensure unique username
        base_username = username_candidate
        idx = 0
        while User.objects.filter(username=username_candidate).exists():
            idx += 1
            username_candidate = f"{base_username}{idx}"

        user = User.objects.create(username=username_candidate, email=email_to_use, is_staff=True)
        user.set_password(args.password)
        user.save()
        org.user.add(user)
        users_qs = org.user.all()
        print(f"Created and linked user: {user.username} (id={user.id}, email={user.email})")

    user = None
    if args.email:
        user = users_qs.filter(email__iexact=args.email).first()
        if user:
            print(f"Found user with email {args.email} -> username: {user.username}")
        else:
            # choose first user and optionally set email
            user = users_qs.first()
            print(f"No user with email {args.email} in org {args.org}. Using first user: {user.username} (id={user.id})")
            if args.set_email_if_missing:
                user.email = args.email
                user.save()
                print(f"Updated user's email to {args.email}")
    else:
        # pick first user
        user = users_qs.first()
        print(f"No email provided. Using first user: {user.username} (id={user.id}, email={user.email})")

    # set password if provided
    if args.password:
        user.set_password(args.password)
        user.save()
        print(f"Set password for user {user.username}")

    # Attempt to obtain token
    token_url = args.base.rstrip('/') + '/api/token/'
    payload = {'username': user.username, 'password': args.password}
    try:
        r = requests.post(token_url, json=payload, timeout=10)
    except Exception as e:
        print(f"Error connecting to {token_url}: {e}")
        sys.exit(1)

    try:
        data = r.json()
    except Exception:
        data = {'status_code': r.status_code, 'text': r.text}

    if r.status_code == 200 and 'access' in data:
        print("\nSuccess! Tokens:")
        print('Access:', data.get('access'))
        print('Refresh:', data.get('refresh'))
    else:
        print('\nFailed to obtain token')
        print('Status code:', r.status_code)
        print('Response:', data)
        sys.exit(2)


if __name__ == '__main__':
    main()
