from django.test import TestCase
from decimal import Decimal
from django.contrib.auth.models import User
from booking.models import Booking
from finance.models import FinancialRecord, Expense
from finance.utils import calculate_profit_loss, aggregate_financials_for_booking
from organization.models import Organization, Branch, Agency


class FinanceIntegrationExtras(TestCase):
    def setUp(self):
        # shared fixtures for tests
        self.user = User.objects.create_user(username='tester', password='pass')
        self.org = Organization.objects.create(name='Org A')
        self.branch = Branch.objects.create(name='Main Branch', organization=self.org)
        self.agency = Agency.objects.create(name='Agency 1', branch=self.branch)

    def test_calculate_profit_loss_handles_sar_expense_without_rate(self):
        """Ensure calculate_profit_loss doesn't crash if an SAR expense exists but no rate is present."""
        b = Booking.objects.create(
            user=self.user,
            organization=self.org,
            branch=self.branch,
            agency=self.agency,
            booking_number='BKG-001',
            status='new',
            payment_status='Pending'
        )

        Expense.objects.create(
            organization=self.org,
            branch=self.branch,
            category='other',
            amount=Decimal('10.00'),
            currency='SAR',
            date='2025-10-29',
            booking_id=b.id,
            created_by=self.user
        )

        # calling calculate_profit_loss should not raise and should create or update a FinancialRecord
        try:
            fr = calculate_profit_loss(b.id)
        except Exception as e:
            self.fail(f"calculate_profit_loss raised an exception for SAR edge case: {e}")

        self.assertIsNotNone(fr)
        self.assertIsInstance(fr, FinancialRecord)
        # numeric fields should be Decimal-like
        self.assertIsInstance(fr.profit_loss, Decimal)

    def test_aggregate_financials_for_booking_sums_linked_walkins(self):
        """Aggregate main booking + linked walk-ins and verify sums match individual records."""
        user = User.objects.create_user(username='agg_tester', password='pass')
        org = Organization.objects.create(name='Org Agg')
        branch = Branch.objects.create(name='Agg Branch', organization=org)
        agency = Agency.objects.create(name='Agg Agency', branch=branch)

        parent = Booking.objects.create(
            user=user,
            organization=org,
            branch=branch,
            agency=agency,
            booking_number='P-001',
            status='new',
            payment_status='Pending'
        )
        walkin = Booking.objects.create(
            user=user,
            organization=org,
            branch=branch,
            agency=agency,
            booking_number='W-001',
            status='new',
            payment_status='Pending',
            is_walkin=True,
            linked_booking=parent
        )

        # create FinancialRecords directly
        fr_parent = FinancialRecord.objects.create(
            booking_id=parent.id,
            organization=org,
            branch=branch,
            income_amount=Decimal('200.00'),
            purchase_cost=Decimal('120.00'),
            expenses_amount=Decimal('10.00'),
            profit_loss=Decimal('70.00')
        )

        fr_walkin = FinancialRecord.objects.create(
            booking_id=walkin.id,
            organization=org,
            branch=branch,
            income_amount=Decimal('50.00'),
            purchase_cost=Decimal('20.00'),
            expenses_amount=Decimal('5.00'),
            profit_loss=Decimal('25.00'),
            metadata={'linked_booking_id': parent.id}
        )

        agg = aggregate_financials_for_booking(parent.id)

        self.assertEqual(agg['income_amount'], fr_parent.income_amount + fr_walkin.income_amount)
        self.assertEqual(agg['purchase_cost'], fr_parent.purchase_cost + fr_walkin.purchase_cost)
        self.assertEqual(agg['expenses_amount'], fr_parent.expenses_amount + fr_walkin.expenses_amount)
        self.assertEqual(agg['profit_loss'], fr_parent.profit_loss + fr_walkin.profit_loss)
