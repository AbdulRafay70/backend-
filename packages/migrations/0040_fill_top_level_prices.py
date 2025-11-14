from django.db import migrations


def forwards(apps, schema_editor):
    UmrahPackage = apps.get_model('packages', 'UmrahPackage')
    # mapping: (legacy_field, selling_field, purchase_field)
    fields = [
        ('adault_visa_price', 'adault_visa_selling_price', 'adault_visa_purchase_price'),
        ('child_visa_price', 'child_visa_selling_price', 'child_visa_purchase_price'),
        ('infant_visa_price', 'infant_visa_selling_price', 'infant_visa_purchase_price'),
        ('food_price', 'food_selling_price', 'food_purchase_price'),
        ('makkah_ziyarat_price', 'makkah_ziyarat_selling_price', 'makkah_ziyarat_purchase_price'),
        ('madinah_ziyarat_price', 'madinah_ziarat_selling_price', 'madinah_ziarat_purchase_price'),
        ('transport_price', 'transport_selling_price', 'transport_purchase_price'),
    ]

    for pkg in UmrahPackage.objects.all():
        changed = False
        for legacy, sell, purchase in fields:
            legacy_val = getattr(pkg, legacy, None)
            sell_val = getattr(pkg, sell, None)
            purchase_val = getattr(pkg, purchase, None)

            # If selling is falsy (None or 0), and legacy has value, copy legacy -> selling
            try:
                if (sell_val is None or float(sell_val) == 0) and (legacy_val is not None and float(legacy_val) != 0):
                    setattr(pkg, sell, float(legacy_val))
                    changed = True
            except Exception:
                # ignore conversion errors
                pass

            # If purchase is falsy (None or 0), set to selling if selling has value
            try:
                curr_sell = getattr(pkg, sell, None)
                if (purchase_val is None or float(purchase_val) == 0) and (curr_sell is not None and float(curr_sell) != 0):
                    setattr(pkg, purchase, float(curr_sell))
                    changed = True
            except Exception:
                pass

        if changed:
            pkg.save()


def reverse(apps, schema_editor):
    # This migration is intentionally irreversible because restoring previous state is non-trivial.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('packages', '0039_rename_madinah_ziyarat_purchase_price_umrahpackage_madinah_ziarat_purchase_price'),
    ]

    operations = [
        migrations.RunPython(forwards, reverse),
    ]
