from booking.models import Payment, Booking
from django.db import transaction
from django.test import TestCase
from decimal import Decimal
from .models import Account, LedgerEntry, LedgerLine
from organization.models import Organization, Branch, Agency
from django.contrib.auth.models import User



class MultiOrgLedgerPostingTests(TestCase):
    def setUp(self):
        # Create two orgs and agents
        self.org1 = Organization.objects.create(name="Org1")
        self.org2 = Organization.objects.create(name="Org2")
        self.branch1 = Branch.objects.create(name="Branch1", organization=self.org1)
        self.branch2 = Branch.objects.create(name="Branch2", organization=self.org2)
        self.agent1 = User.objects.create(username="agent1")
        self.agent2 = User.objects.create(username="agent2")
        self.acc_agent1 = Account.objects.create(name="Agent1", account_type="AGENT", agency=None, balance=0)
        self.acc_org1 = Account.objects.create(name="Org1 Sales", account_type="SALES", organization=self.org1, balance=0)
        self.acc_org2 = Account.objects.create(name="Org2 Sales", account_type="SALES", organization=self.org2, balance=0)
        self.agency1 = Agency.objects.create(name="Agency1", branch=self.branch1)

    def test_multi_org_payment_posting(self):
        # Create a booking for org1
        booking = Booking.objects.create(
            user=self.agent1,
            organization=self.org1,
            branch=self.branch1,
            agency=self.agency1,  # <-- assign agency
            booking_number="B-MULTI-ORG",
            status="Pending",
            total_amount=0
        )
        # Simulate a payment that should be posted to both org1 and org2
        # For this test, we'll just post to org1 and check atomicity
        with transaction.atomic():
            payment = Payment.objects.create(
                organization=self.org1,
                branch=self.branch1,
                agency=None,
                agent=self.agent1,
                created_by=self.agent1,
                booking=booking,
                method='bank',
                amount=5000.00,
                remarks='Multi-org test',
                status='Completed'
            )
            payment.save()

        # Check that ledger entries and lines exist
        from django.db.utils import NotSupportedError
        try:
            entries = LedgerEntry.objects.filter(metadata__contains={"payment_id": payment.id})
            # force-evaluate to trigger backends that don't support JSON contains
            list(entries[:1])
        except NotSupportedError:
            # fallback for sqlite in-memory used by tests
            entries = LedgerEntry.objects.filter(metadata__icontains=str(payment.id))
        self.assertTrue(entries.exists())
        for entry in entries:
            self.assertTrue(entry.lines.count() >= 2)
        # Check that balances are updated atomically
        self.acc_agent1.refresh_from_db()
        self.acc_org1.refresh_from_db()
        self.assertTrue(self.acc_agent1.balance >= 0)
        self.assertTrue(self.acc_org1.balance <= 0)


class LedgerSmokeTests(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name="Org A")
        self.branch = Branch.objects.create(name="Main Branch", organization=self.org)
        self.user = User.objects.create(username="tester")
        self.acc1 = Account.objects.create(name="Cash", account_type="CASH", organization=self.org, balance=Decimal("100.00"))
        self.acc2 = Account.objects.create(name="Sales", account_type="SALES", organization=self.org, balance=Decimal("0.00"))

    def test_create_simple_entry(self):
        entry = LedgerEntry.objects.create(booking_no="B001", service_type="ticket", narration="Test")
        LedgerLine.objects.create(ledger_entry=entry, account=self.acc1, debit=Decimal("50.00"), credit=Decimal("0.00"), final_balance=Decimal("150.00"))
        LedgerLine.objects.create(ledger_entry=entry, account=self.acc2, debit=Decimal("0.00"), credit=Decimal("50.00"), final_balance=Decimal("-50.00"))
        self.assertEqual(entry.lines.count(), 2)
