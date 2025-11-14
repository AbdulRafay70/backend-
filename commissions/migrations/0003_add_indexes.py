from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("commissions", "0002_commissionrule_inventory_item_id_and_more"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="commissionearning",
            index=models.Index(fields=["booking_id"], name="comm_e_booking_id_idx"),
        ),
        migrations.AddIndex(
            model_name="commissionearning",
            index=models.Index(fields=["status"], name="comm_e_status_idx"),
        ),
        migrations.AddIndex(
            model_name="commissionearning",
            index=models.Index(fields=["redeemed"], name="comm_e_redeemed_idx"),
        ),
        migrations.AddIndex(
            model_name="commissionrule",
            index=models.Index(fields=["organization_id"], name="comm_rule_org_id_idx"),
        ),
    ]
