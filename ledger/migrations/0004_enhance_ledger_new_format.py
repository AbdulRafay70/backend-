# Generated migration for enhanced ledger entry format
# This migration has been applied manually via SQL
# All changes are already in the database

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('ledger', '0003_enhance_ledger_for_client_requirements'),
    ]

    operations = [
        # This migration has been applied manually via SQL
        # Schema changes already exist in database:
        # - Added transaction_amount (Decimal)
        # - Added final_balance (Decimal)
        # - Added seller_organization_id (FK)
        # - Added inventory_owner_organization_id (FK)
        # - Added area_agency_id (FK)
        # - Added payment_ids (JSON)
        # - Added group_ticket_count (Integer)
        # - Added umrah_visa_count (Integer)
        # - Added hotel_nights_count (Integer)
        # - Updated help texts and comments
        migrations.RunSQL(
            sql=migrations.RunSQL.noop,
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]

