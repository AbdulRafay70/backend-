from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('organization', '0006_create_organizationlink'),
    ]

    operations = [
        migrations.AddField(
            model_name='agency',
            name='credit_limit',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True),
        ),
        migrations.AddField(
            model_name='agency',
            name='credit_limit_days',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='agency',
            name='agency_type',
            field=models.CharField(blank=True, choices=[('Area Agency', 'Area Agency'), ('Full Agency', 'Full Agency')], max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='agency',
            name='agency_id',
            field=models.CharField(blank=True, max_length=6, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='agency',
            name='assign_to',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='managed_agencies', to=settings.AUTH_USER_MODEL),
        ),
    ]
