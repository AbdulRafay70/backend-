"""
Script to manually create the missing PassengerActivityStatus table.
This fixes the database sync issue where the migration was marked as applied
but the table doesn't exist in the database.
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.db import connection

# SQL to create the table
create_table_sql = """
CREATE TABLE IF NOT EXISTS `booking_passengeractivitystatus` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `object_id` int unsigned NOT NULL,
    `status` varchar(20) NOT NULL DEFAULT 'Pending',
    `content_type_id` int NOT NULL,
    `passenger_id` bigint NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `booking_passengeracti_passenger_id_content_ty_7da9f3ab_uniq` (`passenger_id`, `content_type_id`, `object_id`),
    KEY `booking_passengeract_content_type_id_c6a89f6f_fk_django_co` (`content_type_id`),
    KEY `booking_passengeract_passenger_id_7da9f3ab_fk_booking_b` (`passenger_id`),
    CONSTRAINT `booking_passengeract_content_type_id_c6a89f6f_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
    CONSTRAINT `booking_passengeract_passenger_id_7da9f3ab_fk_booking_b` FOREIGN KEY (`passenger_id`) REFERENCES `booking_bookingpersondetail` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
"""

# Execute the SQL
with connection.cursor() as cursor:
    try:
        cursor.execute(create_table_sql)
        print("✅ Successfully created booking_passengeractivitystatus table")
    except Exception as e:
        print(f"⚠️ Error creating table (it may already exist): {e}")

# Verify the table exists
with connection.cursor() as cursor:
    cursor.execute("SHOW TABLES LIKE 'booking_passengeractivitystatus'")
    result = cursor.fetchone()
    if result:
        print("✅ Table verified: booking_passengeractivitystatus exists")
    else:
        print("❌ Table still missing!")
