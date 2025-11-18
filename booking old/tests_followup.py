from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from organization.models import Organization, Branch
from packages.models import UmrahPackage
from booking.models import Booking, Payment
from leads.models import FollowUp
from django.utils import timezone


class FollowUpFlowTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(username='admin', password='admin')
        self.user = User.objects.create_user(username='user1', password='pass')
        self.org = Organization.objects.create(name='Org')
        self.branch = Branch.objects.create(organization=self.org, name='Main')
        self.agency = None
        try:
            from organization.models import Agency
            self.agency = Agency.objects.create(branch=self.branch, name='Test Agency')
        except Exception:
            self.agency = None
        # create public umrah package
        self.pkg = UmrahPackage.objects.create(
            organization=self.org,
            title='Test Umrah',
            is_public=True,
            price_per_person=100.00,
            total_seats=10,
            left_seats=10,
            booked_seats=0,
        )

    def test_followup_created_on_partial_payment_and_closed_on_final(self):
        url = '/api/public/bookings/'
        payload = {
            'umrah_package_id': self.pkg.id,
            'total_pax': 2,
            'contact_name': 'Alice',
            'contact_phone': '+923001234567',
            'pay_now': True,
            'pay_amount': '50.00',
        }

        resp = self.client.post(url, payload, format='json')
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        booking_no = data['booking_number']
        payment_id = data.get('payment_id')

        # booking created
        booking = Booking.objects.get(booking_number=booking_no)
        self.assertIsNotNone(booking)

        # payment exists
        payment = Payment.objects.get(pk=payment_id)
        self.assertEqual(float(payment.amount), 50.0)

        # follow-up created
        fu = FollowUp.objects.filter(booking=booking).first()
        self.assertIsNotNone(fu)
        # remaining should be total - paid (2 pax * 100 = 200 - 50 = 150)
        self.assertAlmostEqual(float(fu.remaining_amount), 150.0)

        # attempt to close follow-up via API should fail (admin endpoint)
        self.client.force_authenticate(user=self.admin)
        close_url = f'/api/leads/admin/followups/{fu.id}/close/'
        close_resp = self.client.post(close_url)
        self.assertEqual(close_resp.status_code, 400)

        # approve the pending payment (admin)
        approve_url = f'/api/admin/payments/{payment.id}/approve/'
        apr = self.client.post(approve_url)
        self.assertEqual(apr.status_code, 200)

        # after approval, booking totals should be updated and follow-up updated
        booking.refresh_from_db()
        payment.refresh_from_db()
        fu.refresh_from_db()
        # booking should still be unpaid because remaining is 150 (we approved only 50)
        self.assertEqual(float(booking.total_payment_received or 0), float(payment.amount or 0))
        self.assertAlmostEqual(float(fu.remaining_amount), 150.0)

        # create and approve a final payment for remaining amount
        final_payload = {'booking_number': booking.booking_number, 'amount': '150.00', 'method': 'online'}
        pay_resp = self.client.post('/api/public/bookings/payments/', final_payload, format='json')
        self.assertEqual(pay_resp.status_code, 201)
        new_payment_id = pay_resp.json().get('payment_id')
        self.assertIsNotNone(new_payment_id)

        apr2 = self.client.post(f'/api/admin/payments/{new_payment_id}/approve/')
        self.assertEqual(apr2.status_code, 200)

        # reload and assert follow-up closed and booking confirmed
        fu.refresh_from_db()
        booking.refresh_from_db()
        self.assertEqual(fu.status, 'closed')
        self.assertEqual(booking.status, 'confirmed')