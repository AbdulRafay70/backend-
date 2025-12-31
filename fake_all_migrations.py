"""
Automated script to fake all migrations and then run migrate.

This script will:
1. Fake all unapplied migrations to sync Django's migration state with the database
2. Then run migrate to apply any remaining migrations
"""

import subprocess
import sys
import re

def run_command(cmd):
    """Run a command and return output."""
    result = subprocess.run(
        cmd,
        shell=True,
        capture_output=True,
        text=True,
        cwd=r"E:\New folder\backend"
    )
    return result.returncode, result.stdout + result.stderr

def main():
    print("="*80)
    print("FAKING ALL UNAPPLIED MIGRATIONS")
    print("="*80)
    
    # Activate venv and get list of unapplied migrations
    cmd = r".venv\Scripts\Activate.ps1; python manage.py showmigrations"
    returncode, output = run_command(cmd)
    
    if returncode != 0:
        print(f"Error getting migrations list:\n{output}")
        return 1
    
    # Parse unapplied migrations
    unapplied = []
    current_app = None
    
    for line in output.split('\n'):
        line = line.strip()
        if line and not line.startswith('[') and not line.startswith('WARNINGS') and not line.startswith('System'):
            # This is an app name
            current_app = line
        elif line.startswith('[ ]'):
            # This is an unapplied migration
            migration_name = line.split('[ ]')[1].strip()
            if current_app:
                unapplied.append((current_app, migration_name))
    
    print(f"\nFound {len(unapplied)} unapplied migrations")
    
    if not unapplied:
        print("No unapplied migrations found. Running migrate...")
        cmd = r".venv\Scripts\Activate.ps1; python manage.py migrate"
        returncode, output = run_command(cmd)
        print(output)
        return returncode
    
    # Fake all unapplied migrations
    for app, migration in unapplied:
        print(f"\nFaking {app}.{migration}...")
        cmd = fr".venv\Scripts\Activate.ps1; python manage.py migrate {app} {migration} --fake"
        returncode, output = run_command(cmd)
        
        if returncode != 0:
            print(f"  ERROR: {output}")
        else:
            print(f"  SUCCESS")
    
    print("\n" + "="*80)
    print("ALL MIGRATIONS FAKED")
    print("="*80)
    
    # Now run migrate to apply any remaining migrations
    print("\nRunning migrate to apply any remaining migrations...")
    cmd = r".venv\Scripts\Activate.ps1; python manage.py migrate"
    returncode, output = run_command(cmd)
    print(output)
    
    return returncode

if __name__ == '__main__':
    sys.exit(main())
