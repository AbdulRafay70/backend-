"""Add FollowUp model

Revision ID: 0003_add_followup
Revises: 0002_alter_lead_booking_alter_loancommitment_booking
Create Date: 2025-10-31 00:00
"""
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('leads', '0002_alter_lead_booking_alter_loancommitment_booking'),
    ]

    operations = [
        migrations.CreateModel(
            name='FollowUp',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('due_date', models.DateTimeField(blank=True, null=True)),
                ('remaining_amount', models.DecimalField(decimal_places=2, max_digits=12, default=0)),
                ('status', models.CharField(choices=[('open', 'Open'), ('pending', 'Pending'), ('closed', 'Closed')], default='open', max_length=16)),
                ('notes', models.TextField(blank=True, null=True)),
                ('closed_at', models.DateTimeField(blank=True, null=True)),
                ('booking', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='followups', to='booking.booking')),
                ('lead', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='followups', to='leads.lead')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='auth.user')),
            ],
        ),
        migrations.AddIndex(
            model_name='followup',
            index=models.Index(fields=['status'], name='leads_followup_status_idx'),
        ),
        migrations.AddIndex(
            model_name='followup',
            index=models.Index(fields=['due_date'], name='leads_followup_due_date_idx'),
        ),
    ]
