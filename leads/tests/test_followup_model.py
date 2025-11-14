from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone

from organization.models import Organization, Branch, Agency
from booking.models import Booking
from leads.models import Lead, FollowUp


class FollowUpModelTest(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create(username='tester')
        self.org = Organization.objects.create(name='TestOrg')
        self.branch = Branch.objects.create(name='MainBranch', organization=self.org)
        self.agency = Agency.objects.create(name='Public Agency', branch=self.branch)

        self.booking = Booking.objects.create(
            user=self.user,
            organization=self.org,
            branch=self.branch,
            agency=self.agency,
            booking_number='PB-TEST-1',
            total_pax=2,
            total_amount=100.0,
            status='unpaid',
            payment_status='Pending',
            is_public_booking=True,
            created_by_user_type='customer'
        )

        self.lead = Lead.objects.create(
            customer_full_name='John Doe',
            branch=self.branch,
            organization=self.org,
            booking=self.booking
        )

    def test_followup_cannot_close_if_remaining_positive(self):
        fu = FollowUp.objects.create(booking=self.booking, lead=self.lead, remaining_amount=50.00, status='open', created_by=self.user)
        with self.assertRaises(ValueError):
            fu.close(user=self.user)

    def test_followup_closes_when_remaining_zero(self):
        fu = FollowUp.objects.create(booking=self.booking, lead=self.lead, remaining_amount=0.00, status='open', created_by=self.user)
        # should not raise
        fu.close(user=self.user)
        fu.refresh_from_db()
        self.assertEqual(fu.status, 'closed')
        self.assertIsNotNone(fu.closed_at)
