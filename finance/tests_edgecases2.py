from django.test import TestCase
from django.contrib.auth.models import User, Group
from rest_framework.test import APIClient
from organization.models import Organization, Branch
from .models import FinancialRecord, Expense
from decimal import Decimal
from django.utils import timezone
import datetime


class EdgeCaseTests2(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='edgeuser2', password='pass')
        self.org = Organization.objects.create(name='EdgeOrg2')
        self.branch = Branch.objects.create(name='B1', organization=self.org)
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_manual_post_permission(self):
        # without group -> forbidden
        payload = {
            'organization': self.org.id,
            'branch': self.branch.id,
            'reference': 'MAN-1',
            'narration': 'Adj',
            'entries': [{'account_id': 1, 'debit': '10.00', 'credit': '0.00'}, {'account_id': 2, 'debit': '0.00', 'credit': '10.00'}]
        }
        resp = self.client.post('/api/finance/manual/post', payload, format='json')
        self.assertEqual(resp.status_code, 403)

        # add to finance_managers group -> allowed (may fail if accounts don't exist, but permission check should pass)
        grp, _ = Group.objects.get_or_create(name='finance_managers')
        self.user.groups.add(grp)
        resp2 = self.client.post('/api/finance/manual/post', payload, format='json')
        # permission should allow; may return 201 or 400 depending on ledger accounts; check not 403
        self.assertNotEqual(resp2.status_code, 403)

    def test_sar_conversion_behavior_when_rate_missing(self):
        # Create an expense with SAR; convert_sar_to_pkr may raise internally; current behavior should still create expense
        payload = {
            'organization': self.org.id,
            'branch': self.branch.id,
            'amount': '100.00',
            'currency': 'SAR',
            'category': 'test',
            'date': timezone.now().date().isoformat(),
        }
        resp = self.client.post('/api/finance/expense/add', payload, format='json')
        # current implementation may return 201 (created) or 400 (posting error).
        self.assertIn(resp.status_code, (201, 400))
        if resp.status_code == 201:
            data = resp.data
            # If created, ensure expense payload returned or warning present
            self.assertTrue('expense' in data or 'warning' in data)

    def test_fbr_csv_has_expected_columns(self):
        # Create a FinancialRecord (use timezone-aware created_at)
        FinancialRecord.objects.create(
            booking_id=10,
            organization=self.org,
            branch=self.branch,
            service_type='hotel',
            income_amount=Decimal('1000.00'),
            purchase_cost=Decimal('600.00'),
            expenses_amount=Decimal('50.00'),
            profit_loss=Decimal('350.00'),
            created_at=timezone.now()
        )
        resp = self.client.get(f'/reports/fbr/summary/csv?organization={self.org.id}&year={timezone.now().year}')
        self.assertEqual(resp.status_code, 200)
        # streaming response -> join
        content = b"".join(resp.streaming_content).decode('utf-8')
        # inferred expected columns from client doc (assumed): organization, year, total_income, total_expenses, total_profit
        self.assertIn('organization', content)
        self.assertIn('total_income', content)
        self.assertIn('total_expenses', content)
        self.assertIn('total_profit', content)
