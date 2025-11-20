from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('packages', '0046_remove_umrahpackage_adault_visa_price_and_more'),
    ]

    operations = [
        migrations.RenameField(
            model_name='umrahpackage',
            old_name='markup_percent',
            new_name='profit_percent',
        ),
        migrations.RemoveField(
            model_name='umrahpackage',
            name='tax_rate',
        ),
    ]
