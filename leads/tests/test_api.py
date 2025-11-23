from rest_framework.test import APITestCase, APIClient
from django.urls import reverse
from django.contrib.auth.models import User
from organization.models import Organization, Branch, Agency
from booking.models import Booking
from leads.models import Lead, LoanCommitment
from django.utils import timezone
import datetime


class LeadsAPITests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.org = Organization.objects.create(name="OrgA")
        self.branch = Branch.objects.create(organization=self.org, name="BranchA")
        self.agency = Agency.objects.create(branch=self.branch, name="AgencyA")
        self.staff_user = User.objects.create_user(username="staff", password="pw")
        self.staff_user.is_staff = True
        self.staff_user.save()

        self.regular_user = User.objects.create_user(username="normal", password="pw2")

    def test_create_lead_api_rbac(self):
        url = reverse("leads-create")
        data = {
            "customer_full_name": "API Lead",
            "passport_number": "PX1",
            "contact_number": "0300123456",
            "branch": self.branch.id,
            "organization": self.org.id,
        }

        # Unauthenticated -> 401
        resp = self.client.post(url, data, format="json")
        self.assertEqual(resp.status_code, 401)

        # Authenticated regular user (not branch/staff) -> 403
        self.client.force_authenticate(self.regular_user)
        resp = self.client.post(url, data, format="json")
        self.assertEqual(resp.status_code, 403)

        # Staff user -> allowed
        self.client.force_authenticate(self.staff_user)
        resp = self.client.post(url, data, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["passport_number"], "PX1")

    def test_convert_and_lost_endpoints(self):
        # create a lead
        lead = Lead.objects.create(customer_full_name="L1", branch=self.branch, organization=self.org)

        self.client.force_authenticate(self.staff_user)
        convert_url = reverse("leads-convert", kwargs={"pk": lead.id})
        resp = self.client.put(convert_url, {"booking_id": 999}, format="json")
        self.assertEqual(resp.status_code, 200)
        lead.refresh_from_db()
        self.assertEqual(lead.conversion_status, "converted_to_booking")

        lost_url = reverse("leads-lost", kwargs={"pk": lead.id})
        resp = self.client.put(lost_url, {"remarks": "no response"}, format="json")
        self.assertEqual(resp.status_code, 200)
        lead.refresh_from_db()
        self.assertEqual(lead.lead_status, "lost")

    def test_followup_today_and_overdue_loans_endpoints(self):
        today = timezone.now().date()
        lead = Lead.objects.create(customer_full_name="F1", branch=self.branch, organization=self.org, next_followup_date=today, lead_status="followup")
        loan = LoanCommitment.objects.create(lead=lead, promised_clear_date=today - datetime.timedelta(days=2), status="pending")

        self.client.force_authenticate(self.staff_user)
        followup_url = reverse("leads-followup-today")
        resp = self.client.get(followup_url)
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(any(item["id"] == lead.id for item in resp.data))

        overdue_url = reverse("leads-overdue-loans")
        resp = self.client.get(overdue_url)
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(any(item["id"] == loan.id for item in resp.data))

    def test_create_lead_with_new_fields(self):
        url = reverse("leads-create")
        payload = {
            "customer_full_name": "Ahmed Ali",
            "passport_number": "AB1234567",
            "contact_number": "+923001234567",
            "branch": self.branch.id,
            "organization": self.org.id,
            "loan_amount": "50000.00",
            "recovered_amount": "10000.00",
            "recovery_date": "2025-11-18",
            "chat_messages": [{"from": "agent:1", "message": "Called", "sent_at": "2025-11-01T10:00:00Z"}],
            "assigned_to": self.staff_user.id,
            "is_internal_task": True,
            "notes": "Test lead created with financial fields"
        }

        # ensure only staff can create
        self.client.force_authenticate(self.staff_user)
        resp = self.client.post(url, payload, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["customer_full_name"], "Ahmed Ali")
        self.assertEqual(str(resp.data["loan_amount"]), "50000.00")
        self.assertEqual(str(resp.data["recovered_amount"]), "10000.00")
        self.assertEqual(resp.data["is_internal_task"], True)
