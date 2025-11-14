import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
django.setup()

from django.db import connection

# Create tables directly with InnoDB engine
sql_commands = [
    """
    CREATE TABLE `customers_customer` (
        `id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY,
        `full_name` varchar(255) NOT NULL,
        `phone` varchar(50) NULL,
        `email` varchar(255) NULL,
        `passport_number` varchar(50) NULL,
        `city` varchar(100) NULL,
        `source` varchar(50) NULL,
        `service_type` varchar(50) NULL,
        `last_activity` datetime(6) NULL,
        `created_at` datetime(6) NOT NULL,
        `updated_at` datetime(6) NOT NULL,
        `is_active` bool NOT NULL DEFAULT 1,
        `branch_id` bigint NULL,
        `organization_id` bigint NULL,
        INDEX `idx_phone` (`phone`),
        INDEX `idx_email` (`email`),
        INDEX `idx_passport` (`passport_number`),
        CONSTRAINT `customers_customer_branch_fk` FOREIGN KEY (`branch_id`) REFERENCES `organization_branch` (`id`) ON DELETE SET NULL,
        CONSTRAINT `customers_customer_org_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization_organization` (`id`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """,
    
    """
    CREATE TABLE `customers_lead` (
        `id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY,
        `full_name` varchar(255) NOT NULL,
        `phone` varchar(50) NULL,
        `email` varchar(255) NULL,
        `passport_number` varchar(50) NULL,
        `cnic` varchar(50) NULL,
        `source` varchar(50) NULL,
        `interest` varchar(100) NULL,
        `status` varchar(20) NOT NULL DEFAULT 'new',
        `created_at` datetime(6) NOT NULL,
        `branch_id` bigint NULL,
        `created_by_id` integer NULL,
        `organization_id` bigint NULL,
        INDEX `idx_phone` (`phone`),
        INDEX `idx_email` (`email`),
        INDEX `idx_passport` (`passport_number`),
        CONSTRAINT `customers_lead_branch_fk` FOREIGN KEY (`branch_id`) REFERENCES `organization_branch` (`id`) ON DELETE SET NULL,
        CONSTRAINT `customers_lead_org_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization_organization` (`id`) ON DELETE SET NULL,
        CONSTRAINT `customers_lead_user_fk` FOREIGN KEY (`created_by_id`) REFERENCES `auth_user` (`id`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """,
    
    """
    CREATE TABLE `customers_followuphistory` (
        `id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY,
        `followup_date` datetime(6) NOT NULL,
        `remarks` longtext NULL,
        `contacted_via` varchar(50) NULL,
        `created_at` datetime(6) NOT NULL,
        `created_by_id` integer NULL,
        `lead_id` bigint NOT NULL,
        CONSTRAINT `customers_followup_lead_fk` FOREIGN KEY (`lead_id`) REFERENCES `customers_lead` (`id`) ON DELETE CASCADE,
        CONSTRAINT `customers_followup_user_fk` FOREIGN KEY (`created_by_id`) REFERENCES `auth_user` (`id`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """,
    
    """
    CREATE TABLE `customers_loancommitment` (
        `id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY,
        `promised_clear_date` date NULL,
        `status` varchar(30) NOT NULL DEFAULT 'pending',
        `remarks` longtext NULL,
        `created_at` datetime(6) NOT NULL,
        `booking_id` bigint NULL,
        `created_by_id` integer NULL,
        `lead_id` bigint NULL,
        CONSTRAINT `customers_loan_lead_fk` FOREIGN KEY (`lead_id`) REFERENCES `customers_lead` (`id`) ON DELETE CASCADE,
        CONSTRAINT `customers_loan_booking_fk` FOREIGN KEY (`booking_id`) REFERENCES `booking_booking` (`id`) ON DELETE SET NULL,
        CONSTRAINT `customers_loan_user_fk` FOREIGN KEY (`created_by_id`) REFERENCES `auth_user` (`id`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """
]

with connection.cursor() as cursor:
    for i, sql in enumerate(sql_commands, 1):
        try:
            cursor.execute(sql)
            print(f"✓ Created table {i}/4")
        except Exception as e:
            print(f"✗ Error creating table {i}: {e}")

    print("\nVerifying tables...")
    cursor.execute("SHOW TABLES LIKE 'customers%'")
    tables = cursor.fetchall()
    print(f"\nFound {len(tables)} customer tables:")
    for table in tables:
        print(f"  - {table[0]}")
