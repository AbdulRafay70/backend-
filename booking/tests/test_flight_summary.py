from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from packages.models import City, Airlines
from organization.models import Organization, Branch, Agency
from booking.models import Booking, BookingTicketDetails
from tickets.models import Ticket, TicketTripDetails
import datetime


class FlightSummaryAPITest(TestCase):
    def setUp(self):
        self.staff = User.objects.create_user(username="stafff", is_staff=True)
        self.client = APIClient()
        self.client.force_authenticate(user=self.staff)

        self.org = Organization.objects.create(name="OrgF")
        self.branch = Branch.objects.create(name="BranchF", organization=self.org)
        self.agency = Agency.objects.create(name="AgencyF", branch=self.branch)

        c1 = City.objects.create(name="Jeddah", organization=self.org)
        c2 = City.objects.create(name="Riyadh", organization=self.org)
        c3 = City.objects.create(name="Dammam", organization=self.org)

        airline1 = Airlines.objects.create(name="AirOne", code="A1", organization=self.org)
        airline2 = Airlines.objects.create(name="FlyTwo", code="F2", organization=self.org)

        # tickets and trip details
        t1 = Ticket.objects.create(organization=self.org, airline=airline1, pnr="P1", total_seats=10, left_seats=10, booked_tickets=0, confirmed_tickets=0)
        TicketTripDetails.objects.create(ticket=t1, departure_date_time=datetime.datetime.now(), arrival_date_time=datetime.datetime.now(), departure_city=c1, arrival_city=c2, trip_type="oneway")

        t2 = Ticket.objects.create(organization=self.org, airline=airline2, pnr="P2", total_seats=10, left_seats=10, booked_tickets=0, confirmed_tickets=0)
        TicketTripDetails.objects.create(ticket=t2, departure_date_time=datetime.datetime.now(), arrival_date_time=datetime.datetime.now(), departure_city=c2, arrival_city=c3, trip_type="oneway")

        b1 = Booking.objects.create(user=self.staff, organization=self.org, branch=self.branch, agency=self.agency, booking_number="FB1", total_pax=2)
        BookingTicketDetails.objects.create(booking=b1, ticket=t1, seats=2)

        b2 = Booking.objects.create(user=self.staff, organization=self.org, branch=self.branch, agency=self.agency, booking_number="FB2", total_pax=3)
        BookingTicketDetails.objects.create(booking=b2, ticket=t2, seats=3)

        # older booking
        b3 = Booking.objects.create(user=self.staff, organization=self.org, branch=self.branch, agency=self.agency, booking_number="FB3", total_pax=4)
        from django.utils import timezone
        old_dt = timezone.make_aware(datetime.datetime(2020, 1, 1, 0, 0, 0))
        Booking.objects.filter(pk=b3.pk).update(created_at=old_dt)
        BookingTicketDetails.objects.create(booking=b3, ticket=t1, seats=4)

    def test_flight_summary_basic(self):
        resp = self.client.get("/api/pax-summary/flight-status/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        airlines = {d["airline"]: d for d in data}
        self.assertIn("AirOne", airlines)
        self.assertIn("FlyTwo", airlines)
        # AirOne should have pax b1(2) + b3(4) = 6
        self.assertEqual(airlines["AirOne"]["pax"], 6)

    def test_flight_summary_date_filter(self):
        resp = self.client.get("/api/pax-summary/flight-status/?date_from=2021-01-01")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        airlines = {d["airline"]: d for d in data}
        # AirOne should now only include b1 (2 pax)
        self.assertEqual(airlines["AirOne"]["pax"], 2)
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from packages.models import City, Airlines
from organization.models import Organization, Branch, Agency
from booking.models import Booking, BookingTicketDetails
from tickets.models import Ticket, TicketTripDetails
import datetime


class FlightSummaryAPITest(TestCase):
    def setUp(self):
        self.staff = User.objects.create_user(username="stafff", is_staff=True)
        self.client = APIClient()
        self.client.force_authenticate(user=self.staff)

        self.org = Organization.objects.create(name="OrgF")
        self.branch = Branch.objects.create(name="BranchF", organization=self.org)
        self.agency = Agency.objects.create(name="AgencyF", branch=self.branch)

        c1 = City.objects.create(name="Jeddah", organization=self.org)
        c2 = City.objects.create(name="Riyadh", organization=self.org)
        c3 = City.objects.create(name="Dammam", organization=self.org)

        airline1 = Airlines.objects.create(name="AirOne", code="A1", organization=self.org)
        airline2 = Airlines.objects.create(name="FlyTwo", code="F2", organization=self.org)

        # tickets and trip details
        t1 = Ticket.objects.create(organization=self.org, airline=airline1, pnr="P1", total_seats=10, left_seats=10, booked_tickets=0, confirmed_tickets=0)
        TicketTripDetails.objects.create(ticket=t1, departure_date_time=datetime.datetime.now(), arrival_date_time=datetime.datetime.now(), departure_city=c1, arrival_city=c2, trip_type="oneway")

        t2 = Ticket.objects.create(organization=self.org, airline=airline2, pnr="P2", total_seats=10, left_seats=10, booked_tickets=0, confirmed_tickets=0)
        TicketTripDetails.objects.create(ticket=t2, departure_date_time=datetime.datetime.now(), arrival_date_time=datetime.datetime.now(), departure_city=c2, arrival_city=c3, trip_type="oneway")

        b1 = Booking.objects.create(user=self.staff, organization=self.org, branch=self.branch, agency=self.agency, booking_number="FB1", total_pax=2)
        BookingTicketDetails.objects.create(booking=b1, ticket=t1, seats=2)

        b2 = Booking.objects.create(user=self.staff, organization=self.org, branch=self.branch, agency=self.agency, booking_number="FB2", total_pax=3)
        BookingTicketDetails.objects.create(booking=b2, ticket=t2, seats=3)

        # older booking
        b3 = Booking.objects.create(user=self.staff, organization=self.org, branch=self.branch, agency=self.agency, booking_number="FB3", total_pax=4)
        from django.utils import timezone
        old_dt = timezone.make_aware(datetime.datetime(2020, 1, 1, 0, 0, 0))
        Booking.objects.filter(pk=b3.pk).update(created_at=old_dt)
        BookingTicketDetails.objects.create(booking=b3, ticket=t1, seats=4)

    def test_flight_summary_basic(self):
        resp = self.client.get("/api/pax-summary/flight-status/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        airlines = {d["airline"]: d for d in data}
        self.assertIn("AirOne", airlines)
        self.assertIn("FlyTwo", airlines)
        # AirOne should have pax b1(2) + b3(4) = 6
        self.assertEqual(airlines["AirOne"]["pax"], 6)

    def test_flight_summary_date_filter(self):
        resp = self.client.get("/api/pax-summary/flight-status/?date_from=2021-01-01")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        airlines = {d["airline"]: d for d in data}
        # AirOne should now only include b1 (2 pax)
        self.assertEqual(airlines["AirOne"]["pax"], 2)
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from organization.models import Organization, Branch, Agency
from booking.models import Booking, BookingTicketDetails
from tickets.models import Ticket, TicketTripDetails
from packages.models import Airlines, City


class FlightSummaryAPITest(TestCase):
    def setUp(self):
        self.staff = User.objects.create_user(username="staff", is_staff=True)
        self.client = APIClient()
        self.client.force_login(self.staff)

        self.org = Organization.objects.create(name="OrgF")
        self.branch = Branch.objects.create(name="BranchF", organization=self.org)
        self.agency = Agency.objects.create(name="AgencyF", branch=self.branch)

        dep = City.objects.create(name="KHI", organization=self.org)
        arr = City.objects.create(name="JED", organization=self.org)

        airline = Airlines.objects.create(name="Saudia", organization=self.org, code="SV")
        ticket = Ticket.objects.create(organization=self.org, airline=airline, pnr="PNR1")
        TicketTripDetails.objects.create(ticket=ticket, departure_date_time="2025-10-30T10:00:00Z", arrival_date_time="2025-10-30T12:00:00Z", departure_city=dep, arrival_city=arr, trip_type="oneway")

        b1 = Booking.objects.create(user=self.staff, organization=self.org, branch=self.branch, agency=self.agency, booking_number="FB1", total_pax=3)
        BookingTicketDetails.objects.create(booking=b1, ticket=ticket, seats=3)

        b2 = Booking.objects.create(user=self.staff, organization=self.org, branch=self.branch, agency=self.agency, booking_number="FB2", total_pax=2)
        BookingTicketDetails.objects.create(booking=b2, ticket=ticket, seats=2)

    def test_flight_summary_basic(self):
        resp = self.client.get("/api/pax-summary/flight-status/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        # should have one airline/sector entry
        self.assertEqual(len(data), 1)
        entry = data[0]
        self.assertEqual(entry["airline"], "Saudia")
        self.assertEqual(entry["bookings"], 2)
        self.assertEqual(entry["pax"], 5)
