from django.test import TestCase
from django.contrib.auth.models import User

from booking.models import Booking
from organization.models import Organization, Branch, Agency
from universal.scope import apply_user_scope


class ScopeUtilityTests(TestCase):
    def setUp(self):
        # users
        self.org_user = User.objects.create_user(username="org_user")
        self.branch_user = User.objects.create_user(username="branch_user")
        self.agent_user = User.objects.create_user(username="agent_user")
        self.other_user = User.objects.create_user(username="other_user")
        self.staff_user = User.objects.create_user(username="staff_user", is_staff=True)

        # org/branch/agency
        self.org = Organization.objects.create(name="Org A")
        self.org.user.add(self.org_user)

        self.branch = Branch.objects.create(name="Branch A", organization=self.org)
        self.branch.user.add(self.branch_user)

        self.agency = Agency.objects.create(name="Agency A", branch=self.branch)
        self.agency.user.add(self.agent_user)

        # bookings: one for each scope and one for other_user
        self.booking_org = Booking.objects.create(
            user=self.org_user, organization=self.org, branch=self.branch, agency=self.agency, booking_number="B-ORG", status="ok"
        )
        self.booking_branch = Booking.objects.create(
            user=self.branch_user, organization=self.org, branch=self.branch, agency=self.agency, booking_number="B-BRN", status="ok"
        )
        self.booking_agent = Booking.objects.create(
            user=self.agent_user, organization=self.org, branch=self.branch, agency=self.agency, booking_number="B-AG", status="ok"
        )
        self.booking_other = Booking.objects.create(
            user=self.other_user, organization=self.org, branch=self.branch, agency=self.agency, booking_number="B-OTH", status="ok"
        )

    def test_org_user_sees_org_bookings(self):
        qs = apply_user_scope(Booking.objects.all(), self.org_user)
        ids = set(qs.values_list("id", flat=True))
        self.assertIn(self.booking_org.id, ids)
        # org_user should also see own booking only (already included)

    def test_branch_user_sees_branch_bookings(self):
        qs = apply_user_scope(Booking.objects.all(), self.branch_user)
        ids = set(qs.values_list("id", flat=True))
        self.assertIn(self.booking_branch.id, ids)

    def test_agent_user_sees_agency_bookings(self):
        qs = apply_user_scope(Booking.objects.all(), self.agent_user)
        ids = set(qs.values_list("id", flat=True))
        self.assertIn(self.booking_agent.id, ids)

    def test_other_user_only_own_booking(self):
        qs = apply_user_scope(Booking.objects.all(), self.other_user)
        ids = set(qs.values_list("id", flat=True))
        self.assertIn(self.booking_other.id, ids)
        self.assertNotIn(self.booking_agent.id, ids)

    def test_staff_sees_all(self):
        qs = apply_user_scope(Booking.objects.all(), self.staff_user)
        # staff should see all created bookings
        all_ids = set(Booking.objects.values_list("id", flat=True))
        ids = set(qs.values_list("id", flat=True))
        self.assertEqual(all_ids, ids)
