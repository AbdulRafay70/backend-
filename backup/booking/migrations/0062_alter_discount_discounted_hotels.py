from django.db import migrations, models


def forwards_func(apps, schema_editor):
    Discount = apps.get_model('booking', 'Discount')
    Hotels = apps.get_model('tickets', 'Hotels')
    # Copy any existing integer hotel id into the new m2m relation
    for disc in Discount.objects.all():
        try:
            hid = getattr(disc, 'discounted_hotels', None)
            if hid:
                try:
                    hotel = Hotels.objects.get(pk=hid)
                    disc.discounted_hotels.add(hotel)
                except Hotels.DoesNotExist:
                    # skip if referenced hotel missing
                    continue
        except Exception:
            continue


def reverse_func(apps, schema_editor):
    # On reverse, we won't attempt to restore the old integer field reliably.
    return


class Migration(migrations.Migration):

    dependencies = [
        ('booking', '0061_add_booking_fields'),
        ('tickets', '0012_ticket_owner_reselling'),
    ]

    operations = [
        # Add a temporary M2M field
        migrations.AddField(
            model_name='discount',
            name='discounted_hotels_tmp',
            field=models.ManyToManyField(related_name='discounts_tmp', to='tickets.Hotels', blank=True),
        ),
        migrations.RunPython(forwards_func, reverse_func),
        # Remove old integer field if it exists (safe to ignore if already removed)
        migrations.RemoveField(
            model_name='discount',
            name='discounted_hotels',
        ),
        # Rename tmp field to the canonical name
        migrations.RenameField(
            model_name='discount',
            old_name='discounted_hotels_tmp',
            new_name='discounted_hotels',
        ),
    ]
