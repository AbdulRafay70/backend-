"""Add commission_id to Branch and Agency

Revision ID: 0012_add_commission_id
Revises: 0011_alter_rule_created_by_alter_rule_updated_by_and_more
Create Date: 2025-10-30 00:00
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("organization", "0011_alter_rule_created_by_alter_rule_updated_by_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="branch",
            name="commission_id",
            field=models.CharField(max_length=64, null=True, blank=True),
        ),
        migrations.AddField(
            model_name="agency",
            name="commission_id",
            field=models.CharField(max_length=64, null=True, blank=True),
        ),
    ]
