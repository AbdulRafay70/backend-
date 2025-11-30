from django.test import TestCase
from rest_framework.test import APIClient
from django.utils import timezone
from hr import models
from datetime import timedelta
from django.contrib.auth import get_user_model


class HRAPIActionsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.emp = models.Employee.objects.create(first_name='API', last_name='User')
        User = get_user_model()
        self.user = User.objects.create_user(username='testuser', password='pass')
        # authenticate the client because API requires IsAuthenticated by default
        self.client.force_authenticate(user=self.user)

    def test_check_in_and_check_out(self):
        # Check-in
        resp = self.client.post('/api/hr/attendance/check_in/', {'employee': self.emp.id}, format='json')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data['employee'], self.emp.id)
        # Check-out
        resp2 = self.client.post('/api/hr/attendance/check_out/', {'employee': self.emp.id}, format='json')
        self.assertEqual(resp2.status_code, 200)
        data2 = resp2.json()
        self.assertEqual(data2['employee'], self.emp.id)
        # working_hours should be present (may be zero or null depending on times)
        self.assertIn('working_hours', data2)

    def test_movement_start_and_end(self):
        # Start movement
        resp = self.client.post('/api/hr/movements/start/', {'employee': self.emp.id, 'reason': 'Meeting'}, format='json')
        self.assertEqual(resp.status_code, 201)
        d = resp.json()
        mid = d['id']
        self.assertEqual(d['employee'], self.emp.id)
        # End movement
        resp2 = self.client.post(f'/api/hr/movements/{mid}/end/', format='json')
        self.assertEqual(resp2.status_code, 200)
        d2 = resp2.json()
        self.assertEqual(d2['id'], mid)
        self.assertIsNotNone(d2.get('end_time', None))

    def test_unpaid_commissions(self):
        # create commissions
        models.Commission.objects.create(employee=self.emp, booking_id='B1', amount=100, status='unpaid')
        models.Commission.objects.create(employee=self.emp, booking_id='B2', amount=50, status='paid')
        resp = self.client.get(f'/api/hr/commissions/unpaid-by-employee/?employee={self.emp.id}')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['booking_id'], 'B1')
