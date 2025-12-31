"""
Script to import Burj Al Arab hotel data to another database.
This will read the exported JSON and insert it into the target database.

USAGE:
1. First, update the TARGET_DB settings below with your destination database credentials
2. Run export_burj_al_arab.py to create the JSON export file
3. Run this script to import the data to the target database
"""
import json
import pymysql
from datetime import datetime

# ============================================================================
# TARGET DATABASE CONFIGURATION
# Update these with your destination database credentials
# ============================================================================
# You can either provide a direct pymysql.connect() style mapping here,
# or let the script pick up Django's DATABASES['default'] if the
# environment variable DJANGO_SETTINGS_MODULE is set.
# Example mapping (uncomment and edit if you prefer explicit credentials):
# TARGET_DB = {
#     'host': 'localhost',
#     'user': 'saeraqnj_ahsanraza',
#     'password': 'YjToTZu!+BnM',
#     'db': 'saeraqnj_saer_db',
#     'port': 3306,
#     'charset': 'utf8mb4',
#     'cursorclass': pymysql.cursors.DictCursor,
# }

# If left as None, the script will attempt to read Django settings
# using DJANGO_SETTINGS_MODULE and extract DATABASES['default'].
TARGET_DB = None


def import_hotel_data(json_file='burj_al_arab_export.json'):
    """Import hotel data from JSON file to target database."""
    
    print("=" * 80)
    print("BURJ AL ARAB HOTEL DATA IMPORT")
    print("=" * 80)
    
    # Load JSON data
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"\n[OK] Loaded data from {json_file}")
    except FileNotFoundError:
        print(f"\n[ERROR] Error: {json_file} not found!")
        print("Please run export_burj_al_arab.py first to create the export file.")
        return
    except json.JSONDecodeError as e:
        print(f"\n[ERROR] Error reading JSON file: {e}")
        return
    
    # Connect to target database
    # Build connection kwargs
    conn_kwargs = None
    # If explicit mapping provided
    if isinstance(TARGET_DB, dict):
        conn_kwargs = TARGET_DB.copy()
    else:
        # Try to get DB config from Django settings if available
        try:
            import os
            dj_mod = os.environ.get('DJANGO_SETTINGS_MODULE')
            if dj_mod:
                # initialize Django environment to import settings
                import django
                django.setup()
                from django.conf import settings as dj_settings
                db = dj_settings.DATABASES.get('default', {})
                if db:
                    conn_kwargs = {
                        'host': db.get('HOST') or 'localhost',
                        'user': db.get('USER'),
                        'password': db.get('PASSWORD'),
                        'db': db.get('NAME'),
                        'port': int(db.get('PORT') or 3306),
                        'charset': db.get('OPTIONS', {}).get('charset', 'utf8mb4'),
                        'cursorclass': pymysql.cursors.DictCursor,
                    }
        except Exception:
            conn_kwargs = None

    # As a last resort, if TARGET_DB was set to a string-list (old config),
    # use the first entry as host and require other credentials via env vars
    if conn_kwargs is None and TARGET_DB and isinstance(TARGET_DB, (list, tuple)):
        host = TARGET_DB[0] if len(TARGET_DB) > 0 else 'localhost'
        conn_kwargs = {
            'host': host,
            'user': os.environ.get('IMPORT_DB_USER'),
            'password': os.environ.get('IMPORT_DB_PASSWORD'),
            'db': os.environ.get('IMPORT_DB_NAME'),
            'port': int(os.environ.get('IMPORT_DB_PORT', 3306)),
            'charset': 'utf8mb4',
            'cursorclass': pymysql.cursors.DictCursor,
        }

    if not conn_kwargs:
        print('\n[ERROR] Database connection configuration not found.')
        print('Set TARGET_DB to a dict at the top of this script, or set the environment variable DJANGO_SETTINGS_MODULE')
        print('so the script can read DATABASES["default"] from your Django settings.')
        return

    try:
        conn = pymysql.connect(**conn_kwargs)
        cursor = conn.cursor()
        db_name = conn_kwargs.get('db') or conn_kwargs.get('database')
        print(f"[OK] Connected to target database: {db_name}")
    except pymysql.Error as e:
        print(f"\n[ERROR] Database connection error: {e}")
        print("\nPlease update the TARGET_DB configuration in this script with your database credentials.")
        return
    
    try:
        # Insert hotel data
        hotel_data = data['hotel']
        print(f"\n[HOTEL] Importing hotel: {hotel_data['name']}")
        
        # Note: You may need to adjust the table name and column names based on your target database
        hotel_insert_sql = """
            INSERT INTO tickets_hotels (
                name, address, google_location, reselling_allowed, contact_number,
                category, distance, walking_distance, walking_time, is_active,
                available_start_date, available_end_date, status, owner_organization_id,
                city_id, organization_id
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """
        
        cursor.execute(hotel_insert_sql, (
            hotel_data['name'],
            hotel_data['address'],
            hotel_data['google_location'],
            hotel_data['reselling_allowed'],
            hotel_data['contact_number'],
            hotel_data['category'],
            hotel_data['distance'],
            hotel_data['walking_distance'],
            hotel_data['walking_time'],
            hotel_data['is_active'],
            hotel_data['available_start_date'],
            hotel_data['available_end_date'],
            hotel_data['status'],
            hotel_data['owner_organization_id'],
            hotel_data['city_id'],  # You may need to map this to the target DB
            None  # organization_id - set to None or provide a value
        ))
        
        hotel_id = cursor.lastrowid
        print(f"[OK] Hotel inserted with ID: {hotel_id}")
        
        # Insert prices
        print(f"\n[PRICES] Importing {len(data['prices'])} price records...")
        price_insert_sql = """
            INSERT INTO tickets_hotelprices (
                hotel_id, start_date, end_date, room_type, price, purchase_price, is_sharing_allowed
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        
        for price in data['prices']:
            cursor.execute(price_insert_sql, (
                hotel_id,
                price['start_date'],
                price['end_date'],
                price['room_type'],
                price['price'],
                price['purchase_price'],
                price['is_sharing_allowed']
            ))
        print(f"[OK] Inserted {len(data['prices'])} price records")
        
        # Insert contact details
        if data['contact_details']:
            print(f"\n[CONTACT] Importing {len(data['contact_details'])} contact detail records...")
            contact_insert_sql = """
                INSERT INTO tickets_hotelcontactdetails (
                    hotel_id, contact_person, contact_number
                ) VALUES (%s, %s, %s)
            """
            
            for contact in data['contact_details']:
                cursor.execute(contact_insert_sql, (
                    hotel_id,
                    contact['contact_person'],
                    contact['contact_number']
                ))
            print(f"[OK] Inserted {len(data['contact_details'])} contact detail records")
        
        # Insert rooms
        if data['rooms']:
            print(f"\n[ROOMS] Importing {len(data['rooms'])} room records...")
            room_insert_sql = """
                INSERT INTO tickets_hotelrooms (
                    hotel_id, room_number, room_type, floor, total_beds
                ) VALUES (%s, %s, %s, %s, %s)
            """
            
            for room in data['rooms']:
                cursor.execute(room_insert_sql, (
                    hotel_id,
                    room['room_number'],
                    room['room_type'],
                    room['floor'],
                    room['total_beds']
                ))
            print(f"[OK] Inserted {len(data['rooms'])} room records")

        
        # Note: Photos are not imported as they require file handling
        if data['photos']:
            print(f"\n[PHOTOS] Note: {len(data['photos'])} photo records found but not imported.")
            print("   Photo files need to be manually copied to the target server.")
        
        # Commit the transaction
        conn.commit()
        print("\n[OK] All data committed successfully!")
        print("=" * 80)
        
    except pymysql.Error as e:
        conn.rollback()
        print(f"\n[ERROR] Error during import: {e}")
        print("Transaction rolled back.")
    finally:
        cursor.close()
        conn.close()
        print("\n[OK] Database connection closed")


if __name__ == "__main__":
    import_hotel_data()
