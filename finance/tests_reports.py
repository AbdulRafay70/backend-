from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from organization.models import Organization, Branch
from .models import FinancialRecord
from decimal import Decimal
import datetime


class ReportsTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='ruser', password='pass')
        self.org = Organization.objects.create(name='ReportOrg')
        self.branch = Branch.objects.create(name='B1', organization=self.org)
        self.client = APIClient()
        self.client.force_authenticate(self.user)

        # create some financial records
        FinancialRecord.objects.create(
            booking_id=1, organization=self.org, branch=self.branch, service_type='hotel', income_amount=Decimal('1000.00'), purchase_cost=Decimal('600.00'), expenses_amount=Decimal('50.00'), profit_loss=Decimal('350.00')
        )
        FinancialRecord.objects.create(
            booking_id=2, organization=self.org, branch=self.branch, service_type='ticket', income_amount=Decimal('2000.00'), purchase_cost=Decimal('1500.00'), expenses_amount=Decimal('100.00'), profit_loss=Decimal('400.00')
        )

    def test_profit_loss_json(self):
        resp = self.client.get('/reports/profit-loss', format='json')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn('summary', data)
        self.assertIn('hotel', data['summary'])

    def test_profit_loss_csv(self):
        resp = self.client.get('/reports/profit-loss/csv', format='csv')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp['Content-Type'], 'text/csv')
        # response is a StreamingHttpResponse; collect streaming_content
        content = b"".join(resp.streaming_content).decode('utf-8')
        self.assertIn('booking_id', content)
        self.assertIn('profit', content)

    def test_fbr_csv(self):
        resp = self.client.get('/reports/fbr/summary/csv?organization=%s&year=%s' % (self.org.id, datetime.date.today().year), format='csv')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp['Content-Type'], 'text/csv')
        content = b"".join(resp.streaming_content).decode('utf-8')
        self.assertIn('total_income', content)

    def test_dashboard_period(self):
        resp = self.client.get('/api/finance/dashboard/period?period=today', format='json')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn('total_income', data)
    # Removed stray patch footer text