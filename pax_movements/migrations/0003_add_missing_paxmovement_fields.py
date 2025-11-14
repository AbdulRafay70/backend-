"""
Add missing PaxMovement fields that appear to be absent from the DB.

This migration is a safe additive migration to create columns that exist on the model
but are missing in the database (likely due to earlier migration state mismatch).
"""
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('pax_movements', '0002_paxmovement_agent_paxmovement_arrival_airport_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='paxmovement',
            name='arrival_airport',
            field=models.CharField(blank=True, help_text='Arrival airport name/code', max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='paxmovement',
            name='departure_airport',
            field=models.CharField(blank=True, help_text='Departure airport name/code', max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='paxmovement',
            name='organization',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='pax_movements', to='organization.organization'),
        ),
        migrations.AddField(
            model_name='paxmovement',
            name='passport_expiry',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='paxmovement',
            name='passport_number',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='paxmovement',
            name='reported_to_shirka',
            field=models.BooleanField(default=False, help_text='Whether this movement has been reported to Shirka'),
        ),
        migrations.AddField(
            model_name='paxmovement',
            name='shirka_report_date',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
