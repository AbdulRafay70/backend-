"""
Tests removed per request.
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from .models import Organization, Branch, Agency, AgencyProfile
from rest_framework_simplejwt.tokens import AccessToken
from .models import Rule
from rest_framework import status


class RuleAPITest(TestCase):
    def setUp(self):
        # admin user
        self.admin = User.objects.create(username="admin", email="admin@example.com", is_staff=True, is_superuser=True)
        # regular user
        self.user = User.objects.create(username="user1", email="user1@example.com")
        self.client = APIClient()

    def auth_as_admin(self):
        token = AccessToken.for_user(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def auth_as_user(self):
        token = AccessToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_create_rule_success(self):
        self.auth_as_admin()
        url = "/api/rules/create"
        payload = {
            "id": None,
            "title": "Test Rule",
            "description": "This is a test rule description with enough length.",
            "rule_type": "terms_and_conditions",
            "pages_to_display": ["booking_page"],
            "is_active": True,
            "language": "en",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data.get("success"))
        rid = data.get("rule_id")
        self.assertIsNotNone(rid)
        rule = Rule.objects.get(id=rid)
        self.assertEqual(rule.title, "Test Rule")

    def test_create_rule_validation_error(self):
        self.auth_as_admin()
        url = "/api/rules/create"
        payload = {"title": "", "description": "short", "rule_type": "invalid", "pages_to_display": "notalist", "language": "xx"}
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_rules_filters(self):
        # create several rules
        r1 = Rule.objects.create(title="R1", description="desc long enough for r1", rule_type="policy", pages_to_display=["booking_page"], language="en", is_active=True)
        r2 = Rule.objects.create(title="R2", description="desc long enough for r2", rule_type="terms_and_conditions", pages_to_display=["hotel_page"], language="en", is_active=True)
        url = "/api/rules/list?page=booking_page&language=en"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        rules = data.get("rules", [])
        self.assertTrue(any(r.get("id") == r1.id for r in rules))
        self.assertFalse(any(r.get("id") == r2.id for r in rules))

    def test_put_update_increments_version(self):
        self.auth_as_admin()
        rule = Rule.objects.create(title="Old", description="desc long enough", rule_type="policy", pages_to_display=["booking_page"], language="en", is_active=True, version=1)
        url = f"/api/rules/update/{rule.id}"
        payload = {"title": "New Title"}
        response = self.client.put(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rule.refresh_from_db()
        self.assertEqual(rule.title, "New Title")
        self.assertEqual(rule.version, 2)

    def test_delete_soft_deactivates(self):
        self.auth_as_admin()
        rule = Rule.objects.create(title="ToDelete", description="desc long enough", rule_type="policy", pages_to_display=["booking_page"], language="en", is_active=True)
        url = f"/api/rules/delete/{rule.id}"
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rule.refresh_from_db()
        self.assertFalse(rule.is_active)

    def test_non_admin_cannot_create(self):
        self.auth_as_user()
        url = "/api/rules/create"
        payload = {"title":"t","description":"desc long enough","rule_type":"policy","pages_to_display":["booking_page"],"language":"en"}
        response = self.client.post(url, payload, format="json")
        # should be 403 because user not admin
        self.assertIn(response.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED))

class AgencyProfileAPITest(TestCase):
    def setUp(self):
        self.user = User.objects.create(username="testuser", email="test@example.com")
        self.org = Organization.objects.create(name="TestOrg")
        self.branch = Branch.objects.create(organization=self.org, name="Branch1")
        self.agency = Agency.objects.create(branch=self.branch, name="Agency1")
        self.client = APIClient()
        self.token = AccessToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def test_create_agency_profile(self):
        url = "/api/agency/profile"
        payload = {
            "agency": self.agency.id,
            "relationship_status": "active",
            "relation_history": [{"date":"2025-10-20","type":"note","note":"joined"}, {"date":"2025-10-21","type":"note","note":"renewed"}],
            "working_with_companies": [{"organization_id":1,"organization_name":"CompanyA","work_types":["hotel_booking"]}],
            "performance_summary": {"total_bookings": 10, "on_time_payments": 9, "late_payments": 1},
            "recent_communication": [{"date":"2025-10-27","type":"call","note":"test"}],
            "conflict_history": [],
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["updated_profile"]["agency"], self.agency.id)
        self.assertEqual(data["updated_profile"]["relationship_status"], "active")

    def test_get_agency_profile(self):
        profile = AgencyProfile.objects.create(
            agency=self.agency,
            relationship_status="active",
            relation_history=[{"date":"2025-10-20","type":"note","note":"joined"}],
            working_with_companies=[{"organization_id":1,"organization_name":"CompanyA","work_types":["hotel_booking"]}],
            performance_summary={"total_bookings":5,"on_time_payments":5,"late_payments":0},
            recent_communication=[{"date":"2025-10-21","type":"email","note":"hello"}],
            conflict_history=[],
            created_by=self.user,
            updated_by=self.user,
        )
        url = f"/api/agency/profile?agency_id={self.agency.id}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["agency"], self.agency.id)
        self.assertEqual(data["relationship_status"], "active")

    def test_update_agency_profile(self):
        profile = AgencyProfile.objects.create(
            agency=self.agency,
            relationship_status="active",
            relation_history=[{"date":"2025-10-20","type":"note","note":"joined"}],
            working_with_companies=[{"organization_id":1,"organization_name":"CompanyA","work_types":["hotel_booking"]}],
            performance_summary={"total_bookings":5,"on_time_payments":5,"late_payments":0},
            recent_communication=[{"date":"2025-10-21","type":"email","note":"hello"}],
            conflict_history=[],
            created_by=self.user,
            updated_by=self.user,
        )
        url = "/api/agency/profile"
        payload = {
            "agency": self.agency.id,
            "relationship_status": "inactive",
            "performance_summary": {"total_bookings":7,"on_time_payments":6,"late_payments":1},
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["updated_profile"]["relationship_status"], "inactive")
        self.assertEqual(data["updated_profile"]["performance_summary"], {"total_bookings":7,"on_time_payments":6,"late_payments":1})


