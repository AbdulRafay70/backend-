from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("booking", "0068_booking_is_outsourced_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name='booking',
            name='public_ref',
            field=models.CharField(max_length=128, null=True, blank=True, unique=True),
        ),
    ]
