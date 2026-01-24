# Generated manually to fix Employee model restructure

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('organization', '0023_branch_service_charge_group'),
    ]

    operations = [
        # Step 1: Remove agency field (table is empty so this is safe)
        migrations.RemoveField(
            model_name='employee',
            name='agency',
        ),
        # Step 2: Add branch field
        migrations.AddField(
            model_name='employee',
            name='branch',
            field=models.ForeignKey(
                default=1,  # Temporary default for migration
                help_text='Branch this employee belongs to',
                on_delete=django.db.models.deletion.CASCADE,
                related_name='branch_employees',
                to='organization.branch'
            ),
            preserve_default=False,  # Remove default after migration
        ),
    ]
