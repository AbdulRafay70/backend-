from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('booking', '0062_alter_discount_discounted_hotels'),
    ]

    operations = [
        migrations.AddField(
            model_name='discountgroup',
            name='group_type',
            field=models.CharField(max_length=100, null=True, blank=True),
        ),
    ]
