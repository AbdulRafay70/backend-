from django.core.management import call_command
from django.test import TestCase
from django.db import transaction
from concurrent.futures import ThreadPoolExecutor, as_completed
from decimal import Decimal

from ledger.models import Account, LedgerEntry
from commissions.models import CommissionEarning


class ProcessPayoutsCommandTests(TestCase):
    def setUp(self):
        # Create fallback accounts
        self.payment_account = Account.objects.create(name="Test Cash", account_type="CASH")
        self.commission_account = Account.objects.create(name="Test Commission", account_type="COMMISSION")

    def test_dry_run_does_not_redeem(self):
        earning = CommissionEarning.objects.create(commission_amount=100, status="pending", redeemed=False)
        call_command("process_payouts", "--dry-run", "--limit", "10")
        earning.refresh_from_db()
        self.assertFalse(earning.redeemed)

    def test_process_payouts_redeems_and_creates_ledger_entry(self):
        earning = CommissionEarning.objects.create(commission_amount=150, status="pending", redeemed=False)
        call_command("process_payouts", "--limit", "10")
        earning.refresh_from_db()
        self.assertTrue(earning.redeemed)
        self.assertIsNotNone(earning.ledger_tx_ref)
        # ledger entry should exist and reference the commission_earning_id in metadata
        entry = LedgerEntry.objects.order_by("-id").first()
        self.assertIsNotNone(entry)
        self.assertEqual(entry.metadata.get("commission_earning_id"), earning.id)

    def test_concurrent_process_payouts_no_double_redemption(self):
        """Test that concurrent runs of process_payouts don't double-redeem."""
        # Skip for SQLite due to locking issues
        from django.db import connection
        if connection.vendor == 'sqlite':
            self.skipTest("SQLite doesn't handle concurrency well in tests")

        # Create multiple earnings
        earnings = []
        for i in range(5):
            earning = CommissionEarning.objects.create(
                commission_amount=Decimal("100.00"),
                status="earned",
                redeemed=False
            )
            earnings.append(earning)

        # Run process_payouts concurrently
        def run_command():
            call_command("process_payouts", "--limit", "10")

        with ThreadPoolExecutor(max_workers=3) as executor:
            futures = [executor.submit(run_command) for _ in range(3)]
            for future in as_completed(futures):
                future.result()  # Wait for completion

        # All earnings should be redeemed exactly once
        for earning in earnings:
            earning.refresh_from_db()
            self.assertTrue(earning.redeemed)
            self.assertIsNotNone(earning.ledger_tx_ref)

        # Should have exactly 5 ledger entries
        ledger_entries = LedgerEntry.objects.filter(
            metadata__commission_earning_id__in=[e.id for e in earnings]
        )
        self.assertEqual(ledger_entries.count(), 5)

    def test_concurrent_process_payouts_with_failures(self):
        """Test concurrency when some redemptions fail."""
        # Skip for SQLite
        from django.db import connection
        if connection.vendor == 'sqlite':
            self.skipTest("SQLite doesn't handle concurrency well in tests")

        # Create earnings, some that might fail (e.g., invalid accounts)
        earnings = []
        for i in range(3):
            earning = CommissionEarning.objects.create(
                commission_amount=Decimal("100.00"),
                status="earned",
                redeemed=False
            )
            earnings.append(earning)

        # Simulate failure by deleting commission account mid-process
        def run_command_with_failure():
            # Delete account to cause failure
            Account.objects.filter(account_type="COMMISSION").delete()
            call_command("process_payouts", "--limit", "10")

        # Run concurrently
        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = [executor.submit(run_command_with_failure) for _ in range(2)]
            for future in as_completed(futures):
                # Some may fail, but shouldn't crash
                try:
                    future.result()
                except Exception:
                    pass  # Expected some failures

        # Check that no earnings were redeemed (since account was deleted)
        for earning in earnings:
            earning.refresh_from_db()
            self.assertFalse(earning.redeemed)
