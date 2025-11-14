# Generated manually to add missing fields to FinancialRecord model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('organization', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('finance', '0003_alter_auditlog_actor_alter_chartofaccount_branch_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='financialrecord',
            name='agent',
            field=models.ForeignKey(blank=True, db_constraint=False, null=True, on_delete=django.db.models.deletion.SET_NULL, to='organization.agency'),
        ),
        migrations.AddField(
            model_name='financialrecord',
            name='reference_no',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='financialrecord',
            name='description',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='financialrecord',
            name='status',
            field=models.CharField(default='active', max_length=20),
        ),
        migrations.AddField(
            model_name='financialrecord',
            name='created_by',
            field=models.ForeignKey(blank=True, db_constraint=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='financialrecords_created', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='financialrecord',
            name='last_updated_by',
            field=models.ForeignKey(blank=True, db_constraint=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='financialrecords_updated', to=settings.AUTH_USER_MODEL),
        ),
    ]
