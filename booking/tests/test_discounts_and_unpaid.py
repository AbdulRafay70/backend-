from django.test import TestCase
from decimal import Decimal
from django.utils import timezone
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import AccessToken

from organization.models import Organization, Branch, Agency
from packages.models import City
from tickets.models import Hotels
from booking.models import Booking
from booking.models import DiscountGroup, Discount
from booking.serializers import DiscountGroupSerializer


class DiscountGroupSerializerTest(TestCase):
    def setUp(self):
        # create organization
        self.org = Organization.objects.create(name="Org Test")

        # create a city for hotels
        self.city = City.objects.create(organization=self.org, name="Test City", code="TC")

        # create three hotels
        today = timezone.now().date()
        self.h1 = Hotels.objects.create(
            organization=self.org,
            name="Hotel 1",
            city=self.city,
            address="Addr 1",
            category="3",
            available_start_date=today,
            available_end_date=today + timezone.timedelta(days=30),
        )
        self.h2 = Hotels.objects.create(
            organization=self.org,
            name="Hotel 2",
            city=self.city,
            address="Addr 2",
            category="3",
            available_start_date=today,
            available_end_date=today + timezone.timedelta(days=30),
        )
        self.h3 = Hotels.objects.create(
            organization=self.org,
            name="Hotel 3",
            city=self.city,
            address="Addr 3",
            category="3",
            available_start_date=today,
            available_end_date=today + timezone.timedelta(days=30),
        )

    def test_discountgroup_get_shape(self):
        # create DiscountGroup and discounts to match the example
        dg = DiscountGroup.objects.create(
            name="Ramzan Special",
            group_type="seasonal",
            organization=self.org,
            is_active=True,
        )

        # ticket and umrah package discounts
        Discount.objects.create(
            discount_group=dg,
            organization=self.org,
            things="group_ticket",
            group_ticket_discount_amount=Decimal("1000.00"),
        )
        Discount.objects.create(
            discount_group=dg,
            organization=self.org,
            things="umrah_package",
            umrah_package_discount_amount=Decimal("5000.00"),
        )

        # hotel per-night discounts for the same hotel set
        quint = Discount.objects.create(
            discount_group=dg,
            organization=self.org,
            things="hotel",
            room_type="quint",
            per_night_discount=Decimal("100"),
        )
        quad = Discount.objects.create(
            discount_group=dg,
            organization=self.org,
            things="hotel",
            room_type="quad",
            per_night_discount=Decimal("150"),
        )
        triple = Discount.objects.create(
            discount_group=dg,
            organization=self.org,
            things="hotel",
            room_type="triple",
            per_night_discount=Decimal("200"),
        )
        double = Discount.objects.create(
            discount_group=dg,
            organization=self.org,
            things="hotel",
            room_type="double",
            per_night_discount=Decimal("250"),
        )
        sharing = Discount.objects.create(
            discount_group=dg,
            organization=self.org,
            things="hotel",
            room_type="sharing",
            per_night_discount=Decimal("50"),
        )

        # attach the three hotels to each hotel-discount row
        for d in (quint, quad, triple, double, sharing):
            d.discounted_hotels.set([self.h1, self.h2, self.h3])

        # serialize and assert shape
        data = DiscountGroupSerializer(dg).data

        expected = {
            "id": dg.id,
            "name": "Ramzan Special",
            "group_type": "seasonal",
            "organization": self.org.id,
            "is_active": True,
            "discounts": {
                "group_ticket_discount_amount": "1000.00",
                "umrah_package_discount_amount": "5000.00",
            },
            "hotel_night_discounts": [
                {
                    "quint_per_night_discount": "100",
                    "quad_per_night_discount": "150",
                    "triple_per_night_discount": "200",
                    "double_per_night_discount": "250",
                    "sharing_per_night_discount": "50",
                    "other_per_night_discount": "",
                    "discounted_hotels": [self.h1.id, self.h2.id, self.h3.id],
                }
            ],
        }

        self.assertEqual(data, expected)


