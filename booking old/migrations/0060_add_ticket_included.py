from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("booking", "0059_update_allowedreseller"),
    ]

    operations = [
        migrations.AddField(
            model_name="bookingpersondetail",
            name="ticket_included",
            field=models.BooleanField(default=True),
        ),
    ]
