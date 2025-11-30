from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('packages', '0054_add_visa_option_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='onlyvisaprice',
            name='title',
            field=models.CharField(max_length=255, null=True, blank=True),
        ),
        migrations.AddField(
            model_name='onlyvisaprice',
            name='is_transport',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='onlyvisaprice',
            name='sectors',
            field=models.ManyToManyField(blank=True, related_name='only_visa_prices', to='booking.sector'),
        ),
    ]
