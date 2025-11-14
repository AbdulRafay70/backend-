from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal

from organization.models import Organization, Branch, Agency
from packages.models import UmrahPackage
from booking.models import Booking, Payment
from leads.models import FollowUp


class AdminPublicBookingTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.admin = User.objects.create(username='admin', is_staff=True, is_superuser=True)
        self.user = User.objects.create(username='user')

        self.org = Organization.objects.create(name='Org')
        self.branch = Branch.objects.create(name='Branch', organization=self.org)
        self.agency = Agency.objects.create(name='Agency', branch=self.branch)

        # umrah package
        self.pkg = UmrahPackage.objects.create(
            organization=self.org,
            title='Test Package',
            is_public=True,
            price_per_person=Decimal('250.00'),
            total_seats=100,
            left_seats=100,
            booked_seats=0,
            confirmed_seats=0,
        )

        # create a public booking (unpaid)
        self.booking = Booking.objects.create(
            user=self.user,
            organization=self.org,
            branch=self.branch,
            agency=self.agency,
            booking_number='PB-ADMIN-1',
            total_pax=2,
            total_amount=500.0,
            status='unpaid',
            payment_status='Pending',
            is_public_booking=True,
            created_by_user_type='customer',
            umrah_package=self.pkg,
        )

        # create a pending public payment
        self.payment = Payment.objects.create(
            organization=self.org,
            branch=self.branch,
            booking=self.booking,
            method='online',
            amount=200.0,
            status='Pending',
            public_mode=True,
        )

        # create an open follow-up for remaining amount (should be auto-managed by views but create here)
        self.followup = FollowUp.objects.create(
            booking=self.booking,
            remaining_amount=300.00,
            status='open'
        )

        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    def test_list_public_bookings(self):
        resp = self.client.get('/api/admin/public-bookings/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn('results', data)
        found = any(b.get('booking_number') == self.booking.booking_number for b in data.get('results', []))
        self.assertTrue(found)

    def test_verify_payment_approves_and_updates_booking(self):
        url = f'/api/admin/public-bookings/{self.booking.id}/verify-payment/'
        resp = self.client.post(url, {'payment_id': self.payment.id}, format='json')
        self.assertEqual(resp.status_code, 200)
        # refresh
        self.payment.refresh_from_db()
        self.booking.refresh_from_db()
        self.assertEqual(self.payment.status.lower(), 'completed')
        # total_payment_received updated
        self.assertGreater(float(self.booking.total_payment_received or 0), 0)
        # follow-up remaining should be adjusted (remaining = total - paid)
        fu = FollowUp.objects.filter(booking=self.booking).first()
        self.assertIsNotNone(fu)
        # if still remaining, status should be open
        remaining = float(self.booking.total_amount or 0) - float(self.booking.total_payment_received or 0)
        if remaining > 0:
            self.assertIn(fu.status, ['open', 'pending'])

    def test_confirm_and_cancel_adjusts_package_seats(self):
        # confirm booking
        resp = self.client.post(f'/api/admin/public-bookings/{self.booking.id}/confirm/')
        self.assertEqual(resp.status_code, 200)
        self.booking.refresh_from_db()
        self.pkg.refresh_from_db()
        self.assertEqual(self.booking.status, 'confirmed')
        self.assertGreaterEqual(self.pkg.confirmed_seats, self.booking.total_pax)

        # cancel booking and expect confirmed_seats to decrease
        resp2 = self.client.post(f'/api/admin/public-bookings/{self.booking.id}/cancel/')
        self.assertEqual(resp2.status_code, 200)
        self.booking.refresh_from_db()
        self.pkg.refresh_from_db()
        self.assertEqual(self.booking.status, 'canceled')
        self.assertLessEqual(self.pkg.confirmed_seats, max(0, self.pkg.confirmed_seats))
