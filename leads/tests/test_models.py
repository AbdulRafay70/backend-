from django.test import TestCase
from django.utils import timezone
from django.contrib.auth.models import User
from organization.models import Organization, Branch, Agency
from booking.models import Booking
from leads.models import Lead, LoanCommitment
from leads.serializers import LeadSerializer
from django.core.management import call_command
import datetime


class LeadsModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="u1", password="pass")
        self.org = Organization.objects.create(name="Org1")
        self.branch = Branch.objects.create(organization=self.org, name="Main Branch")
        self.agency = Agency.objects.create(branch=self.branch, name="Ag1")

    def test_passport_uniqueness_within_organization(self):
        # create initial lead
        lead1 = Lead.objects.create(
            customer_full_name="Alice",
            passport_number="P123",
            contact_number="123",
            branch=self.branch,
            organization=self.org,
        )

        # serializer should reject another lead with same passport for same org
        data = {
            "customer_full_name": "Bob",
            "passport_number": "P123",
            "contact_number": "456",
            "branch": self.branch.id,
            "organization": self.org.id,
        }
        serializer = LeadSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("passport_number", serializer.errors)

    def test_auto_create_lead_from_booking_signal(self):
        booking = Booking.objects.create(
            user=self.user,
            organization=self.org,
            branch=self.branch,
            agency=self.agency,
            booking_number="B100",
            status="Pending",
            payment_status="Pending",
        )

        # post_save signal should create a lead automatically
        lead = Lead.objects.filter(booking=booking).first()
        self.assertIsNotNone(lead)
        self.assertEqual(lead.conversion_status, "converted_to_booking")

    def test_mark_overdue_loans_command(self):
        lead = Lead.objects.create(
            customer_full_name="Charlie",
            branch=self.branch,
            organization=self.org,
        )
        yesterday = timezone.now().date() - datetime.timedelta(days=1)
        loan = LoanCommitment.objects.create(
            lead=lead,
            promised_clear_date=yesterday,
            status="pending",
        )

        # run management command
        call_command("mark_overdue_loans")
        loan.refresh_from_db()
        self.assertEqual(loan.status, "overdue")
