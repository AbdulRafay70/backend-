from django.db import migrations, models


def forwards_func(apps, schema_editor):
    Hotels = apps.get_model('tickets', 'Hotels')
    # Backfill owner_organization_id from existing organization FK
    for h in Hotels.objects.all():
        try:
            h.owner_organization_id = h.organization_id
            h.save(update_fields=['owner_organization_id'])
        except Exception:
            continue


def reverse_func(apps, schema_editor):
    Hotels = apps.get_model('tickets', 'Hotels')
    for h in Hotels.objects.all():
        try:
            h.owner_organization_id = None
            h.save(update_fields=['owner_organization_id'])
        except Exception:
            continue


class Migration(migrations.Migration):

    dependencies = [
        ('tickets', '0030_hotels_walking_time_alter_hotelcategory_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='hotels',
            name='owner_organization_id',
            field=models.IntegerField(blank=True, null=True, help_text='Organization that owns this inventory'),
        ),
        migrations.RunPython(forwards_func, reverse_func),
    ]
