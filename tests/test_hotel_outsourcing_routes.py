from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth.models import User

from booking.models import Booking, HotelOutsourcing
from organization.models import Organization, Branch, Agency
from ledger.models import Account


class HotelOutsourcingRouteTests(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name="RouteOrg")
        self.branch = Branch.objects.create(name="Main", organization=self.org)
        # staff user
        self.staff = User.objects.create_user(username="staff", password="pass")
        self.staff.is_staff = True
        self.staff.save()

        # agent user (non-staff)
        self.agent = User.objects.create_user(username="agent", password="pass")

        # ledger accounts
        Account.objects.create(name="Payable", account_type="PAYABLE", organization=self.org)
        Account.objects.create(name="Cash", account_type="CASH", organization=self.org)
        Account.objects.create(name="Suspense", account_type="SUSPENSE", organization=self.org)

        # agency
        self.agency = Agency.objects.create(name="RouteAgency", branch=self.branch)

        # booking for agent
        self.agent_booking = Booking.objects.create(user=self.agent, organization=self.org, branch=self.branch, agency=self.agency, booking_number="BKAG", status="pending", total_pax=1)
        # outsourcing tied to agent booking
        self.agent_ho = HotelOutsourcing.objects.create(booking=self.agent_booking, hotel_name="A", price=10, quantity=1, number_of_nights=1, created_by=self.agent)

        # booking for a different user
        other_user = User.objects.create_user(username='other', password='pass')
        self.other_booking = Booking.objects.create(user=other_user, organization=self.org, branch=self.branch, agency=self.agency, booking_number="BKOT", status="pending", total_pax=1)
        self.other_ho = HotelOutsourcing.objects.create(booking=self.other_booking, hotel_name="B", price=20, quantity=1, number_of_nights=1, created_by=other_user)

        self.client = APIClient()

    def test_staff_can_access_payment_status(self):
        self.client.force_authenticate(user=self.staff)
        url = f"/api/hotel-outsourcing/{self.agent_ho.id}/payment-status/"
        resp = self.client.patch(url, {"is_paid": True}, format='json')
        self.assertIn(resp.status_code, (200, 204))

    def test_agent_can_access_own_payment_status_but_not_others(self):
        self.client.force_authenticate(user=self.agent)
        # own outsourcing -> should be allowed
        url = f"/api/hotel-outsourcing/{self.agent_ho.id}/payment-status/"
        resp = self.client.patch(url, {"is_paid": True}, format='json')
        self.assertIn(resp.status_code, (200, 204))

        # other's outsourcing -> should be 404 (filtered out)
        url2 = f"/api/hotel-outsourcing/{self.other_ho.id}/payment-status/"
        resp2 = self.client.patch(url2, {"is_paid": True}, format='json')
        self.assertEqual(resp2.status_code, 404)
