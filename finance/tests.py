from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from organization.models import Organization, Branch
from ledger.models import Account
from decimal import Decimal
from .models import Expense
import datetime


class ExpensePostingTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='finuser', password='pass')
        self.org = Organization.objects.create(name='TestOrg')
        self.branch = Branch.objects.create(name='Main', organization=self.org)
        # create accounts
        self.cash = Account.objects.create(organization=self.org, branch=self.branch, name='Main Cash', account_type='CASH', balance=Decimal('1000.00'))
        self.susp = Account.objects.create(organization=self.org, branch=self.branch, name='Expenses Suspense', account_type='SUSPENSE', balance=Decimal('0.00'))

        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_expense_posts_to_ledger(self):
        payload = {
            'organization': self.org.id,
            'branch': self.branch.id,
            'category': 'maintenance',
            'amount': '200.00',
            'currency': 'PKR',
            'date': datetime.date.today().isoformat(),
            'notes': 'Test payment'
        }
        resp = self.client.post('/api/finance/expense/add', payload, format='json')
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        # expense exists
        exp = Expense.objects.get(id=data['id'])
        self.assertIsNotNone(exp)
        # ledger entry id should be set
        self.assertIsNotNone(exp.ledger_entry_id)
        # balances: cash decreased by 200, suspense increased by 200
        self.cash.refresh_from_db()
        self.susp.refresh_from_db()
        self.assertEqual(self.cash.balance, Decimal('800.00'))
        self.assertEqual(self.susp.balance, Decimal('200.00'))
