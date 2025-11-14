from django.test import TestCase
from django.contrib.auth.models import User
from organization.models import Organization, Branch, Agency
from booking.models import Booking, Payment
from finance.models import FinancialRecord


class FinanceIntegrationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='intuser', password='pass')
        self.org = Organization.objects.create(name='IntOrg')
        self.branch = Branch.objects.create(name='Main', organization=self.org)
        self.agency = Agency.objects.create(name='A', branch=self.branch)

    def test_payment_triggers_financialrecord_creation(self):
        booking = Booking.objects.create(
            user=self.user,
            organization=self.org,
            branch=self.branch,
            agency=self.agency,
            booking_number='INT-001',
            status='Pending',
            total_amount=1500.00,
        )

        # At this point financial record may exist due to booking save signal, clear any existing
        FinancialRecord.objects.filter(booking_id=booking.id).delete()

        payment = Payment.objects.create(
            organization=self.org,
            branch=self.branch,
            booking=booking,
            method='cash',
            amount=1500.00,
        )

        # After saving payment, signals should calculate profit/loss and create FinancialRecord
        fr = FinancialRecord.objects.filter(booking_id=booking.id).first()
        self.assertIsNotNone(fr, 'FinancialRecord not created after payment save')
        self.assertEqual(float(fr.income_amount), 1500.00)
