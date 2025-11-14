from django.test import TestCase
from django.contrib.auth.models import User
from organization.models import Organization, Branch, Agency
from booking.models import Booking
from finance.models import FinancialRecord
from django.core.management import call_command


class MergeWalkinTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='merge_tester', password='pass')
        self.org = Organization.objects.create(name='MergeOrg')
        self.branch = Branch.objects.create(name='MergeBranch', organization=self.org)
        self.agency = Agency.objects.create(name='MergeAgency', branch=self.branch)

    def test_merge_walkin_financials_creates_merged_record(self):
        parent = Booking.objects.create(
            user=self.user,
            organization=self.org,
            branch=self.branch,
            agency=self.agency,
            booking_number='MP-1',
            status='new',
            payment_status='Pending'
        )

        walkin = Booking.objects.create(
            user=self.user,
            organization=self.org,
            branch=self.branch,
            agency=self.agency,
            booking_number='MW-1',
            status='new',
            payment_status='Pending',
            is_walkin=True,
            linked_booking=parent
        )

        fr1 = FinancialRecord.objects.create(
            booking_id=parent.id,
            organization=self.org,
            branch=self.branch,
            income_amount=100,
            purchase_cost=60,
            expenses_amount=5,
            profit_loss=35,
        )

        fr2 = FinancialRecord.objects.create(
            booking_id=walkin.id,
            organization=self.org,
            branch=self.branch,
            income_amount=40,
            purchase_cost=20,
            expenses_amount=2,
            profit_loss=18,
            metadata={'linked_booking_id': parent.id}
        )

        call_command('merge_walkin_financials', str(parent.id))

        # Find merged FR for booking
        frs = FinancialRecord.objects.filter(booking_id=parent.id)
        merged = None
        for f in frs:
            if isinstance(f.metadata, dict) and f.metadata.get('merged_from'):
                merged = f
                break

        self.assertIsNotNone(merged, 'Merged FinancialRecord not created')
        self.assertIn(fr1.id, merged.metadata['merged_from'])
        self.assertIn(fr2.id, merged.metadata['merged_from'])
        self.assertEqual(merged.income_amount, fr1.income_amount + fr2.income_amount)
        self.assertEqual(merged.profit_loss, fr1.profit_loss + fr2.profit_loss)
