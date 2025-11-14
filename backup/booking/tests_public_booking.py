from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from organization.models import Organization, Branch, Agency
from booking.models import Booking
from django.utils import timezone
from datetime import timedelta

class PublicBookingAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='pass')
        self.org = Organization.objects.create(name='Org')
        self.branch = Branch.objects.create(organization=self.org, name='Main Branch')
        self.agency = Agency.objects.create(branch=self.branch, name='Test Agency')

        self.booking = Booking.objects.create(
            user=self.user,
            organization=self.org,
            branch=self.branch,
            agency=self.agency,
            booking_number='BK-TEST-001',
            status='Active',
        )

    def test_lookup_by_booking_number(self):
        url = f"/api/public/booking-status/{self.booking.booking_number}/"
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn('booking_number', data)
        self.assertEqual(data['booking_number'], self.booking.booking_number)
        self.assertIn('payment_status', data)
        # ensure restricted fields are not present
        self.assertNotIn('organization', data)
        self.assertNotIn('user', data)

    def test_invalid_booking_number(self):
        url = "/api/public/booking-status/NO-SUCH-BOOKING/"
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 404)

    def test_expired_booking_returns_404(self):
        self.booking.expiry_time = timezone.now() - timedelta(days=1)
        self.booking.save()
        url = f"/api/public/booking-status/{self.booking.booking_number}/"
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 404)

    def test_lookup_by_public_ref(self):
        # refresh from db to ensure public_ref generated
        self.booking.refresh_from_db()
        self.assertIsNotNone(self.booking.public_ref)
        url = f"/api/public/booking-status/?ref={self.booking.public_ref}"
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data['booking_number'], self.booking.booking_number)

    def test_rate_limit(self):
        url = f"/api/public/booking-status/{self.booking.booking_number}/"
        # make multiple requests to try to trigger rate limit; at least one should eventually be 429
        statuses = []
        for _ in range(15):
            resp = self.client.get(url)
            statuses.append(resp.status_code)
        # expect at least one 429 in the responses
        self.assertIn(429, statuses)
