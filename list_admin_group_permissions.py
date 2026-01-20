#!/usr/bin/env python
"""
List all permissions assigned to the Admin group
"""
import os
import sys
import django

# Add the backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'seer.settings')
django.setup()

from django.contrib.auth.models import Group

# Find admin group
admin_groups = Group.objects.filter(name__icontains='admin')

if not admin_groups.exists():
    print("No admin group found!")
else:
    for group in admin_groups:
        print(f"\n{'='*80}")
        print(f"Group: {group.name}")
        print(f"Total permissions: {group.permissions.count()}")
        print(f"{'='*80}\n")
        
        # Get all permissions and group by content type
        from collections import defaultdict
        perms_by_ct = defaultdict(list)
        
        for p in group.permissions.all().order_by('content_type__app_label', 'content_type__model', 'codename'):
            ct_key = f"{p.content_type.app_label}.{p.content_type.model}"
            perms_by_ct[ct_key].append(p)
        
        # Print grouped permissions
        for ct_key, perms in sorted(perms_by_ct.items()):
            print(f"\n📦 {ct_key} ({len(perms)} permissions):")
            for p in perms:
                print(f"  - {p.codename}")
        
        print(f"\n{'='*80}")
        print(f"Total: {group.permissions.count()} permissions")
        print(f"{'='*80}\n")
