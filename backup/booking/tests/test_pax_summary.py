from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from organization.models import Organization, Branch, Agency
from booking.models import Booking


class PaxSummaryAPITest(TestCase):
    def setUp(self):
        self.staff = User.objects.create_user(username="staff", is_staff=True)
        self.client = APIClient()
        self.client.force_login(self.staff)

        self.org = Organization.objects.create(name="OrgX")
        self.branch = Branch.objects.create(name="BranchX", organization=self.org)
        self.agency = Agency.objects.create(name="AgencyX", branch=self.branch)

        Booking.objects.create(user=self.staff, organization=self.org, branch=self.branch, agency=self.agency, booking_number="B1", booking_type="TICKET", total_pax=2, status="ok")
        Booking.objects.create(user=self.staff, organization=self.org, branch=self.branch, agency=self.agency, booking_number="B2", booking_type="HOTEL", total_pax=3, status="ok")
        Booking.objects.create(user=self.staff, organization=self.org, branch=self.branch, agency=self.agency, booking_number="B3", booking_type="UMRAH", total_pax=1, status="ok")

    def test_pax_summary_staff_sees_all(self):
        resp = self.client.get("/api/pax-summary/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["total_bookings"], 3)
        self.assertEqual(data["total_pax"], 6)
        keys = {item["key"] for item in data["breakdown"]}
        self.assertIn("TICKET", keys)
        self.assertIn("HOTEL", keys)
        self.assertIn("UMRAH", keys)

    def test_pax_summary_scope_enforcement(self):
        # create separate users with scoped memberships
        org_user = User.objects.create_user(username="org_user")
        branch_user = User.objects.create_user(username="branch_user")
        agent_user = User.objects.create_user(username="agent_user")

        # link memberships (Organization.user, Branch.user, Agency.user are ManyToMany)
        self.org.user.add(org_user)
        self.branch.user.add(branch_user)
        self.agency.user.add(agent_user)

        # create additional booking under same org/branch/agency by agent_user
        Booking.objects.create(user=agent_user, organization=self.org, branch=self.branch, agency=self.agency, booking_number="B4", booking_type="TICKET", total_pax=4)

        # org_user should see bookings in organization
        client = APIClient()
        client.force_login(org_user)
        resp = client.get("/api/pax-summary/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        # organization contains all 4 bookings now
        self.assertEqual(data["total_bookings"], 4)

        # branch_user sees bookings in branch
        client2 = APIClient()
        client2.force_login(branch_user)
        resp2 = client2.get("/api/pax-summary/")
        self.assertEqual(resp2.status_code, 200)
        data2 = resp2.json()
        self.assertEqual(data2["total_bookings"], 4)

        # agent_user sees bookings for which they are the user (plus agency scoped)
        client3 = APIClient()
        client3.force_login(agent_user)
        resp3 = client3.get("/api/pax-summary/")
        self.assertEqual(resp3.status_code, 200)
        data3 = resp3.json()
        # agent has at least the booking they created
        self.assertGreaterEqual(data3["total_bookings"], 1)
