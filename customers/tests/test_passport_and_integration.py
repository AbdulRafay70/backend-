from django.test import TestCase
from django.utils import timezone
from django.contrib.auth.models import User

from customers.models import Customer
from customers.utils import upsert_customer_from_data

from organization.models import Organization, Branch, Agency
from booking.models import Booking, BookingPersonDetail
from leads.services import LeadService


class PassportAndIntegrationTests(TestCase):
    def setUp(self):
        self.now = timezone.now()

    def test_upsert_by_passport(self):
        # create by passport
        c, created = upsert_customer_from_data(full_name="P1", phone=None, email=None, passport_number="P123")
        self.assertTrue(created)
        self.assertEqual(c.passport_number, "P123")

        # upsert again with same passport -> should update, not create
        c2, created2 = upsert_customer_from_data(full_name="P1-updated", passport_number="P123")
        self.assertFalse(created2)
        c.refresh_from_db()
        self.assertEqual(c.full_name, "P1-updated")

    def test_booking_to_lead_to_customer(self):
        # create minimal org/branch/agency/user
        user = User.objects.create_user(username="buser", password="pwd")
        org = Organization.objects.create(name="OrgX")
        branch = Branch.objects.create(name="BranchX", organization=org)
        agency = Agency.objects.create(name="AgencyX", branch=branch)

        # create booking
        booking = Booking.objects.create(
            user=user,
            organization=org,
            branch=branch,
            agency=agency,
            booking_number="BK-1",
            status="Confirmed",
        )

        # attach a person detail with passport and contact
        person = BookingPersonDetail.objects.create(
            booking=booking,
            first_name="John",
            last_name="Doe",
            passport_number="PX-999",
            contact_number="+999",
        )

        # run the LeadService to create/link lead and upsert customer
        lead = LeadService.auto_create_from_booking(booking)
        self.assertIsNotNone(lead)

        # customer should be created/upserted
        cust = Customer.objects.filter(passport_number="PX-999").first()
        self.assertIsNotNone(cust)
        self.assertIn("John", cust.full_name)