class UnpaidBookingsAPITest(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name="UnpaidOrg")
        # Create a user to act as agent
        self.agent = User.objects.create(username="agent1", email="agent1@example.com")
        self.client = APIClient()
        now = timezone.now()
        # Create required branch and agency
        self.branch = Branch.objects.create(organization=self.org, name="Main Branch")
        self.agency = Agency.objects.create(branch=self.branch, name="Main Agency")
        # Booking 1: unpaid, not expired, partial payment
        self.b1 = Booking.objects.create(
            user=self.agent,
            organization=self.org,
            branch=self.branch,
            agency=self.agency,
            booking_number="INV-101",
            total_amount=250000,
            status="unpaid",
            expiry_time=now + timezone.timedelta(days=2),
            call_status=False,
            client_note=None,
        )
        self.b1.payment_details.create(
            amount=50000,
            organization=self.org,
            branch=self.branch,
            agency=self.agency,
            agent=self.agent,
            status="Completed"
        )
        self.b1.person_details.create(first_name="Ali", last_name="Raza", contact_number="+92-300000000")
        # Booking 2: unpaid, not expired, no payment
        self.b2 = Booking.objects.create(
            user=self.agent,
            organization=self.org,
            branch=self.branch,
            agency=self.agency,
            booking_number="INV-102",
            total_amount=180000,
            status="unpaid",
            expiry_time=now + timezone.timedelta(days=1),
            call_status=True,
            client_note="Customer will pay tomorrow",
        )
        self.b2.person_details.create(first_name="Fatima", contact_number="+92-300111111")
        # Booking 3: paid, should not appear
        self.b3 = Booking.objects.create(
            user=self.agent,
            organization=self.org,
            branch=self.branch,
            agency=self.agency,
            booking_number="INV-103",
            total_amount=100000,
            status="paid",
            expiry_time=now + timezone.timedelta(days=1),
        )
        self.b3.payment_details.create(
            amount=100000,
            organization=self.org,
            branch=self.branch,
            agency=self.agency,
            agent=self.agent,
            status="Completed"
        )
        # Booking 4: unpaid, expired, should not appear
        self.b4 = Booking.objects.create(
            user=self.agent,
            organization=self.org,
            branch=self.branch,
            agency=self.agency,
            booking_number="INV-104",
            total_amount=50000,
            status="unpaid",
            expiry_time=now - timezone.timedelta(days=1),
        )

    def test_unpaid_bookings_api(self):
        # Authenticate as agent user
        self.client.force_login(self.agent)
        # Authenticate using JWT token
        token = AccessToken.for_user(self.agent)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        # Use direct path since reverse() failed (router name may differ)
        url = f"/api/bookings/unpaid/{self.org.id}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["total_unpaid"], 2)
        booking_nos = {b["booking_no"] for b in data["unpaid_bookings"]}
        self.assertIn("INV-101", booking_nos)
        self.assertIn("INV-102", booking_nos)
        # Check required fields
        for b in data["unpaid_bookings"]:
            self.assertIn("booking_id", b)
            self.assertIn("pending_payment", b)
            self.assertGreater(b["pending_payment"], 0)
            self.assertEqual(b["status"], "unpaid")
            self.assertGreaterEqual(
                timezone.datetime.fromisoformat(b["expiry_time"].replace("Z", "+00:00")), timezone.now()
            )


class BookingCallRemarksAPITest(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name="TestOrg")
        self.agent = User.objects.create(username="agent2", email="agent2@example.com")
        self.client = APIClient()
        self.branch = Branch.objects.create(organization=self.org, name="Branch1")
        self.agency = Agency.objects.create(branch=self.branch, name="Agency1")
        self.booking = Booking.objects.create(
            user=self.agent,
            organization=self.org,
            branch=self.branch,
            agency=self.agency,
            booking_number="INV-999",
            total_amount=100000,
            status="unpaid",
            expiry_time=timezone.now() + timezone.timedelta(days=2),
            call_status=False,
        )
        self.token = AccessToken.for_user(self.agent)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def test_add_call_remarks(self):
        url = "/api/bookings/unpaid/remarks/"
        payload = {
            "booking_id": self.booking.id,
            "call_status": True,
            "remarks": ["Called customer, discussed payment."],
            "created_by": self.agent.id
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["booking_id"], self.booking.id)
        self.assertEqual(data["data"]["call_status"], True)
        self.assertEqual(data["data"]["remarks_count"], 1)
        # Check DB for remark
        from booking.models import BookingCallRemark
        remarks = BookingCallRemark.objects.filter(booking=self.booking)
        self.assertEqual(remarks.count(), 1)
        self.assertEqual(remarks.first().remark_text, "Called customer, discussed payment.")
        self.booking.refresh_from_db()
        self.assertTrue(self.booking.call_status)
