from django.test import TestCase
from django.contrib.auth.models import User, Group
from rest_framework.test import APIClient
from organization.models import Organization, Branch
from ledger.models import Account
from decimal import Decimal
from .models import TransactionJournal


class ManualPostingTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='mpuser', password='pass')
        self.group = Group.objects.create(name='finance_managers')
        self.user.groups.add(self.group)
        self.org = Organization.objects.create(name='ManualOrg')
        self.branch = Branch.objects.create(name='MainBranch', organization=self.org)
        # create two accounts
        self.acc1 = Account.objects.create(organization=self.org, branch=self.branch, name='A1', account_type='CASH', balance=Decimal('1000.00'))
        self.acc2 = Account.objects.create(organization=self.org, branch=self.branch, name='A2', account_type='EXPENSE', balance=Decimal('0.00'))
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_manual_posting(self):
        payload = {
            'organization': self.org.id,
            'branch': self.branch.id,
            'reference': 'MAN-1',
            'narration': 'Adj',
            'entries': [
                {'account_id': self.acc2.id, 'debit': '50.00', 'credit': '0.00'},
                {'account_id': self.acc1.id, 'debit': '0.00', 'credit': '50.00'},
            ]
        }
        resp = self.client.post('/api/finance/manual/post', payload, format='json')
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertIn('journal_id', data)
        self.acc1.refresh_from_db()
        self.acc2.refresh_from_db()
        self.assertEqual(self.acc1.balance, Decimal('950.00'))
        self.assertEqual(self.acc2.balance, Decimal('50.00'))
