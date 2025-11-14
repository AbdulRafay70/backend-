# Generated migration to add normalized ziyarAt fields and copy data
from django.db import migrations, models


def copy_ziyarat_forward(apps, schema_editor):
    UmrahPackage = apps.get_model('packages', 'UmrahPackage')
    table = schema_editor.quote_name(UmrahPackage._meta.db_table)
    # Copy old columns into new normalized columns where available
    with schema_editor.connection.cursor() as c:
        # Only run if both columns exist
        try:
            c.execute(f"UPDATE {table} SET makkah_ziyarat_purchase_price = makkah_ziarat_purchase_price WHERE makkah_ziarat_purchase_price IS NOT NULL")
        except Exception:
            pass
        try:
            c.execute(f"UPDATE {table} SET madinah_ziyarat_purchase_price = madinah_ziarat_purchase_price WHERE madinah_ziarat_purchase_price IS NOT NULL")
        except Exception:
            pass


def copy_ziyarat_backward(apps, schema_editor):
    UmrahPackage = apps.get_model('packages', 'UmrahPackage')
    table = schema_editor.quote_name(UmrahPackage._meta.db_table)
    with schema_editor.connection.cursor() as c:
        try:
            c.execute(f"UPDATE {table} SET makkah_ziarat_purchase_price = makkah_ziyarat_purchase_price WHERE makkah_ziyarat_purchase_price IS NOT NULL")
        except Exception:
            pass
        try:
            c.execute(f"UPDATE {table} SET madinah_ziarat_purchase_price = madinah_ziyarat_purchase_price WHERE madinah_ziyarat_purchase_price IS NOT NULL")
        except Exception:
            pass


class Migration(migrations.Migration):

    dependencies = [
        ('packages', '0041_demo_food_ziarat'),
    ]

    atomic = False

    operations = [
        migrations.AddField(
            model_name='umrahpackage',
            name='makkah_ziyarat_purchase_price',
            field=models.FloatField(default=0),
        ),
        migrations.AddField(
            model_name='umrahpackage',
            name='madinah_ziyarat_purchase_price',
            field=models.FloatField(default=0),
        ),
        migrations.RunPython(copy_ziyarat_forward, copy_ziyarat_backward),
    ]
