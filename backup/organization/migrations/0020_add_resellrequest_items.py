from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("organization", "0019_resellrequest"),
    ]

    operations = [
        migrations.AddField(
            model_name="resellrequest",
            name="items",
            field=models.JSONField(default=list, blank=True),
        ),
    ]
