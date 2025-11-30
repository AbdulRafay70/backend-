from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from organization.models import Organization, Branch
from leads.models import Lead, FollowUpHistory

User = get_user_model()


class LoanAndTaskAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # create a staff user to bypass IsBranchUser custom permission
        self.user = User.objects.create_user(username='tester', password='pass')
        self.user.is_staff = True
        self.user.save()
        self.client.force_authenticate(user=self.user)

        # create organization and branch
        self.org = Organization.objects.create(name='Test Org')
        self.branch = Branch.objects.create(name='Main Branch', organization=self.org)

    def test_create_loan_and_add_balance_followup(self):
        # Create a lead representing a loan
        payload = {
            'customer_full_name': 'Loan Customer',
            'contact_number': '+923001234567',
            'organization': self.org.id,
            'branch': self.branch.id,
            'loan_amount': '10000.00',
        }
        resp = self.client.post('/api/leads/create/', payload, format='json')
        self.assertEqual(resp.status_code, 201)
        lead_id = resp.data.get('id')
        lead = Lead.objects.get(pk=lead_id)
        self.assertEqual(float(lead.loan_amount), 10000.00)

        # Add balance via update (simulate frontend PUT)
        update_payload = {'recovered_amount': '2000.00', 'organization': self.org.id, 'branch': self.branch.id}
        resp2 = self.client.put(f'/api/leads/update/{lead_id}/', update_payload, format='json')
        self.assertIn(resp2.status_code, (200, 204))
        lead.refresh_from_db()
        self.assertEqual(float(lead.recovered_amount), 2000.00)

        # Now create a followup without followup_date/contacted_via to test defaults
        f_payload = {'lead': lead_id, 'remarks': 'Collected partial payment', 'organization': self.org.id, 'branch': self.branch.id}
        fr = self.client.post('/api/leads/followup/', f_payload, format='json')
        self.assertEqual(fr.status_code, 201)
        fu = FollowUpHistory.objects.filter(lead=lead).order_by('-created_at').first()
        self.assertIsNotNone(fu)
        self.assertEqual(fu.created_by_user, self.user)
        # followup_date should be set to today by server
        from django.utils.timezone import now
        self.assertEqual(str(fu.followup_date), str(now().date()))

    def test_create_task_flow(self):
        # Create a task (lead-like record) via leads create endpoint
        payload = {
            'customer_full_name': 'Task Customer',
            'contact_number': '+923009999999',
            'organization': self.org.id,
            'branch': self.branch.id,
            'is_internal_task': True,
            'remarks': 'Task: call customer',
        }
        r = self.client.post('/api/leads/create/', payload, format='json')
        self.assertEqual(r.status_code, 201)
        created = Lead.objects.get(pk=r.data.get('id'))
        self.assertTrue(created.is_internal_task)
        self.assertIn('Task: call customer', created.remarks or '')
