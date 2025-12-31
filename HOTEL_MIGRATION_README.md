# Burj Al Arab Hotel Data Migration

This directory contains scripts to export and import the Burj Al Arab hotel data from one MySQL database to another.

## Files

- **export_burj_al_arab.py** - Exports hotel data from the current database to JSON
- **import_burj_al_arab.py** - Imports hotel data from JSON to a target database
- **burj_al_arab_export.json** - Exported hotel data (generated after running export script)

## Exported Data Summary

The export includes the following data for Burj Al Arab hotel:

### Hotel Information
- **Name:** Burj Al Arab
- **Location:** Jumeirah Street, Dubai, UAE
- **City:** Dubai (ID: 7)
- **Category:** 5-star
- **Status:** Active
- **Contact:** +971-4-301-7777
- **Availability:** December 15, 2025 - February 28, 2026
- **Distance:** 3 km (3000m walking distance, 35 min walking time)
- **Owner Organization ID:** 11

### Price Records (22 total)
Two date ranges with multiple room types:

**Period 1: Dec 15, 2025 - Dec 31, 2025**
- Room: 50,000 (Purchase: 40,000)
- Sharing: 45,000 (Purchase: 36,000)
- Double: 55,000 (Purchase: 44,000)
- Triple: 60,000 (Purchase: 48,000)
- Quad: 65,000 (Purchase: 52,000)
- Quint: 70,000 (Purchase: 56,000)
- 6-bed through 10-bed: 75,000 - 95,000

**Period 2: Jan 1, 2026 - Feb 28, 2026**
- Room: 60,000 (Purchase: 48,000)
- Sharing: 55,000 (Purchase: 44,000)
- Double: 65,000 (Purchase: 52,000)
- Triple: 70,000 (Purchase: 56,000)
- Quad: 75,000 (Purchase: 60,000)
- Quint: 80,000 (Purchase: 64,000)
- 6-bed through 10-bed: 85,000 - 105,000

### Contact Details (1 record)
- Contact Person: Luxury Concierge
- Contact Number: +971-4-301-7777

### Rooms
No room records in current database

### Photos
No photo records in current database

## Usage Instructions

### Step 1: Export Data (Already Done)

The data has already been exported. If you need to re-export:

```bash
.\.venv\Scripts\python.exe export_burj_al_arab.py
```

This will create/update `burj_al_arab_export.json` with the latest data.

### Step 2: Configure Target Database

Edit `import_burj_al_arab.py` and update the `TARGET_DB` configuration at the top of the file:

```python
TARGET_DB = {
    'host': 'your_target_host',        # e.g., 'localhost' or '192.168.1.100'
    'port': 3306,
    'user': 'your_username',           # MySQL username
    'password': 'your_password',       # MySQL password
    'database': 'your_database_name',  # Target database name
    'charset': 'utf8mb4'
}
```

### Step 3: Verify Target Database Schema

Make sure your target database has the following tables with the same structure:

- `tickets_hotels`
- `tickets_hotelprices`
- `tickets_hotelcontactdetails`
- `tickets_hotelrooms` (optional, no data to import)

### Step 4: Run Import

```bash
.\.venv\Scripts\python.exe import_burj_al_arab.py
```

The script will:
1. Load data from `burj_al_arab_export.json`
2. Connect to the target database
3. Insert the hotel record
4. Insert all 22 price records
5. Insert contact detail
6. Commit all changes

## Important Notes

### City ID Mapping
The hotel references City ID 7 (Dubai). Make sure this city exists in your target database, or update the import script to map to the correct city ID.

### Organization ID
The import script sets `organization_id` to `NULL`. If you need to associate the hotel with a specific organization in the target database, update line 88 in `import_burj_al_arab.py`:

```python
None  # organization_id - set to None or provide a value
```

Change `None` to the appropriate organization ID.

### Owner Organization ID
The hotel has `owner_organization_id` set to 11. This will be preserved in the import.

### Table Names
The import script assumes Django-style table names:
- `tickets_hotels`
- `tickets_hotelprices`
- `tickets_hotelcontactdetails`

If your target database uses different table names, update the SQL statements in `import_burj_al_arab.py`.

### Transaction Safety
The import script uses transactions. If any error occurs during import, all changes will be rolled back, leaving your target database unchanged.

## Troubleshooting

### Connection Error
If you get a connection error, verify:
- Target database credentials are correct
- MySQL server is running
- Firewall allows connections
- User has INSERT permissions

### Duplicate Entry Error
If the hotel already exists in the target database, you'll get a duplicate entry error. You can either:
1. Delete the existing hotel first
2. Modify the import script to UPDATE instead of INSERT
3. Change the hotel name in the JSON file before importing

### City Not Found Error
If City ID 7 doesn't exist in the target database:
1. Create the city first, or
2. Update the `city_id` in `burj_al_arab_export.json` to match an existing city

## Database Schema Reference

### Hotels Table Fields
- name, address, google_location, reselling_allowed, contact_number
- category, distance, walking_distance, walking_time, is_active
- available_start_date, available_end_date, status
- owner_organization_id, city_id, organization_id

### Hotel Prices Table Fields
- hotel_id, start_date, end_date, room_type
- price, purchase_price, is_sharing_allowed

### Hotel Contact Details Table Fields
- hotel_id, contact_person, contact_number

## Support

If you encounter any issues:
1. Check the error message carefully
2. Verify database credentials
3. Ensure target database schema matches source
4. Review the SQL statements in the import script
