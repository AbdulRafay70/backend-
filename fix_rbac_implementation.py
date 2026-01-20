"""
Fix script to correct the automated RBAC implementation
Issues to fix:
1. Imports added inside class definitions (should be at top of file)
2. Duplicate permission_classes declarations
3. Missing imports at file level
"""

import os
import re
from pathlib import Path

def fix_viewset_file(filepath):
    """Fix a single file with incorrect RBAC implementation"""
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if file has the problematic pattern (imports inside class)
    if 'from users.permissions import PermissionByAction' not in content:
        return False, "No PermissionByAction found"
    
    # Check if imports are inside a class (indented)
    if re.search(r'^\s+from users\.permissions import PermissionByAction', content, re.MULTILINE):
        print(f"⚠️  Found indented import in {filepath}")
        
        # Remove all indented RBAC imports and permission_classes/permission_map
        content = re.sub(
            r'^\s+# RBAC Permission Engine\s*\n\s+from users\.permissions import PermissionByAction\s*\n\s+from rest_framework\.permissions import IsAuthenticated\s*\n\s+permission_classes = \[IsAuthenticated, PermissionByAction\]\s*\n\s+permission_map = \{[^}]+\}\s*\n',
            '',
            content,
            flags=re.MULTILINE
        )
        
        # Check if imports are already at top level
        has_top_level_import = 'from users.permissions import PermissionByAction' in content.split('class ')[0]
        
        if not has_top_level_import:
            # Add imports at top of file (after existing imports)
            # Find the last import statement
            import_matches = list(re.finditer(r'^from .+ import .+$|^import .+$', content, re.MULTILINE))
            if import_matches:
                last_import_pos = import_matches[-1].end()
                import_code = '\nfrom users.permissions import PermissionByAction\n'
                content = content[:last_import_pos] + import_code + content[last_import_pos:]
        
        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return True, "Fixed indented imports"
    
    return False, "No issues found"

def main():
    backend_dir = Path(__file__).parent
    
    print("🔍 Scanning for files with incorrect RBAC implementation...")
    
    fixed_count = 0
    error_count = 0
    
    for root, dirs, files in os.walk(backend_dir):
        # Skip migrations, __pycache__, backup, and .venv
        if any(skip in root for skip in ['migrations', '__pycache__', 'backup', '.venv', 'venv']):
            continue
            
        for file in files:
            if file.endswith('.py') and file != '__init__.py':
                filepath = os.path.join(root, file)
                
                try:
                    fixed, message = fix_viewset_file(filepath)
                    if fixed:
                        print(f"✓ Fixed {filepath}: {message}")
                        fixed_count += 1
                except Exception as e:
                    print(f"✗ Error fixing {filepath}: {e}")
                    error_count += 1
    
    print(f"\n✅ Fixed {fixed_count} files")
    if error_count > 0:
        print(f"❌ {error_count} files had errors")
    
    print("\n📝 Next step: Run the correct RBAC script")

if __name__ == '__main__':
    main()
