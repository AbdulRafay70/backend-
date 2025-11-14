from django.db import connection

print('Checking booking_allowedreseller.allowed column...')
with connection.cursor() as cursor:
    cursor.execute("SELECT IS_NULLABLE, COLUMN_DEFAULT, DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=%s AND COLUMN_NAME='allowed'", ['booking_allowedreseller'])
    row = cursor.fetchone()
    print('info:', row)
    if row:
        is_nullable, col_default, data_type = row
        if is_nullable == 'NO' and col_default is None:
            print('Column exists, NOT NULL and has no default — attempting ALTER')
            try:
                if (data_type or '').lower() == 'json':
                    cursor.execute("ALTER TABLE booking_allowedreseller MODIFY COLUMN `allowed` JSON NOT NULL DEFAULT '[]'")
                else:
                    try:
                        cursor.execute("ALTER TABLE booking_allowedreseller MODIFY COLUMN `allowed` TEXT NOT NULL DEFAULT '[]'")
                    except Exception as e:
                        print('Default not allowed on TEXT; attempting to make column nullable:', e)
                        cursor.execute("ALTER TABLE booking_allowedreseller MODIFY COLUMN `allowed` LONGTEXT NULL")
                print('ALTER executed successfully')
            except Exception as e:
                print('ALTER failed:', e)
        else:
            print('No action needed — column nullable or has default')
    else:
        print('Column not present in information_schema — nothing to do')
print('Done')
