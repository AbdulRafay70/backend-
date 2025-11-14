from django.test import TestCase
from decimal import Decimal

from commissions.models import CommissionEarning
from commissions.services import redeem_commission
from ledger.models import Account, LedgerEntry


class RedeemIdempotencyTests(TestCase):
    def test_redeem_commission_is_idempotent(self):
        # Create two global accounts (no branch/org) so redeem_commission finds them
        payment = Account.objects.create(name="Test Cash", account_type="CASH", balance=Decimal("1000.00"))
        commission_acc = Account.objects.create(name="Commission Acc", account_type="COMMISSION", balance=Decimal("0.00"))

        # Create a commission earning
        earning = CommissionEarning.objects.create(
            booking_id=12345,
            service_type="ticket",
            earned_by_type="branch",
            earned_by_id=1,
            commission_amount=Decimal("100.00"),
            status="earned",
            redeemed=False,
        )

        before_count = LedgerEntry.objects.count()

        # First redeem should create a ledger entry and mark earning redeemed
        ledger_id = redeem_commission(earning)
        self.assertIsNotNone(ledger_id)

        # Reload objects from DB
        earning.refresh_from_db()
        payment.refresh_from_db()
        commission_acc.refresh_from_db()

        self.assertTrue(earning.redeemed)
        self.assertIsNotNone(earning.ledger_tx_ref)
        self.assertEqual(LedgerEntry.objects.count(), before_count + 1)

        # Balances updated once
        self.assertEqual(payment.balance, Decimal("900.00"))
        self.assertEqual(commission_acc.balance, Decimal("100.00"))

        # Second redeem should be idempotent: no new ledger entries, balances unchanged
        ledger_id_2 = redeem_commission(earning)
        self.assertIsNotNone(ledger_id_2)
        self.assertEqual(LedgerEntry.objects.count(), before_count + 1)

        payment.refresh_from_db()
        commission_acc.refresh_from_db()
        self.assertEqual(payment.balance, Decimal("900.00"))
        self.assertEqual(commission_acc.balance, Decimal("100.00"))
