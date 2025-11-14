from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from packages.models import City
from organization.models import Organization, Branch, Agency
from booking.models import Booking, BookingTransportDetails, VehicleType, Sector
import datetime


class TransportSummaryAPITest(TestCase):
    def setUp(self):
        self.staff = User.objects.create_user(username="stafft", is_staff=True)
        self.client = APIClient()
        self.client.force_authenticate(user=self.staff)

        self.org = Organization.objects.create(name="OrgT")
        self.branch = Branch.objects.create(name="BranchT", organization=self.org)
        self.agency = Agency.objects.create(name="AgencyT", branch=self.branch)

        # cities for sectors
        c1 = City.objects.create(name="CityA", organization=self.org)
        c2 = City.objects.create(name="CityB", organization=self.org)
        c3 = City.objects.create(name="CityC", organization=self.org)

        # sectors
        s1 = Sector.objects.create(departure_city=c1, arrival_city=c2, contact_name="x", contact_number="000", organization=self.org)
        s2 = Sector.objects.create(departure_city=c2, arrival_city=c3, contact_name="y", contact_number="111", organization=self.org)

        # vehicle types
        vt1 = VehicleType.objects.create(vehicle_name="Bus A", small_sector=s1, vehicle_type="bus", price=100.0, note="", visa_type="", status="active", organization=self.org)
        vt2 = VehicleType.objects.create(vehicle_name="Coach B", small_sector=s2, vehicle_type="coach", price=120.0, note="", visa_type="", status="active", organization=self.org)

        # bookings and transport details
        b1 = Booking.objects.create(user=self.staff, organization=self.org, branch=self.branch, agency=self.agency, booking_number="TB1", total_pax=2)
        BookingTransportDetails.objects.create(booking=b1, vehicle_type=vt1, price=100)

        b2 = Booking.objects.create(user=self.staff, organization=self.org, branch=self.branch, agency=self.agency, booking_number="TB2", total_pax=3)
        BookingTransportDetails.objects.create(booking=b2, vehicle_type=vt2, price=150)

        # older booking to test date filtering
        b3 = Booking.objects.create(user=self.staff, organization=self.org, branch=self.branch, agency=self.agency, booking_number="TB3", total_pax=4)
        from django.utils import timezone
        old_dt = timezone.make_aware(datetime.datetime(2020, 1, 1, 0, 0, 0))
        Booking.objects.filter(pk=b3.pk).update(created_at=old_dt)
        BookingTransportDetails.objects.create(booking=b3, vehicle_type=vt1, price=80)

    def test_transport_summary_basic(self):
        resp = self.client.get("/api/pax-summary/transport-status/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        transports = {d["transport"]: d for d in data}
        self.assertIn("Bus A", transports)
        self.assertIn("Coach B", transports)
        # Bus A should have pax from b1(2) + b3(4) = 6
        self.assertEqual(transports["Bus A"]["pax"], 6)

    def test_transport_summary_date_filter(self):
        resp = self.client.get("/api/pax-summary/transport-status/?date_from=2021-01-01")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        transports = {d["transport"]: d for d in data}
        # Bus A should now only include b1 (2 pax)
        self.assertEqual(transports["Bus A"]["pax"], 2)
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from packages.models import City
from organization.models import Organization, Branch, Agency
from booking.models import Booking, BookingTransportDetails, VehicleType, Sector
import datetime


class TransportSummaryAPITest(TestCase):
    def setUp(self):
        self.staff = User.objects.create_user(username="stafft", is_staff=True)
        self.client = APIClient()
        self.client.force_authenticate(user=self.staff)

        self.org = Organization.objects.create(name="OrgT")
        self.branch = Branch.objects.create(name="BranchT", organization=self.org)
        self.agency = Agency.objects.create(name="AgencyT", branch=self.branch)

        # cities for sectors
        c1 = City.objects.create(name="CityA", organization=self.org)
        c2 = City.objects.create(name="CityB", organization=self.org)
        c3 = City.objects.create(name="CityC", organization=self.org)

        # sectors
        s1 = Sector.objects.create(departure_city=c1, arrival_city=c2, contact_name="x", contact_number="000", organization=self.org)
        s2 = Sector.objects.create(departure_city=c2, arrival_city=c3, contact_name="y", contact_number="111", organization=self.org)

        # vehicle types
        vt1 = VehicleType.objects.create(vehicle_name="Bus A", small_sector=s1, vehicle_type="bus", price=100.0, note="", visa_type="", status="active", organization=self.org)
        vt2 = VehicleType.objects.create(vehicle_name="Coach B", small_sector=s2, vehicle_type="coach", price=120.0, note="", visa_type="", status="active", organization=self.org)

        # bookings and transport details
        b1 = Booking.objects.create(user=self.staff, organization=self.org, branch=self.branch, agency=self.agency, booking_number="TB1", total_pax=2)
        BookingTransportDetails.objects.create(booking=b1, vehicle_type=vt1, price=100)

        b2 = Booking.objects.create(user=self.staff, organization=self.org, branch=self.branch, agency=self.agency, booking_number="TB2", total_pax=3)
        BookingTransportDetails.objects.create(booking=b2, vehicle_type=vt2, price=150)

        # older booking to test date filtering
        b3 = Booking.objects.create(user=self.staff, organization=self.org, branch=self.branch, agency=self.agency, booking_number="TB3", total_pax=4)
        from django.utils import timezone
        old_dt = timezone.make_aware(datetime.datetime(2020, 1, 1, 0, 0, 0))
        Booking.objects.filter(pk=b3.pk).update(created_at=old_dt)
        BookingTransportDetails.objects.create(booking=b3, vehicle_type=vt1, price=80)

    def test_transport_summary_basic(self):
        resp = self.client.get("/api/pax-summary/transport-status/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        transports = {d["transport"]: d for d in data}
        self.assertIn("Bus A", transports)
        self.assertIn("Coach B", transports)
        # Bus A should have pax from b1(2) + b3(4) = 6
        self.assertEqual(transports["Bus A"]["pax"], 6)

    def test_transport_summary_date_filter(self):
        resp = self.client.get("/api/pax-summary/transport-status/?date_from=2021-01-01")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        transports = {d["transport"]: d for d in data}
        # Bus A should now only include b1 (2 pax)
        self.assertEqual(transports["Bus A"]["pax"], 2)
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from organization.models import Organization, Branch, Agency
from booking.models import Booking, BookingTransportDetails, VehicleType, Sector
from packages.models import City


class TransportSummaryAPITest(TestCase):
    def setUp(self):
        self.staff = User.objects.create_user(username="staff", is_staff=True)
        self.client = APIClient()
        self.client.force_login(self.staff)

        self.org = Organization.objects.create(name="OrgT")
        self.branch = Branch.objects.create(name="BranchT", organization=self.org)
        self.agency = Agency.objects.create(name="AgencyT", branch=self.branch)

        dep = City.objects.create(name="Jeddah", organization=self.org)
        arr = City.objects.create(name="Makkah", organization=self.org)

        sector = Sector.objects.create(departure_city=dep, arrival_city=arr, contact_name="c", contact_number="n", organization=self.org)
        vt = VehicleType.objects.create(vehicle_name="Bus A1", small_sector=sector, organization=self.org, vehicle_type="bus", price=0)

        b1 = Booking.objects.create(user=self.staff, organization=self.org, branch=self.branch, agency=self.agency, booking_number="TB1", total_pax=5)
        BookingTransportDetails.objects.create(booking=b1, vehicle_type=vt, total_price=100)

        b2 = Booking.objects.create(user=self.staff, organization=self.org, branch=self.branch, agency=self.agency, booking_number="TB2", total_pax=7)
        BookingTransportDetails.objects.create(booking=b2, vehicle_type=vt, total_price=200)

    def test_transport_summary_basic(self):
        resp = self.client.get("/api/pax-summary/transport-status/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        # should have one transport entry
        self.assertEqual(len(data), 1)
        entry = data[0]
        self.assertEqual(entry["transport"], "Bus A1")
        self.assertEqual(entry["bookings"], 2)
        self.assertEqual(entry["pax"], 12)
