from django.db import migrations


def ensure_transport_price_columns(apps, schema_editor):
    # Add transport_selling_price and transport_purchase_price to both
    # `packages_umrahpackagetransportdetails` and
    # `packages_customumrahpackagetransportdetails` if they don't exist.
    # Use raw SQL with try/except so this is safe to run multiple times
    # and across environments where the column may already exist.
    with schema_editor.connection.cursor() as c:
        try:
            c.execute("ALTER TABLE %s ADD COLUMN transport_selling_price DOUBLE DEFAULT 0" % schema_editor.quote_name('packages_umrahpackagetransportdetails'))
        except Exception:
            pass
        try:
            c.execute("ALTER TABLE %s ADD COLUMN transport_purchase_price DOUBLE DEFAULT 0" % schema_editor.quote_name('packages_umrahpackagetransportdetails'))
        except Exception:
            pass
        try:
            c.execute("ALTER TABLE %s ADD COLUMN transport_selling_price DOUBLE DEFAULT 0" % schema_editor.quote_name('packages_customumrahpackagetransportdetails'))
        except Exception:
            pass
        try:
            c.execute("ALTER TABLE %s ADD COLUMN transport_purchase_price DOUBLE DEFAULT 0" % schema_editor.quote_name('packages_customumrahpackagetransportdetails'))
        except Exception:
            pass


class Migration(migrations.Migration):

    dependencies = [
        ('packages', '0044_customumrahpackagetransportdetails_transport_purchase_price_and_more'),
    ]

    operations = [
        migrations.RunPython(ensure_transport_price_columns, reverse_code=migrations.RunPython.noop),
    ]
