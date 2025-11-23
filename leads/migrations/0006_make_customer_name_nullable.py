from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("leads", "0005_add_extra_lead_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="lead",
            name="customer_full_name",
            field=models.CharField(max_length=255, null=True, blank=True),
        ),
    ]
