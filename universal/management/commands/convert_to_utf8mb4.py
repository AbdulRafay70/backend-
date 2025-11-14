"""
Management command to convert all database tables to utf8mb4 charset.
This fixes Unicode encoding issues with special characters.

Usage:
    python manage.py convert_to_utf8mb4
"""
from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Convert all database tables to utf8mb4 charset for full Unicode support'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show SQL commands without executing them',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        with connection.cursor() as cursor:
            # Get database name
            cursor.execute("SELECT DATABASE()")
            db_name = cursor.fetchone()[0]
            
            self.stdout.write(self.style.WARNING(
                f'\n{"DRY RUN - " if dry_run else ""}Converting database: {db_name} to utf8mb4\n'
            ))
            
            # 1. Convert database default charset
            sql_db = f"ALTER DATABASE {db_name} CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci"
            self.stdout.write(f"Database: {sql_db}")
            if not dry_run:
                cursor.execute(sql_db)
                self.stdout.write(self.style.SUCCESS('✓ Database converted'))
            
            # 2. Get all tables
            cursor.execute("SHOW TABLES")
            tables = [table[0] for table in cursor.fetchall()]
            
            self.stdout.write(f'\nFound {len(tables)} tables to convert:\n')
            
            # 3. Convert each table
            success_count = 0
            error_count = 0
            
            for table in tables:
                sql_table = f"ALTER TABLE {table} CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
                
                try:
                    if dry_run:
                        self.stdout.write(f"  {table}: {sql_table}")
                    else:
                        cursor.execute(sql_table)
                        self.stdout.write(self.style.SUCCESS(f'✓ {table}'))
                        success_count += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'✗ {table}: {str(e)}'))
                    error_count += 1
            
            # Summary
            self.stdout.write('\n' + '='*60)
            if dry_run:
                self.stdout.write(self.style.WARNING(
                    f'DRY RUN: Would convert {len(tables)} tables'
                ))
                self.stdout.write('\nRun without --dry-run to apply changes')
            else:
                self.stdout.write(self.style.SUCCESS(
                    f'✓ Successfully converted {success_count} tables'
                ))
                if error_count > 0:
                    self.stdout.write(self.style.ERROR(
                        f'✗ Failed to convert {error_count} tables'
                    ))
                self.stdout.write('\n✓ Database is now using utf8mb4 charset')
                self.stdout.write('✓ Special characters (arrows, emojis, etc.) will now work correctly')
