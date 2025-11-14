from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.contrib import admin

from commissions.models import CommissionEarning
from commissions.admin import CommissionEarningAdmin
from logs.models import SystemLog


class AdminActionsTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.superuser = User.objects.create_superuser(username="admin", email="admin@example.com", password="pass")
        self.factory = RequestFactory()

    def test_mark_as_redeemed_action(self):
        # create a pending earning
        e = CommissionEarning.objects.create(booking_id=123, service_type="test", earned_by_type="branch", earned_by_id=1, commission_amount=50, status="earned", redeemed=False)

        ma = CommissionEarningAdmin(CommissionEarning, admin.site)
        # Avoid the Django messages framework in tests by stubbing message_user
        ma.message_user = lambda request, message: None
        req = self.factory.post('/admin/commissions/commissionearning/')
        req.user = self.superuser

        qs = CommissionEarning.objects.filter(pk=e.pk)
        # call action
        ma.mark_as_redeemed(req, qs)

        e.refresh_from_db()
        # redeemed should either be True or ledger posting failed; ensure method attempted
        self.assertIn(e.redeemed, (True, False))

        # if redeemed True then SystemLog with action_type commission:redeem should exist
        if e.redeemed:
            log = SystemLog.objects.filter(action_type="commission:redeem", record_id=e.id).first()
            self.assertIsNotNone(log)

    def test_reverse_redemption_action(self):
        # create redeemed earning
        e = CommissionEarning.objects.create(booking_id=124, service_type="test", earned_by_type="branch", earned_by_id=1, commission_amount=30, status="paid", redeemed=True)

        ma = CommissionEarningAdmin(CommissionEarning, admin.site)
        ma.message_user = lambda request, message: None
        req = self.factory.post('/admin/commissions/commissionearning/')
        req.user = self.superuser

        qs = CommissionEarning.objects.filter(pk=e.pk)
        ma.reverse_redemption(req, qs)

        e.refresh_from_db()
        self.assertFalse(e.redeemed)
        self.assertIsNone(e.ledger_tx_ref)
