"""
Clear all data from the database - removes ALL records from ALL tables
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.apps import apps
from django.db import connection

def clear_all_data():
    """Delete all data from all tables in the database"""
    
    print("=" * 80)
    print("WARNING: This will DELETE ALL DATA from ALL TABLES in the database!")
    print("=" * 80)
    
    # Get all models
    all_models = apps.get_models()
    
    # Disable foreign key checks temporarily
    with connection.cursor() as cursor:
        cursor.execute('SET FOREIGN_KEY_CHECKS = 0;')
    
    deleted_counts = {}
    
    # Delete all data from each model
    for model in all_models:
        model_name = f"{model._meta.app_label}.{model._meta.model_name}"
        try:
            count = model.objects.count()
            if count > 0:
                model.objects.all().delete()
                deleted_counts[model_name] = count
                print(f"✓ Deleted {count} records from {model_name}")
            else:
                print(f"  Skipped {model_name} (already empty)")
        except Exception as e:
            print(f"✗ Error deleting from {model_name}: {e}")
    
    # Re-enable foreign key checks
    with connection.cursor() as cursor:
        cursor.execute('SET FOREIGN_KEY_CHECKS = 1;')
    
    print("\n" + "=" * 80)
    print("DATABASE CLEARED SUCCESSFULLY!")
    print("=" * 80)
    print(f"\nTotal tables cleared: {len(deleted_counts)}")
    print(f"Total records deleted: {sum(deleted_counts.values())}")
    print("\nAll tables are now empty.")
    print("=" * 80)

if __name__ == '__main__':
    clear_all_data()
