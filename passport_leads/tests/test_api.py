from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from django.utils import timezone
from passport_leads.models import PassportLead, PaxProfile, FollowUpLog

User = get_user_model()


class PassportLeadsAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='pass')
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        # Ensure test client uses a host that's allowed by project settings
        self.client.defaults['HTTP_HOST'] = '127.0.0.1'
        self.base = '/api/passport-leads/passport-leads/'

    def test_auth_required(self):
        # unauthenticated should get 401
        anon = APIClient()
        resp = anon.get(self.base)
        self.assertIn(resp.status_code, (401, 403))

    def test_create_lead_with_pax(self):
        payload = {
            'branch_id': 1,
            'organization_id': 1,
            'customer_name': 'Ali Khan',
            'customer_phone': '+923001234567',
            'cnic': '12345-1234567-1',
            'passport_number': 'A1234567',
            'city': 'Karachi',
            'remarks': 'Test lead',
            'next_followup_date': (timezone.localdate() + timezone.timedelta(days=1)).isoformat(),
            'pax': [
                {
                    'first_name': 'Ali',
                    'last_name': 'Khan',
                    'passport_number': 'A1234567',
                    'nationality': 'PK'
                }
            ]
        }
        resp = self.client.post(self.base, payload, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(PassportLead.objects.count(), 1)
        self.assertEqual(PaxProfile.objects.count(), 1)

    def test_create_lead_with_pax_details_alias(self):
        payload = {
            'branch_id': 1,
            'organization_id': 1,
            'customer_name': 'Ali Khan',
            'customer_phone': '+923001234567',
            'cnic': '12345-1234567-1',
            'passport_number': 'A1234567',
            'city': 'Karachi',
            'remarks': 'Test lead',
            'next_followup_date': (timezone.localdate() + timezone.timedelta(days=1)).isoformat(),
            'pax_details': [
                {
                    'first_name': 'Ali',
                    'last_name': 'Khan',
                    'passport_number': 'A1234567',
                    'nationality': 'PK'
                }
            ]
        }
        resp = self.client.post(self.base, payload, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(PassportLead.objects.count(), 1)
        self.assertEqual(PaxProfile.objects.count(), 1)

    def test_add_followup_and_today_endpoint(self):
        lead = PassportLead.objects.create(branch_id=1, organization_id=1, customer_name='Test', customer_phone='+920000', next_followup_date=timezone.localdate())
        url = f'/api/passport-leads/passport-leads/{lead.id}/add_followup/'
        resp = self.client.post(url, {'remark_text': 'Call tomorrow'}, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(FollowUpLog.objects.filter(lead=lead).count(), 1)

        # today followups
        today_url = '/api/passport-leads/followups/today/'
        resp2 = self.client.get(today_url)
        self.assertEqual(resp2.status_code, 200)
        data = resp2.json()
        # New response shape: { total_due: N, followups: [ { lead_id, ... } ] }
        self.assertIn('followups', data)
        ids = [item['lead_id'] for item in data['followups']]
        self.assertIn(lead.id, ids)

    def test_soft_delete(self):
        lead = PassportLead.objects.create(branch_id=1, organization_id=1, customer_name='Del', customer_phone='+92111')
        url = f'/api/passport-leads/passport-leads/{lead.id}/'
        resp = self.client.delete(url)
        self.assertIn(resp.status_code, (204, 200))
        # ensure soft-delete filters it out from list
        resp2 = self.client.get(self.base)
        self.assertEqual(resp2.status_code, 200)
        data = resp2.json()
        ids = [item['id'] for item in data]
        self.assertNotIn(lead.id, ids)
