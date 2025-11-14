from django.test import TestCase
from area_leads.models import AreaLead, LeadPaymentPromise
from django.utils import timezone
import datetime


class AreaLeadsModelTests(TestCase):
    def test_create_lead_and_unique_passport(self):
        l1 = AreaLead.objects.create(branch_id="B1", customer_name="A", passport_number="PX", contact_number="03")
        self.assertIsNotNone(l1)
        # duplicate passport in different branch should be allowed
        l2 = AreaLead.objects.create(branch_id="B2", customer_name="B", passport_number="PX", contact_number="04")
        self.assertIsNotNone(l2)
        # but duplicate passport in the same branch should raise IntegrityError
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            AreaLead.objects.create(branch_id="B1", customer_name="C", passport_number="PX", contact_number="05")

    def test_payment_promise_overdue_marker(self):
        lead = AreaLead.objects.create(branch_id="B1", customer_name="A2", passport_number="P2", contact_number="05")
        due = timezone.now().date() - datetime.timedelta(days=2)
        p = LeadPaymentPromise.objects.create(lead=lead, amount_due=100.00, due_date=due)
        p.mark_overdue_if_needed()
        p.refresh_from_db()
        self.assertEqual(p.status, "overdue")
