from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('booking', '0063_add_group_type_to_discountgroup'),
        ('organization', '0007_agency_credit_and_assign'),
    ]

    operations = [
        migrations.AddField(
            model_name='payment',
            name='agent_bank',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='agent_payments', to='booking.bank'),
        ),
        migrations.AddField(
            model_name='payment',
            name='organization_bank',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='organization_payments', to='booking.bank'),
        ),
        migrations.AddField(
            model_name='payment',
            name='kuickpay_trn',
            field=models.CharField(blank=True, max_length=128, null=True),
        ),
    ]
