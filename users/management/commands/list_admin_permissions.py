from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group
from collections import defaultdict


class Command(BaseCommand):
    help = 'List all permissions assigned to admin group'

    def handle(self, *args, **options):
        # Find admin group
        admin_groups = Group.objects.filter(name__icontains='admin')

        if not admin_groups.exists():
            self.stdout.write(self.style.ERROR("No admin group found!"))
            return

        for group in admin_groups:
            self.stdout.write(f"\n{'='*80}")
            self.stdout.write(f"Group: {group.name}")
            self.stdout.write(f"Total permissions: {group.permissions.count()}")
            self.stdout.write(f"{'='*80}\n")
            
            # Get all permissions and group by content type
            perms_by_ct = defaultdict(list)
            
            for p in group.permissions.all().order_by('content_type__app_label', 'content_type__model', 'codename'):
                ct_key = f"{p.content_type.app_label}.{p.content_type.model}"
                perms_by_ct[ct_key].append(p)
            
            # Print grouped permissions
            for ct_key, perms in sorted(perms_by_ct.items()):
                self.stdout.write(f"\n📦 {ct_key} ({len(perms)} permissions):")
                for p in perms:
                    self.stdout.write(f"  - {p.codename}")
            
            self.stdout.write(f"\n{'='*80}")
            self.stdout.write(f"Total: {group.permissions.count()} permissions")
            self.stdout.write(f"{'='*80}\n")
