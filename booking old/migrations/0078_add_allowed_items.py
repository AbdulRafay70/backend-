from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("booking", "0077_payment_ledger_entry_id_payment_payment_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="allowedreseller",
            name="allowed_items",
            field=models.JSONField(default=list, blank=True),
        ),
    ]
