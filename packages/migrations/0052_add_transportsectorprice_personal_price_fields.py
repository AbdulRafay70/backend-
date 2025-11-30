from django.db import migrations


def add_transportsectorprice_personal_price_fields(apps, schema_editor):
    # Use raw SQL with try/except so this migration is idempotent and safe
    table = schema_editor.quote_name('packages_transportsectorprice')
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
                # ignore failures (column may already exist on some environments)
                pass


class Migration(migrations.Migration):

    dependencies = [
        ('packages', '0051_remove_umrahpackage_adault_visa_price_and_more'),
    ]

    operations = [
        migrations.RunPython(add_transportsectorprice_personal_price_fields, reverse_code=migrations.RunPython.noop),
    ]
