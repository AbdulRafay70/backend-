"""
Add missing agent FK field to PaxMovement.

This migration addresses a schema drift where the agent field was recorded as added
in migration history but the actual DB table lacked the `agent_id` column.
"""
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('pax_movements', '0003_add_missing_paxmovement_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='paxmovement',
            name='agent',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='agent_pax_movements', to=settings.AUTH_USER_MODEL),
        ),
    ]
