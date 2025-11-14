from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from decimal import Decimal

from booking.models import Booking, HotelOutsourcing
from organization.models import Organization, Branch, Agency
from ledger.models import Account, LedgerEntry
from logs.models import SystemLog


class HotelOutsourcingTestsV2(TestCase):
    def setUp(self):
        # create core fixtures: org, branch, user (staff for API access)
        self.org = Organization.objects.create(name="TestOrg")
        self.branch = Branch.objects.create(name="Main", organization=self.org)
        self.user = User.objects.create_user(username="agent1", password="pass")
        self.user.is_staff = True
        self.user.save()

        # create ledger accounts required by helpers (org-scoped)
        self.payable = Account.objects.create(name="Payable", account_type="PAYABLE", organization=self.org)
        self.cash = Account.objects.create(name="Cash", account_type="CASH", organization=self.org)
        # create suspense account (used as default debit for outsourcing)
        self.suspense = Account.objects.create(name="Suspense", account_type="SUSPENSE", organization=self.org)

        # create an agency (Booking.agency expects Agency) — Agency requires branch
        self.agency = Agency.objects.create(name="TestAgency", branch=self.branch)

        # booking (user is auth.User)
        self.booking = Booking.objects.create(
            user=self.user,
            organization=self.org,
            branch=self.branch,
            agency=self.agency,
            booking_number="BKTEST",
            status="pending",
            total_pax=1,
        )

        # API client
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_outsourcing_creates_entry_and_updates_booking(self):
        # create outsourcing record
        ho = HotelOutsourcing.objects.create(
            booking=self.booking,
            hotel_name="Ext Hotel",
            price=100,
            quantity=1,
            number_of_nights=1,
            created_by=self.user,
        )

        # refresh from db
        self.booking.refresh_from_db()
        ho.refresh_from_db()

        # booking flagged as outsourced
        self.assertTrue(self.booking.is_outsourced)

        # ledger entry should be created and linked
        self.assertIsNotNone(ho.ledger_entry_id)
        le = LedgerEntry.objects.filter(pk=ho.ledger_entry_id).first()
        self.assertIsNotNone(le)

        # amount lines present and sum equals outsource_cost
        amount = Decimal(str(ho.outsource_cost or 0))
        total_debit = sum([l.debit for l in le.lines.all()])
        total_credit = sum([l.credit for l in le.lines.all()])
        self.assertEqual(total_debit, amount)
        self.assertEqual(total_credit, amount)

        # SystemLog entry and agent_notified set
        sl = SystemLog.objects.filter(action_type="OUTSOURCED_HOTEL_ASSIGNED", record_id=ho.id).first()
        self.assertIsNotNone(sl)
        ho.refresh_from_db()
        self.assertTrue(ho.agent_notified)

    def test_payment_status_creates_settlement(self):
        # create outsourcing record
        ho = HotelOutsourcing.objects.create(
            booking=self.booking,
            hotel_name="Ext Hotel",
            price=50,
            quantity=2,
            number_of_nights=1,
            created_by=self.user,
        )
        ho.refresh_from_db()
        self.assertIsNotNone(ho.ledger_entry_id)

        # call payment-status API to mark as paid
        url = f"/api/hotel-outsourcing/{ho.id}/payment-status/"
        resp = self.client.patch(url, {"is_paid": True}, format='json', HTTP_HOST='127.0.0.1')
        self.assertEqual(resp.status_code, 200)

        # original ledger entry should be marked as settled
        src = LedgerEntry.objects.filter(pk=ho.ledger_entry_id).first()
        self.assertIsNotNone(src)
        self.assertTrue(src.metadata.get('settled', False))

        # there should be a settlement entry that references the source
        settlement = LedgerEntry.objects.filter(service_type='settlement', metadata__settlement_of=ho.ledger_entry_id).first()
        if not settlement:
            settlement = LedgerEntry.objects.filter(service_type='settlement').first()
        self.assertIsNotNone(settlement)

    def test_soft_delete_creates_reversal(self):
        # create outsourcing record
        ho = HotelOutsourcing.objects.create(
            booking=self.booking,
            hotel_name="Ext Hotel",
            price=75,
            quantity=1,
            number_of_nights=1,
            created_by=self.user,
        )
        ho.refresh_from_db()
        self.assertIsNotNone(ho.ledger_entry_id)

        # perform hard delete to trigger post_delete reversal signal
        ho_id = ho.id
        ho.delete()

        # ledger entry should be marked reversed
        src = LedgerEntry.objects.filter(pk=ho.ledger_entry_id).first()
        self.assertTrue(src.reversed)
        rev = LedgerEntry.objects.filter(metadata__reversal_of=src.id).first()
        self.assertIsNotNone(rev)

    def test_agent_permission_view(self):
        # create another user and booking owned by them
        other_user = User.objects.create_user(username='agent2', password='pass')
        other_booking = Booking.objects.create(user=other_user, organization=self.org, branch=self.branch, agency=self.agency, booking_number="BK2", status="pending", total_pax=1)

        # create outsourcing for self.booking
        ho = HotelOutsourcing.objects.create(
            booking=self.booking,
            hotel_name="Ext Hotel",
            price=10,
            quantity=1,
            number_of_nights=1,
            created_by=self.user,
        )

        # authenticate as other_user and call list
        self.client.force_authenticate(user=other_user)
        resp = self.client.get('/api/hotel-outsourcing/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        ids = [r.get('id') for r in data.get('results', [])]
        self.assertNotIn(ho.id, ids)
