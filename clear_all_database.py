"""
Clear all data from MySQL database - removes ALL records from ALL tables
"""
import pymysql

# Database connection details from settings.py
DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': 'root',
    'database': 'saerpk_local',
    'port': 3306,
    'charset': 'utf8mb4'
}

def clear_all_data():
    """Delete all data from all tables in the MySQL database"""
    
    print("=" * 80)
    print("WARNING: This will DELETE ALL DATA from ALL TABLES in the database!")
    print("=" * 80)
    
    try:
        # Connect to MySQL
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        # Disable foreign key checks
        cursor.execute('SET FOREIGN_KEY_CHECKS = 0;')
        
        # Get all table names
        cursor.execute('SHOW TABLES;')
        tables = cursor.fetchall()
        
        print(f"\nFound {len(tables)} tables in database '{DB_CONFIG['database']}'")
        print("\nDeleting all records from each table...\n")
        
        total_deleted = 0
        
        for (table_name,) in tables:
            # Get count before deletion
            cursor.execute(f'SELECT COUNT(*) FROM `{table_name}`;')
            count = cursor.fetchone()[0]
            
            if count > 0:
                # Delete all records
                cursor.execute(f'DELETE FROM `{table_name}`;')
                deleted = cursor.rowcount
                total_deleted += deleted
                print(f"✓ Deleted {deleted} records from '{table_name}'")
            else:
                print(f"  Skipped '{table_name}' (already empty)")
        
        # Re-enable foreign key checks
        cursor.execute('SET FOREIGN_KEY_CHECKS = 1;')
        
        # Commit the changes
        connection.commit()
        
        print("\n" + "=" * 80)
        print("DATABASE CLEARED SUCCESSFULLY!")
        print("=" * 80)
        print(f"\nTotal tables processed: {len(tables)}")
        print(f"Total records deleted: {total_deleted}")
        print("\nAll tables are now empty.")
        print("=" * 80)
        
        cursor.close()
        connection.close()
        
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        print("\nFailed to clear database.")
        if 'connection' in locals():
            connection.rollback()
            connection.close()

if __name__ == '__main__':
    clear_all_data()
