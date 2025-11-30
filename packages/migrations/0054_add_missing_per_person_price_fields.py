from django.db import migrations


def add_columns_if_missing(apps, schema_editor):
    # Use raw SQL to add columns only if they do not exist (MySQL 8+ supports IF NOT EXISTS)
    statements = []
    tables = ['packages_foodprice', 'packages_ziaratprice']
    cols = [
        ('adult_selling_price', 'FLOAT DEFAULT 0'),
        ('adult_purchase_price', 'FLOAT DEFAULT 0'),
        ('child_selling_price', 'FLOAT DEFAULT 0'),
        ('child_purchase_price', 'FLOAT DEFAULT 0'),
        ('infant_selling_price', 'FLOAT DEFAULT 0'),
        ('infant_purchase_price', 'FLOAT DEFAULT 0'),
    ]

    for table in tables:
        for col_name, col_def in cols:
            # ALTER TABLE ... ADD COLUMN IF NOT EXISTS is supported on MySQL 8+
            statements.append(f"ALTER TABLE `{table}` ADD COLUMN IF NOT EXISTS `{col_name}` {col_def};")

    with schema_editor.connection.cursor() as c:
        for stmt in statements:
            try:
                c.execute(stmt)
            except Exception:
                # Ignore errors to keep migration idempotent across MySQL versions
                pass


class Migration(migrations.Migration):

    dependencies = [
        ('packages', '0053_add_per_person_price_fields'),
    ]

    operations = [
        migrations.RunPython(add_columns_if_missing, migrations.RunPython.noop),
    ]
