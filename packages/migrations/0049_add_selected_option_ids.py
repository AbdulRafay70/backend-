from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('packages', '0048_remove_umrahpackage_adault_visa_price_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='umrahpackage',
            name='food_price_id',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='umrahpackage',
            name='makkah_ziyarat_id',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='umrahpackage',
            name='madinah_ziyarat_id',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
