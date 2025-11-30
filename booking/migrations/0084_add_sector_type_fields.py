from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('booking', '0083_alter_vehicletype_price'),
    ]

    operations = [
        migrations.AddField(
            model_name='sector',
            name='sector_type',
            field=models.CharField(choices=[('AIRPORT PICKUP', 'Airport Pickup'), ('AIRPORT DROP', 'Airport Drop'), ('HOTEL TO HOTEL', 'Hotel to Hotel')], max_length=32, null=True, blank=True),
        ),
        migrations.AddField(
            model_name='sector',
            name='is_airport_pickup',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='sector',
            name='is_airport_drop',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='sector',
            name='is_hotel_to_hotel',
            field=models.BooleanField(default=False),
        ),
    ]
