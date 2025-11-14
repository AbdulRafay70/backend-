from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tickets', '0025_hotels_walking_time_minutes'),
    ]

    operations = [
        migrations.AddField(
            model_name='hotelprices',
            name='purchase_price',
            field=models.FloatField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='hotelprices',
            name='profit',
            field=models.FloatField(blank=True, default=0, null=True),
        ),
    ]
