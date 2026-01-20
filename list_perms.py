from django.contrib.auth.models import Group
from collections import defaultdict

# Find admin group
admin_groups = Group.objects.filter(name__icontains='admin')

if not admin_groups.exists():
    print("No admin group found!", flush=True)
else:
    for group in admin_groups:
        print(f"\n{'='*80}", flush=True)
        print(f"Group: {group.name}", flush=True)
        print(f"Total permissions: {group.permissions.count()}", flush=True)
        print(f"{'='*80}\n", flush=True)
        
        # Get all permissions and group by content type
        perms_by_ct = defaultdict(list)
        
        for p in group.permissions.all().order_by('content_type__app_label', 'content_type__model', 'codename'):
            ct_key = f"{p.content_type.app_label}.{p.content_type.model}"
            perms_by_ct[ct_key].append(p)
        
        # Print grouped permissions
        for ct_key, perms in sorted(perms_by_ct.items()):
            print(f"\n📦 {ct_key} ({len(perms)} permissions):", flush=True)
            for p in perms:
                print(f"  - {p.codename}", flush=True)
        
        print(f"\n{'='*80}", flush=True)
        print(f"Total: {group.permissions.count()} permissions", flush=True)
        print(f"{'='*80}\n", flush=True)
