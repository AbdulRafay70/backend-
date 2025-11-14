"""Add OperationLog model and housekeeping_done field to HotelOperation.

Generated manually.
"""
from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('operations', '0009_ziyaratoperation'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('tickets', '0013_remove_hotels_google_drive_link'),
    ]

    operations = [
        migrations.AddField(
            model_name='hoteloperation',
            name='housekeeping_done',
            field=models.BooleanField(default=False, help_text='Set true when housekeeping marks cleaning done for this operation'),
        ),
        migrations.CreateModel(
            name='OperationLog',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(choices=[('manual_override', 'Manual Override'), ('cleaning_done', 'Cleaning Done'), ('assign', 'Assign Bed'), ('free', 'Free Bed')], max_length=50)),
                ('performed_by_username', models.CharField(blank=True, max_length=150, null=True)),
                ('prev_status', models.CharField(blank=True, max_length=50, null=True)),
                ('new_status', models.CharField(blank=True, max_length=50, null=True)),
                ('reason', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('hotel', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='operation_logs', to='tickets.Hotels')),
                ('performed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='operation_logs', to=settings.AUTH_USER_MODEL)),
                ('room', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='operation_logs', to='operations.RoomMap')),
            ],
            options={
                'db_table': 'operations_operationlog',
                'ordering': ['-created_at'],
            },
        ),
    ]
