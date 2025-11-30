from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from decimal import Decimal

from . import models


class SalaryHistoryAPITest(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username='tester', password='pass')
        self.client.force_authenticate(user=self.user)

    def test_create_salary_history_updates_employee(self):
        emp = models.Employee.objects.create(first_name='Aisha', last_name='Khan', salary=Decimal('50000.00'))
        data = {
            'employee': emp.id,
            'new_salary': '60000.00',
            'reason': 'Promotion in test'
        }
        resp = self.client.post('/api/hr/salary-history/', data, format='json')
        self.assertEqual(resp.status_code, 201, msg=f'Expected 201, got {resp.status_code} - {resp.data}')
        emp.refresh_from_db()
        self.assertEqual(emp.salary, Decimal('60000.00'))
