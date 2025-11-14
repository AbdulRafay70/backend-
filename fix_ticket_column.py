import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.db import connection

cursor = connection.cursor()

# Check engine for tickets_ticket
cursor.execute("SHOW TABLE STATUS WHERE Name='tickets_ticket'")
result = cursor.fetchone()
print(f"tickets_ticket table engine: {result[1] if result else 'NOT FOUND'}")

# Check engine for booking_bookingpersondetail
cursor.execute("SHOW TABLE STATUS WHERE Name='booking_bookingpersondetail'")
result = cursor.fetchone()
print(f"booking_bookingpersondetail table engine: {result[1] if result else 'NOT FOUND'}")

# Try adding without foreign key constraint first
try:
    cursor.execute("ALTER TABLE booking_bookingpersondetail ADD COLUMN ticket_id INT NULL")
    print("✅ Successfully added ticket_id column (without foreign key constraint)")
except Exception as e:
    print(f"Column add: {e}")
