from rest_framework.test import APITestCase
from django.urls import reverse
from django.contrib.auth.models import User
from area_leads.models import AreaLead, LeadPaymentPromise
from django.utils import timezone
import datetime


class AreaLeadsAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="staff", password="pw")
        self.user.is_staff = True
        self.user.save()

    def test_create_lead(self):
        self.client.force_authenticate(self.user)
        url = reverse("area-leads-create")
        data = {"branch_id": "B1", "customer_name": "X", "passport_number": "PA1", "contact_number": "0300"}
        resp = self.client.post(url, data, format="json")
        self.assertEqual(resp.status_code, 201)

    def test_followup_today_and_upcoming_promises(self):
        self.client.force_authenticate(self.user)
        lead = AreaLead.objects.create(branch_id="B1", customer_name="Y", passport_number="PA2", contact_number="031")
        # add a promise
        due = timezone.now().date() + datetime.timedelta(days=1)
        LeadPaymentPromise.objects.create(lead=lead, amount_due=50, due_date=due)
        url = reverse("area-leads-payment-promise-upcoming")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(len(resp.data) >= 1)
