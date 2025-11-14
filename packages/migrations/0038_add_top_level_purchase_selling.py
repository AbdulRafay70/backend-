from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('packages', '0037_umrahpackagehoteldetails_double_bed_purchase_price_and_more'),
    ]

    operations = [
        # Visa selling/purchase
        migrations.AddField(
            model_name='umrahpackage',
            name='adault_visa_selling_price',
            field=models.FloatField(default=0),
        ),
        migrations.AddField(
            model_name='umrahpackage',
            name='adault_visa_purchase_price',
            field=models.FloatField(default=0),
        ),
        migrations.AddField(
            model_name='umrahpackage',
            name='child_visa_selling_price',
            field=models.FloatField(default=0),
        ),
        migrations.AddField(
            model_name='umrahpackage',
            name='child_visa_purchase_price',
            field=models.FloatField(default=0),
        ),
        migrations.AddField(
            model_name='umrahpackage',
            name='infant_visa_selling_price',
            field=models.FloatField(default=0),
        ),
        migrations.AddField(
            model_name='umrahpackage',
            name='infant_visa_purchase_price',
            field=models.FloatField(default=0),
        ),

        # Food
        migrations.AddField(
            model_name='umrahpackage',
            name='food_selling_price',
            field=models.FloatField(default=0),
        ),
        migrations.AddField(
            model_name='umrahpackage',
            name='food_purchase_price',
            field=models.FloatField(default=0),
        ),

        # Makkah ziarat
        migrations.AddField(
            model_name='umrahpackage',
            name='makkah_ziyarat_selling_price',
            field=models.FloatField(default=0),
        ),
        migrations.AddField(
            model_name='umrahpackage',
            name='makkah_ziarat_purchase_price',
            field=models.FloatField(default=0),
        ),

        # Madinah ziarat
        migrations.AddField(
            model_name='umrahpackage',
            name='madinah_ziyarat_selling_price',
            field=models.FloatField(default=0),
        ),
        migrations.AddField(
            model_name='umrahpackage',
            name='madinah_ziyarat_purchase_price',
            field=models.FloatField(default=0),
        ),

        # Transport
        migrations.AddField(
            model_name='umrahpackage',
            name='transport_selling_price',
            field=models.FloatField(default=0),
        ),
        migrations.AddField(
            model_name='umrahpackage',
            name='transport_purchase_price',
            field=models.FloatField(default=0),
        ),
    ]
