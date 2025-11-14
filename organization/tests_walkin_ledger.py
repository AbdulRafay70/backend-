from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import AccessToken
from .models import Organization
from tickets.models import Hotels, HotelRooms, RoomDetails
from decimal import Decimal
from datetime import date, timedelta
from django.db.models import Sum


class WalkInLedgerTests(TestCase):
    def setUp(self):
        # import ledger models lazily to avoid app registry issues at module import time
        from ledger.models import Account, LedgerEntry, LedgerLine
        self.Account = Account
        self.LedgerEntry = LedgerEntry
        self.LedgerLine = LedgerLine
        # create user and organization
        self.user = User.objects.create(username="walkinuser")
        self.org = Organization.objects.create(name="WalkInOrg")
        self.org.user.add(self.user)

        # create hotel
        self.hotel = Hotels.objects.create(organization=self.org, name="Test Hotel", address="Addr", available_start_date=date.today(), available_end_date=(date.today()+timedelta(days=30)), category="3star", city=None)

        # create room and bed
        self.room = HotelRooms.objects.create(hotel=self.hotel, floor="1", room_type="Deluxe", room_number="101", total_beds=1)
        RoomDetails.objects.create(room=self.room, bed_number="B1", is_assigned=False)

        # create ledger accounts for organization
        self.cash = self.Account.objects.create(organization=self.org, name="Org Cash", account_type="CASH", balance=Decimal("0.00"))
        self.suspense = self.Account.objects.create(organization=self.org, name="Org Suspense", account_type="SUSPENSE", balance=Decimal("0.00"))
        self.sales = self.Account.objects.create(organization=self.org, name="Org Sales", account_type="SALES", balance=Decimal("0.00"))

        # client with auth
        self.client = APIClient()
        token = AccessToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_create_with_advance_creates_ledger(self):
        url = "/api/walkin/create"
        payload = {
            "hotel": self.hotel.id,
            "organization": self.org.id,
            "customer": {"name": "John"},
            "room_details": [{"room_id": self.room.id, "price_per_night": 100.0, "check_in": (date.today()).strftime("%Y-%m-%d"), "check_out": (date.today()+timedelta(days=2)).strftime("%Y-%m-%d")}],
            "advance_paid": "50.00",
            "payment_mode": "cash",
        }
        resp = self.client.post(url, payload, format="json")
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        booking_no = data.get("booking_no")
        self.assertIsNotNone(booking_no)

        # ledger entry should exist for advance
        entries = self.LedgerEntry.objects.filter(booking_no=booking_no)
        self.assertTrue(entries.exists())
        # find advance entry: should have two lines, cash debit and suspense credit
        advance_entry = entries.first()
        lines = list(advance_entry.lines.all())
        self.assertEqual(len(lines), 2)
        acc_types = set(l.account.account_type for l in lines)
        self.assertIn("CASH", acc_types)
        self.assertIn("SUSPENSE", acc_types)

    def test_checkout_recognizes_revenue(self):
        # first create booking with advance
        url = "/api/walkin/create"
        payload = {
            "hotel": self.hotel.id,
            "organization": self.org.id,
            "customer": {"name": "John"},
            "room_details": [{"room_id": self.room.id, "price_per_night": 100.0, "check_in": (date.today()).strftime("%Y-%m-%d"), "check_out": (date.today()+timedelta(days=2)).strftime("%Y-%m-%d")}],
            "advance_paid": "50.00",
            "payment_mode": "cash",
        }
        resp = self.client.post(url, payload, format="json")
        self.assertEqual(resp.status_code, 201)
        booking_id = resp.json().get("booking_id")
        booking_no = resp.json().get("booking_no")

        # now checkout with final_amount 200.00 (recognize 50 from advance, remaining 150 collected)
        url2 = f"/api/walkin/update-status/{booking_id}"
        resp2 = self.client.put(url2, {"status": "checked_out", "final_amount": "200.00"}, format="json")
        self.assertEqual(resp2.status_code, 200)

        # ledger entries for booking_no should now include at least two entries (advance + recognition + cash)
        entries = self.LedgerEntry.objects.filter(booking_no=booking_no).order_by("created_at")
        self.assertTrue(entries.count() >= 2)
        # Check ledger lines: total credit on SALES for this booking should be 200.00
        total_sales_credit = self.LedgerLine.objects.filter(ledger_entry__booking_no=booking_no, account__account_type="SALES").aggregate(total=Sum('credit'))['total'] or Decimal('0')
        self.assertEqual(Decimal(total_sales_credit), Decimal("200.00"))
