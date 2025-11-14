from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from passport_leads.models import PassportLead, PaxProfile, FollowUpLog
from decimal import Decimal
from django.utils import timezone

User = get_user_model()


class PassportLeadsEndpointTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='pass')
        self.client = APIClient()
        self.client.force_authenticate(self.user)

        # create a lead with pending balance
        self.lead = PassportLead.objects.create(
            branch_id=1,
            organization_id=1,
            customer_name='Ali Raza',
            customer_phone='+923001234567',
            pending_balance=Decimal('250.00'),
            next_followup_date=timezone.localdate(),
        )
        self.pax = PaxProfile.objects.create(
            lead=self.lead,
            first_name='Ali',
            last_name='Raza',
            passport_number='AB1234567',
            phone='+923001234567',
        )

    def test_soft_delete_lead(self):
        url = reverse('passportlead-detail', args=[self.lead.id])
        resp = self.client.delete(url)
        self.assertEqual(resp.status_code, 200)
        self.lead.refresh_from_db()
        self.assertTrue(self.lead.is_deleted)
        self.assertEqual(resp.data.get('lead_id'), self.lead.id)

    def test_today_followups(self):
        url = reverse('passport-followups-today')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertIn('total_due', resp.data)
        self.assertIn('followups', resp.data)
        self.assertTrue(isinstance(resp.data['followups'], list))
        self.assertEqual(resp.data['total_due'], len(resp.data['followups']))

    def test_pax_update(self):
        url = reverse('pax-update', args=[self.pax.id])
        payload = {
            'first_name': 'Muhammad',
            'last_name': 'Ali',
            'passport_number': 'XY9876543',
            'phone': '+923009999999',
            'notes': 'Frequent Umrah traveller'
        }
        resp = self.client.patch(url, data=payload, format='json')
        self.assertEqual(resp.status_code, 200)
        self.pax.refresh_from_db()
        self.assertEqual(self.pax.first_name, 'Muhammad')
        self.assertEqual(self.pax.passport_number, 'XY9876543')
        self.assertEqual(resp.data['id'], self.pax.id)

    def test_pax_list_search_and_branch(self):
        # create another pax with different name
        other_lead = PassportLead.objects.create(branch_id=2, organization_id=1, customer_name='Z', customer_phone='000')
        PaxProfile.objects.create(lead=other_lead, first_name='Zaid', passport_number='ZZ111')
        # use absolute path to avoid reverse include issues
        url = '/api/passport-leads/pax/list/'
        resp = self.client.get(url + '?branch_id=1&search=Ali')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('total', resp.data)
        self.assertIn('pax', resp.data)
        # should find our pax
        self.assertTrue(any(p['id'] == self.pax.id for p in resp.data['pax']))

    def test_update_lead_pending_balance_triggers_ledger_response(self):
        # This test ensures the update endpoint returns a ledger field even if ledger not created
        url = reverse('passport-lead-update', args=[self.lead.id])
        payload = {
            'pending_balance': 0,
            'remarks': 'Paid'
        }
        resp = self.client.put(url, data=payload, format='json')
        self.assertEqual(resp.status_code, 200)
        # lead updated
        self.lead.refresh_from_db()
        self.assertEqual(self.lead.pending_balance, Decimal('0'))
        # response contains ledger key (may be closed or explain reason)
        self.assertIn('ledger', resp.data)


