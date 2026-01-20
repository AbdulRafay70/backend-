"""
Automated script to apply RBAC permission engine to all ViewSets
This script will:
1. Find all ViewSets in the backend
2. Check if they already have permission checks
3. Add PermissionByAction and permission_map if missing
"""

import os
import re
from pathlib import Path
from users.permissions import PermissionByAction


# ViewSets that are already protected (skip these)
PROTECTED_VIEWSETS = [
    'UserViewSet',
    'GroupViewSet',
    'PermissionViewSet',
    'BlogViewSet',
    'BlogCommentViewSet',
]

# ViewSets that should remain public (no auth required)
PUBLIC_VIEWSETS = [
    'LeadFormViewSet',
    'FormSubmissionViewSet',
]

def find_viewsets(backend_dir):
    """Find all Python files with ViewSets"""
    viewsets = []
    
    for root, dirs, files in os.walk(backend_dir):
        # Skip migrations and __pycache__
        if 'migrations' in root or '__pycache__' in root:
            continue
            
        for file in files:
            if file.endswith('.py') and file != '__init__.py':
                filepath = os.path.join(root, file)
                
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # Find all ViewSet class definitions
                matches = re.finditer(r'^class (\w+ViewSet)\(.*?\):', content, re.MULTILINE)
                
                for match in matches:
                    viewset_name = match.group(1)
                    
                    # Skip if already protected or public
                    if viewset_name in PROTECTED_VIEWSETS or viewset_name in PUBLIC_VIEWSETS:
                        continue
                    
                    # Check if already has PermissionByAction
                    if 'PermissionByAction' in content:
                        print(f"✓ {viewset_name} in {filepath} - already protected")
                        continue
                    
                    viewsets.append({
                        'name': viewset_name,
                        'file': filepath,
                        'content': content
                    })
    
    return viewsets

def get_permission_base_name(viewset_name):
    """
    Convert ViewSet name to permission base name
    Example: HotelViewSet -> hotel
             PackageViewSet -> package
    """
    # Remove 'ViewSet' suffix
    name = viewset_name.replace('ViewSet', '')
    
    # Convert CamelCase to snake_case
    name = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    name = re.sub('([a-z0-9])([A-Z])', r'\1_\2', name).lower()
    
    return name

def generate_permission_code(viewset_name):
    """Generate the permission code to add to ViewSet"""
    base_name = get_permission_base_name(viewset_name)
    
    code = f"""
    # RBAC Permission Engine
    from users.permissions import PermissionByAction
    from rest_framework.permissions import IsAuthenticated
    
    permission_classes = [IsAuthenticated, PermissionByAction]
    
    permission_map = {{
        'list': 'auth.view_{base_name}_admin',
        'retrieve': 'auth.view_{base_name}_admin',
        'create': 'auth.add_{base_name}_admin',
        'update': 'auth.edit_{base_name}_admin',
        'partial_update': 'auth.edit_{base_name}_admin',
        'destroy': 'auth.delete_{base_name}_admin',
    }}
"""
    return code

def add_permissions_to_viewset(filepath, viewset_name, content):
    """Add permission code to a ViewSet"""
    
    # Find the ViewSet class definition
    class_pattern = rf'(class {viewset_name}\(.*?\):)'
    match = re.search(class_pattern, content)
    
    if not match:
        print(f"✗ Could not find class definition for {viewset_name}")
        return False
    
    # Find the position after the class definition
    class_end = match.end()
    
    # Find the next line (usually has queryset or serializer_class)
    next_line_match = re.search(r'\n(\s+)', content[class_end:])
    if not next_line_match:
        print(f"✗ Could not determine indentation for {viewset_name}")
        return False
    
    indent = next_line_match.group(1)
    
    # Generate permission code with proper indentation
    perm_code = generate_permission_code(viewset_name)
    perm_code_lines = perm_code.strip().split('\n')
    perm_code_indented = '\n'.join([indent + line if line.strip() else '' for line in perm_code_lines])
    
    # Insert the permission code after the class definition
    new_content = content[:class_end] + '\n' + perm_code_indented + '\n' + content[class_end:]
    
    # Write back to file
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"✓ Added permissions to {viewset_name} in {filepath}")
        return True
    except Exception as e:
        print(f"✗ Error writing to {filepath}: {e}")
        return False

def main():
    backend_dir = Path(__file__).parent
    
    print("🔍 Scanning for ViewSets...")
    viewsets = find_viewsets(backend_dir)
    
    print(f"\n📊 Found {len(viewsets)} ViewSets that need protection\n")
    
    if not viewsets:
        print("✅ All ViewSets are already protected!")
        return
    
    # Ask for confirmation
    print("ViewSets to update:")
    for vs in viewsets[:10]:  # Show first 10
        print(f"  - {vs['name']} in {vs['file']}")
    
    if len(viewsets) > 10:
        print(f"  ... and {len(viewsets) - 10} more")
    
    response = input(f"\n⚠️  This will modify {len(viewsets)} files. Continue? (yes/no): ")
    
    if response.lower() != 'yes':
        print("❌ Aborted")
        return
    
    # Apply permissions
    print("\n🔧 Applying permissions...")
    success_count = 0
    
    for vs in viewsets:
        if add_permissions_to_viewset(vs['file'], vs['name'], vs['content']):
            success_count += 1
    
    print(f"\n✅ Successfully updated {success_count}/{len(viewsets)} ViewSets!")
    print("\n📝 Next steps:")
    print("1. Review the changes")
    print("2. Test the API endpoints")
    print("3. Update frontend components to hide buttons based on permissions")

if __name__ == '__main__':
    main()
