"""Alter assigned_to from FK to CharField on Lead.

This migration converts the `assigned_to` column to a varchar column so the API
can accept arbitrary strings for assignee identifiers.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("leads", "0007_add_task_type_field"),
    ]

    operations = [
        # Remove the existing ForeignKey column (assigned_to -> assigned_to_id)
        migrations.RemoveField(
            model_name="lead",
            name="assigned_to",
        ),
        # Add a free-text `assigned_to` CharField
        migrations.AddField(
            model_name="lead",
            name="assigned_to",
            field=models.CharField(max_length=255, null=True, blank=True),
        ),
    ]
