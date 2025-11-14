from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tickets', '0021_hotelprices_profit_hotelprices_purchase_price'),
    ]

    operations = [
        migrations.AddField(
            model_name='ticket',
            name='adult_purchase_price',
            field=models.FloatField(default=0, help_text='Purchase price for adult ticket'),
        ),
        migrations.AddField(
            model_name='ticket',
            name='child_purchase_price',
            field=models.FloatField(default=0, help_text='Purchase price for child ticket'),
        ),
        migrations.AddField(
            model_name='ticket',
            name='infant_purchase_price',
            field=models.FloatField(default=0, help_text='Purchase price for infant ticket'),
        ),
    ]
