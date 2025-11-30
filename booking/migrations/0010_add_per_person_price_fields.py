from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('booking', '0009_vehicletype'),
    ]

    operations = [
        migrations.AddField(
            model_name='vehicletype',
            name='adult_selling_price',
            field=models.FloatField(default=0),
        ),
        migrations.AddField(
            model_name='vehicletype',
            name='adult_purchase_price',
            field=models.FloatField(default=0),
        ),
        migrations.AddField(
            model_name='vehicletype',
            name='child_selling_price',
            field=models.FloatField(default=0),
        ),
        migrations.AddField(
            model_name='vehicletype',
            name='child_purchase_price',
            field=models.FloatField(default=0),
        ),
        migrations.AddField(
            model_name='vehicletype',
            name='infant_selling_price',
            field=models.FloatField(default=0),
        ),
        migrations.AddField(
            model_name='vehicletype',
            name='infant_purchase_price',
            field=models.FloatField(default=0),
        ),
    ]
