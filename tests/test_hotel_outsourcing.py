from django.test import TestCase
from django.urls import reverse
from booking.models import Booking, HotelOutsourcing, BookingHotelDetails
from users.models import UserProfile
from organization.models import Organization, Branch, Agency
from django.contrib.auth.models import User

class HotelOutsourcingTests(TestCase):
    def setUp(self):
        # minimal fixtures; expand as needed
        org = Organization.objects.create(name="TestOrg")
        branch = Branch.objects.create(name="Main", organization=org)
        # create an auth.User and wrap it with UserProfile (current project uses OneToOne)
        user_obj = User.objects.create_user(username="agent1", password="pass")
        user = UserProfile.objects.create(user=user_obj)
        agency = Agency.objects.create(name="TestAgency", branch=branch)
        booking = Booking.objects.create(user=user_obj, organization=org, branch=branch, agency=agency, booking_number="BKTEST", status="pending", total_pax=1)
        self.booking = booking
        self.user = user

    def test_create_outsourcing_creates_entry_and_updates_booking(self):
        # This test is a scaffold — implement assertions after ledger helpers are available.
        ho = HotelOutsourcing.objects.create(booking=self.booking, hotel_name="Ext Hotel", price=100, quantity=1, number_of_nights=1)
        self.assertTrue(self.booking.is_outsourced)
        self.assertIsNotNone(ho.id)

    def test_agent_permission_view(self):
        # Agents should only see their own records; scaffold
        pass

    def test_payment_status_creates_settlement(self):
        # scaffold: create ho then toggle is_paid and assert ledger settlement created
        pass

    def test_soft_delete_creates_reversal(self):
        # scaffold: soft delete and assert ledger reversed
        pass
