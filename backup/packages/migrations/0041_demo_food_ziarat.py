from django.db import migrations, models


def create_demo_data(apps, schema_editor):
    Organization = apps.get_model('organization', 'Organization')
    City = apps.get_model('packages', 'City')
    FoodPrice = apps.get_model('packages', 'FoodPrice')
    ZiaratPrice = apps.get_model('packages', 'ZiaratPrice')

    # Choose an organization: prefer org with id=11 used in dev helpers, else first org
    org = Organization.objects.filter(id=11).first() or Organization.objects.first()
    if not org:
        return

    # Create or get cities
    # Use filter().first() to avoid MultipleObjectsReturned in environments
    makkah = City.objects.filter(organization=org, name__iexact='Makkah').first()
    if not makkah:
        makkah = City.objects.create(organization=org, name='Makkah', code='MAK')
    madina = City.objects.filter(organization=org, name__iexact='Madina').first()
    if not madina:
        madina = City.objects.create(organization=org, name='Madina', code='MAD')

    # Create food demo entries (purchase_price set, selling `price` left as 0)
    # Insert demo food records via raw SQL so we can set purchase_price
    fp_table = FoodPrice._meta.db_table
    schema_editor.execute(
        "INSERT INTO %s (organization_id, city_id, description, title, min_pex, per_pex, active, price, purchase_price) VALUES (%%s, %%s, %%s, %%s, %%s, %%s, %%s, %%s, %%s)" % schema_editor.quote_name(fp_table),
        [org.id, makkah.id, 'Demo food option for Makkah', 'Makkah Standard Meal', 1, 1, True, 0, 200],
    )
    schema_editor.execute(
        "INSERT INTO %s (organization_id, city_id, description, title, min_pex, per_pex, active, price, purchase_price) VALUES (%%s, %%s, %%s, %%s, %%s, %%s, %%s, %%s, %%s)" % schema_editor.quote_name(fp_table),
        [org.id, madina.id, 'Demo food option for Madina', 'Madina Standard Meal', 1, 1, True, 0, 180],
    )

    # Create ziarat demo entries (purchase_price set, selling `price` left as 0)
    zp_table = ZiaratPrice._meta.db_table
    schema_editor.execute(
        "INSERT INTO %s (organization_id, city_id, ziarat_title, description, contact_person, contact_number, price, purchase_price, status, min_pex, max_pex) VALUES (%%s, %%s, %%s, %%s, %%s, %%s, %%s, %%s, %%s, %%s, %%s)" % schema_editor.quote_name(zp_table),
        [org.id, makkah.id, 'Makkah Ziyarat Demo', 'Demo Mecca ziarat entry', 'Demo Contact', '0000000000', 0, 500, 'active', 1, 5],
    )
    schema_editor.execute(
        "INSERT INTO %s (organization_id, city_id, ziarat_title, description, contact_person, contact_number, price, purchase_price, status, min_pex, max_pex) VALUES (%%s, %%s, %%s, %%s, %%s, %%s, %%s, %%s, %%s, %%s, %%s)" % schema_editor.quote_name(zp_table),
        [org.id, madina.id, 'Madina Ziyarat Demo', 'Demo Madina ziarat entry', 'Demo Contact', '0000000000', 0, 450, 'active', 1, 5],
    )


def remove_demo_data(apps, schema_editor):
    FoodPrice = apps.get_model('packages', 'FoodPrice')
    ZiaratPrice = apps.get_model('packages', 'ZiaratPrice')

    FoodPrice.objects.filter(title__icontains='Standard Meal').delete()
    ZiaratPrice.objects.filter(ziarat_title__icontains='Demo').delete()


class Migration(migrations.Migration):
    # Some DB backends (MySQL) do not allow certain statements inside
    # transactions during migrations; run this migration non-transactionally.
    atomic = False

    dependencies = [
        ('packages', '0040_fill_top_level_prices'),
    ]

    operations = [
        # Note: `purchase_price` may already exist in some databases. We only
        # run the data insertion here. The model file was updated to include
        # the `purchase_price` field — if your DB already has these columns
        # the AddField steps were omitted to avoid duplicate-column errors.
        migrations.RunPython(create_demo_data, remove_demo_data),
    ]
