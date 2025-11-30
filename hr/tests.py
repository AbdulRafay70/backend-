from django.test import TestCase
from . import models


class HRSmokeTests(TestCase):
    def test_create_employee(self):
        emp = models.Employee.objects.create(first_name='Test', last_name='User')
        self.assertEqual(str(emp), 'Test User')
