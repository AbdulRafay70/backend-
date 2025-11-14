"""Add commission_id to UserProfile

Revision ID: 0004_add_commission_id
Revises: 0003_remove_userprofile_address_and_more
Create Date: 2025-10-30 00:00
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0003_remove_userprofile_address_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="commission_id",
            field=models.CharField(max_length=64, null=True, blank=True),
        ),
    ]
