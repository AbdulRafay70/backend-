import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.db import connection

cursor = connection.cursor()

# Add ticket_id column to booking_bookingpersondetail table
try:
    cursor.execute("""
        ALTER TABLE booking_bookingpersondetail 
        ADD COLUMN ticket_id INT NULL,
        ADD CONSTRAINT booking_bookingpersondetail_ticket_id_fk 
        FOREIGN KEY (ticket_id) REFERENCES tickets_ticket(id) 
        ON DELETE SET NULL
    """)
    print("✅ Successfully added ticket_id column to booking_bookingpersondetail table")
except Exception as e:
    print(f"❌ Error: {e}")
    # Column might already exist, let's check
    cursor.execute("SHOW COLUMNS FROM booking_bookingpersondetail LIKE 'ticket_id'")
    result = cursor.fetchone()
    if result:
        print("ℹ️  Column 'ticket_id' already exists in the table")
    else:
        print(f"❌ Failed to add column: {e}")
