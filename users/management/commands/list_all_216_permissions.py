from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission
from collections import defaultdict


class Command(BaseCommand):
    help = 'List all custom admin and agent permissions (216 total)'

    def handle(self, *args, **options):
        # Get all admin permissions
        admin_perms = Permission.objects.filter(codename__endswith='_admin').order_by('codename')
        
        # Get all agent permissions
        agent_perms = Permission.objects.filter(codename__endswith='_agent').order_by('codename')
        
        # Write to file
        output_file = 'all_216_permissions.txt'
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("="*80 + "\n")
            f.write("ALL CUSTOM PERMISSIONS (Admin + Agent)\n")
            f.write("="*80 + "\n\n")
            
            # Admin permissions
            f.write(f"📋 ADMIN PERMISSIONS ({admin_perms.count()} total)\n")
            f.write("="*80 + "\n\n")
            
            # Group by content type
            admin_by_ct = defaultdict(list)
            for p in admin_perms:
                ct_key = f"{p.content_type.app_label}.{p.content_type.model}"
                admin_by_ct[ct_key].append(p)
            
            for ct_key, perms in sorted(admin_by_ct.items()):
                f.write(f"\n📦 {ct_key} ({len(perms)} permissions):\n")
                for p in perms:
                    f.write(f"  - {p.codename} | {p.name}\n")
            
            f.write(f"\n{'='*80}\n")
            f.write(f"Total Admin Permissions: {admin_perms.count()}\n")
            f.write(f"{'='*80}\n\n\n")
            
            # Agent permissions
            f.write(f"👤 AGENT PERMISSIONS ({agent_perms.count()} total)\n")
            f.write("="*80 + "\n\n")
            
            # Group by content type
            agent_by_ct = defaultdict(list)
            for p in agent_perms:
                ct_key = f"{p.content_type.app_label}.{p.content_type.model}"
                agent_by_ct[ct_key].append(p)
            
            for ct_key, perms in sorted(agent_by_ct.items()):
                f.write(f"\n📦 {ct_key} ({len(perms)} permissions):\n")
                for p in perms:
                    f.write(f"  - {p.codename} | {p.name}\n")
            
            f.write(f"\n{'='*80}\n")
            f.write(f"Total Agent Permissions: {agent_perms.count()}\n")
            f.write(f"{'='*80}\n\n\n")
            
            # Summary
            total = admin_perms.count() + agent_perms.count()
            f.write(f"📊 GRAND TOTAL\n")
            f.write("="*80 + "\n")
            f.write(f"Admin Permissions: {admin_perms.count()}\n")
            f.write(f"Agent Permissions: {agent_perms.count()}\n")
            f.write(f"TOTAL PERMISSIONS: {total}\n")
            f.write("="*80 + "\n")
        
        self.stdout.write(self.style.SUCCESS(f"\n✅ Successfully wrote {total} permissions to {output_file}"))
        self.stdout.write(f"   - Admin: {admin_perms.count()}")
        self.stdout.write(f"   - Agent: {agent_perms.count()}")
        self.stdout.write(f"   - Total: {total}")
