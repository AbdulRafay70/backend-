from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('packages', '0053_add_per_person_price_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='onlyvisaprice',
            name='visa_option',
            field=models.CharField(choices=[('only', 'Only'), ('long_term', 'Long Term')], default='only', max_length=20),
        ),
        migrations.AddField(
            model_name='onlyvisaprice',
            name='validity_days',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='onlyvisaprice',
            name='multi_entry',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='onlyvisaprice',
            name='long_term_discount_pct',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True),
        ),
    ]
