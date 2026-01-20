"""
Script to update permission extensions with proper types for admin/agent categorization.
Run with: python update_permission_types.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import Permission
from users.models import PermissionExtension

def main():
    print('\n🔧 Updating permission types for proper admin/agent categorization...\n', flush=True)

    try:
        # Get all permissions
        all_permissions = Permission.objects.all()
        
        updated_count = 0
        
        for perm in all_permissions:
            codename = perm.codename
            
            # Determine the type based on codename
            perm_type = None
            
            # Admin-specific permissions
            if codename.endswith('_admin') or codename == 'admin_portal_access':
                perm_type = 'admin'
            # Agent-specific permissions
            elif codename.endswith('_agent') or codename == 'agent_portal_access':
                perm_type = 'agent'
            # Shared permissions (can be used by both)
            else:
                perm_type = 'shared'
            
            # Update or create permission extension
            perm_ext, created = PermissionExtension.objects.update_or_create(
                permission=perm,
                defaults={'type': perm_type}
            )
            
            if created or perm_ext.type != perm_type:
                print(f'✅ Updated: {codename} → type: {perm_type}', flush=True)
                updated_count += 1

        print(f'\n✅ Successfully updated {updated_count} permission types!', flush=True)

    except Exception as e:
        print(f'\n❌ Error occurred: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
