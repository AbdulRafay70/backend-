from django.db import migrations


def add_vehicletype_personal_price_fields(apps, schema_editor):
    table = schema_editor.quote_name('vehicle_type')
    stmts = [
        f"ALTER TABLE {table} ADD COLUMN adult_selling_price DOUBLE DEFAULT 0",
        f"ALTER TABLE {table} ADD COLUMN adult_purchase_price DOUBLE DEFAULT 0",
        f"ALTER TABLE {table} ADD COLUMN child_selling_price DOUBLE DEFAULT 0",
        f"ALTER TABLE {table} ADD COLUMN child_purchase_price DOUBLE DEFAULT 0",
        f"ALTER TABLE {table} ADD COLUMN infant_selling_price DOUBLE DEFAULT 0",
        f"ALTER TABLE {table} ADD COLUMN infant_purchase_price DOUBLE DEFAULT 0",
    ]
    with schema_editor.connection.cursor() as c:
        for s in stmts:
            try:
                c.execute(s)
            except Exception:
                # ignore failures so migration is safe to re-run in different environments
                pass


class Migration(migrations.Migration):

    dependencies = [
        ('booking', '0081_trnsequence'),
    ]

    operations = [
        migrations.RunPython(add_vehicletype_personal_price_fields, reverse_code=migrations.RunPython.noop),
    ]
