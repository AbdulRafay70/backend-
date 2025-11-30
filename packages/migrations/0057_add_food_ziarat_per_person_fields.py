from django.db import migrations


def add_missing_columns(apps, schema_editor):
    tables = ['packages_foodprice', 'packages_ziaratprice']
    cols = [
        ('adult_selling_price', 'FLOAT DEFAULT 0'),
        ('adult_purchase_price', 'FLOAT DEFAULT 0'),
        ('child_selling_price', 'FLOAT DEFAULT 0'),
        ('child_purchase_price', 'FLOAT DEFAULT 0'),
        ('infant_selling_price', 'FLOAT DEFAULT 0'),
        ('infant_purchase_price', 'FLOAT DEFAULT 0'),
    ]

    conn = schema_editor.connection
    with conn.cursor() as c:
        for table in tables:
            for col_name, col_def in cols:
                # Check if column exists
                c.execute(
                    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=%s AND COLUMN_NAME=%s",
                    (table, col_name),
                )
                exists = c.fetchone()[0]
                if not exists:
                    stmt = f"ALTER TABLE `{table}` ADD COLUMN `{col_name}` {col_def};"
                    try:
                        c.execute(stmt)
                    except Exception:
                        # If it fails, raise to surface the issue
                        raise


class Migration(migrations.Migration):

    dependencies = [
        ('packages', '0056_merge_0054_0055'),
    ]

    operations = [
        migrations.RunPython(add_missing_columns, migrations.RunPython.noop),
    ]
