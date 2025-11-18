"""Add allowed_types JSONField to AllowedReseller.

This migration is idempotent for environments that already have the column
applied directly to the database (use --fake to mark it applied there).
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("booking", "0065_alter_discount_discounted_hotels"),
    ]

    operations = [
        migrations.AddField(
            model_name="allowedreseller",
            name="allowed_types",
            field=models.JSONField(default=list),
        ),
    ]
