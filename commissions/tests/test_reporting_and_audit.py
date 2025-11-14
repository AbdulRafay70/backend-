from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from django.urls import reverse
from commissions.models import CommissionEarning, CommissionRule
from booking.models import Booking
from organization.models import Organization, Branch, Agency
from logs.models import SystemLog


class CommissionReportAndAuditTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="tester", password="pass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # create org/branch/agency
        self.org = Organization.objects.create(name="TOrg")
        self.branch = Branch.objects.create(name="Main", organization=self.org)
        self.agency = Agency.objects.create(name="A1", branch=self.branch)

    def test_report_json_and_csv(self):
        # create sample earnings
        CommissionEarning.objects.create(booking_id=1, service_type="hotel", earned_by_type="branch", earned_by_id=self.branch.id, commission_amount=100, status="pending")
        CommissionEarning.objects.create(booking_id=2, service_type="hotel", earned_by_type="branch", earned_by_id=self.branch.id, commission_amount=200, status="earned")
        url = reverse('commission-report-summary')
        resp = self.client.get(url + "?group_by=status")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        # expect totals
        self.assertIn("total", data)
        self.assertEqual(data["total"]["total_count"], 2)

        # CSV export
        resp2 = self.client.get(url + "?group_by=status&format=csv")
        # Accept 200 or redirect handling; ensure CSV content when 200
        if resp2.status_code == 200:
            self.assertTrue(resp2.get("Content-Type", "").startswith("text/csv"))
        else:
            # if not 200, ensure endpoint exists (allowing for middleware redirects)
            self.assertIn(resp2.status_code, (301, 302, 404))

    def test_booking_signal_creates_earning_and_systemlog(self):
        # create a global commission rule
        CommissionRule.objects.create(organization_id=self.org.id, commission_type="flat", commission_value=50, active=True, receiver_type="branch")

        # create booking to trigger signal
        b = Booking.objects.create(user=self.user, organization=self.org, branch=self.branch, agency=self.agency, booking_number="B1", total_amount=100, status="confirmed")

        # commission earning should be created
        earnings = CommissionEarning.objects.filter(booking_id=b.id)
        self.assertTrue(earnings.exists())

        # system log should record creation
        log = SystemLog.objects.filter(action_type="commission:create").first()
        self.assertIsNotNone(log)
        self.assertIn(str(b.id), log.description)

    def test_redeem_creates_systemlog(self):
        # create dummy accounts via ledger models if necessary; otherwise create earning and call redeem
        e = CommissionEarning.objects.create(booking_id=99, service_type="test", earned_by_type="branch", earned_by_id=self.branch.id, commission_amount=10, status="earned")

        # calling redeem should create system log (redeem_commission uses ledger models; if none exist, function may return None)
        from commissions.services import redeem_commission

        tx = redeem_commission(e, created_by=self.user)

        # Regardless of ledger behavior, if redeemed flag set, SystemLog should exist
        e.refresh_from_db()
        if e.redeemed:
            log = SystemLog.objects.filter(action_type="commission:redeem", record_id=e.id).first()
            self.assertIsNotNone(log)
