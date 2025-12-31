"""
Script to help identify and fake migrations that would create duplicate columns.

This script checks which migrations would fail due to duplicate columns and provides
commands to fake them.
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.db import connection
from django.apps import apps
from django.db.migrations.loader import MigrationLoader

def get_table_columns(table_name):
    """Get all columns for a given table."""
    with connection.cursor() as cursor:
        cursor.execute(f"SHOW COLUMNS FROM `{table_name}`")
        return [row[0] for row in cursor.fetchall()]

def check_migration_for_duplicates(app_label, migration_name):
    """Check if a migration would create duplicate columns."""
    loader = MigrationLoader(connection)
    migration_key = (app_label, migration_name)
    
    if migration_key not in loader.graph.nodes:
        return None
    
    migration = loader.graph.nodes[migration_key]
    operations = migration.operations
    
    issues = []
    for op in operations:
        op_type = type(op).__name__
        if op_type == 'AddField':
            model_name = op.model_name
            field_name = op.name
            
            # Get the model
            try:
                model = apps.get_model(app_label, model_name)
                table_name = model._meta.db_table
                
                # Check if column exists
                columns = get_table_columns(table_name)
                if field_name in columns:
                    issues.append(f"  - AddField: {model_name}.{field_name} (column already exists)")
            except Exception as e:
                pass
    
    return issues

def main():
    """Main function to check all unapplied migrations."""
    loader = MigrationLoader(connection)
    
    print("Checking for migrations that would create duplicate columns...\n")
    
    migrations_to_fake = []
    
    for app_label, migration_name in loader.applied_migrations:
        pass  # Skip applied migrations
    
    # Get unapplied migrations
    plan = loader.migration_plan(loader.graph.leaf_nodes())
    
    for migration, backwards in plan:
        if not backwards:
            app_label = migration.app_label
            migration_name = migration.name
            
            issues = check_migration_for_duplicates(app_label, migration_name)
            
            if issues:
                print(f"\n{app_label}.{migration_name}:")
                for issue in issues:
                    print(issue)
                migrations_to_fake.append((app_label, migration_name))
    
    if migrations_to_fake:
        print("\n" + "="*80)
        print("MIGRATIONS TO FAKE:")
        print("="*80)
        for app_label, migration_name in migrations_to_fake:
            print(f"python manage.py migrate {app_label} {migration_name} --fake")
    else:
        print("\nNo migrations found that would create duplicate columns.")

if __name__ == '__main__':
    main()
