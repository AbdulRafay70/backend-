# Migration to remove `user` field from Employee model
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('hr', '0002_add_contact_fields'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='employee',
            name='user',
        ),
    ]
