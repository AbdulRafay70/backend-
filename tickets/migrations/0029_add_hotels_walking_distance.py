"""
Migration to add walking_distance to Hotels model.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tickets', '0028_add_hotelcategory'),
    ]

    operations = [
        migrations.AddField(
            model_name='hotels',
            name='walking_distance',
            field=models.FloatField(default=0, help_text='Walking distance in meters from reference point'),
        ),
    ]
