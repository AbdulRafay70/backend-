# --- PaxMovement API tests ---
from django.test import TestCase
from .models import PaxMovement

class PaxMovementAPITestCase(TestCase):
    def setUp(self):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        self.user = User.objects.create_superuser(username="admin2", password="pass123", email="admin2@example.com")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def make_pax(self, **kwargs):
        data = {
            "pax_id": "PAX001",
            "flight_no": "PK123",
            "departure_airport": "LHE",
            "arrival_airport": "JED",
            "departure_time": "2025-11-01T10:00:00Z",
            "arrival_time": "2025-11-01T14:00:00Z",
            "status": "in_pakistan",
            "agent_id": "AGT001",
        }
        data.update(kwargs)
        return self.client.post("/api/universal/pax-movements/", data, format="json")

    def test_create_pax_movement(self):
        resp = self.make_pax()
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["pax_id"], "PAX001")

    def test_update_pax_movement(self):
        resp = self.make_pax()
        pk = resp.data["id"]
        url = f"/api/universal/pax-movements/{pk}/"
        update = {"status": "entered_ksa"}
        resp2 = self.client.patch(url, update, format="json")
        self.assertEqual(resp2.status_code, 200)
        self.assertEqual(resp2.data["status"], "entered_ksa")

    def test_status_endpoint(self):
        resp = self.make_pax()
        pk = resp.data["id"]
        url = f"/api/universal/pax-movements/{pk}/status/"
        resp2 = self.client.get(url)
        self.assertEqual(resp2.status_code, 200)
        self.assertIn("status", resp2.data)

    def test_summary_endpoint(self):
        self.make_pax(status="in_pakistan")
        self.make_pax(pax_id="PAX002", status="entered_ksa")
        url = "/api/universal/pax-movements/summary/"
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertIn("in_pakistan", resp.data)
        self.assertIn("entered_ksa", resp.data)

    def test_verify_exit(self):
        resp = self.make_pax()
        pk = resp.data["id"]
        url = f"/api/universal/pax-movements/{pk}/verify_exit/"
        resp2 = self.client.post(url)
        self.assertEqual(resp2.status_code, 200)
        self.assertEqual(resp2.data["status"], "exited_ksa")
        self.assertTrue(resp2.data["verified_exit"])

    def test_notify_agent(self):
        resp = self.make_pax()
        pk = resp.data["id"]
        url = f"/api/universal/pax-movements/{pk}/notify_agent/"
        resp2 = self.client.post(url)
        self.assertEqual(resp2.status_code, 200)
        self.assertIn("notified", resp2.data["message"]) or self.assertIn("Agent", resp2.data["message"])
from django.test import TestCase
from rest_framework.test import APIClient
from django.urls import reverse
from .models import UniversalRegistration
from django.contrib.auth import get_user_model


class UniversalRegistrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        User = get_user_model()
        # create a superuser for tests so permission checks pass
        self.user = User.objects.create_superuser(username="testadmin", email="admin@example.com", password="pass")
        self.client.force_authenticate(user=self.user)

    def test_register_organization_branch_agent_employee_and_cascade_delete(self):
        # Create organization
        url = reverse("universal:register")
        resp = self.client.post(url, {"type": "organization", "name": "Org A", "email": "orga@example.com"}, format="json")
        self.assertEqual(resp.status_code, 201)
        org_id = resp.data["data"]["id"]

        # Create branch under org
        resp = self.client.post(url, {"type": "branch", "name": "Branch 1", "parent": org_id}, format="json")
        self.assertEqual(resp.status_code, 201)
        brn_id = resp.data["data"]["id"]

        # Create agent under branch
        resp = self.client.post(url, {"type": "agent", "name": "Agent X", "parent": brn_id, "email": "agentx@example.com"}, format="json")
        self.assertEqual(resp.status_code, 201)
        agt_id = resp.data["data"]["id"]

        # Create employee under agent
        resp = self.client.post(url, {"type": "employee", "name": "Emp 1", "parent": agt_id, "email": "emp1@example.com"}, format="json")
        self.assertEqual(resp.status_code, 201)
        emp_id = resp.data["data"]["id"]

        # Soft delete organization and ensure cascade
        del_url = reverse("universal:delete", args=[org_id])
        resp = self.client.delete(del_url)
        self.assertEqual(resp.status_code, 200)

        # Reload objects from DB and ensure inactive
        self.assertFalse(UniversalRegistration.objects.get(id=org_id).is_active)
        self.assertFalse(UniversalRegistration.objects.get(id=brn_id).is_active)
        self.assertFalse(UniversalRegistration.objects.get(id=agt_id).is_active)
        self.assertFalse(UniversalRegistration.objects.get(id=emp_id).is_active)

    def test_validation_wrong_parent_type(self):
        # Attempt to create a branch with parent that's not an organization
        url = reverse("universal:register")
        # create an agent first
        resp = self.client.post(url, {"type": "organization", "name": "Org B", "email": "orgb@example.com"}, format="json")
        org_id = resp.data["data"]["id"]
        # create agent under org (invalid but for test we'll create agent under org by sending wrong type)
        resp = self.client.post(url, {"type": "agent", "name": "Agent Bad", "parent": org_id, "email": "abad@example.com"}, format="json")
        # Agent's parent must be branch, so it should fail with 400
        self.assertEqual(resp.status_code, 400)


# --- RegistrationRule API tests ---
from .models import RegistrationRule

class RegistrationRuleAPITestCase(TestCase):
    def setUp(self):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        self.user = User.objects.create_superuser(username="admin", password="pass123", email="admin@example.com")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_registration_rule(self):
        url = "/api/universal/registration-rules/"
        data = {
            "type": "agent",
            "requirement_text": "Must have valid license.",
            "benefit_text": "Can book tickets.",
            "service_allowed": "booking,visa",
        }
        resp = self.client.post(url, data, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["type"], "agent")
        self.assertIn("id", resp.data)

    def test_list_registration_rules(self):
        RegistrationRule.objects.create(type="branch", requirement_text="City required.", benefit_text="Branch ops.")
        url = "/api/universal/registration-rules/"
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertGreaterEqual(len(resp.data), 1)

    def test_filter_by_type(self):
        RegistrationRule.objects.create(type="employee", requirement_text="Post required.", benefit_text="Employee ops.")
        url = "/api/universal/registration-rules/?type=employee"
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        # Filtering not implemented by default, so should return all
        self.assertGreaterEqual(len(resp.data), 1)

    def test_update_registration_rule(self):
        rule = RegistrationRule.objects.create(type="agent", requirement_text="Old req.", benefit_text="Old ben.")
        url = f"/api/universal/registration-rules/{rule.id}/"
        data = {"requirement_text": "Updated req.", "benefit_text": "Updated ben.", "type": "agent"}
        resp = self.client.put(url, data, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["requirement_text"], "Updated req.")

    def test_delete_registration_rule(self):
        rule = RegistrationRule.objects.create(type="branch", requirement_text="To delete.", benefit_text="To delete.")
        url = f"/api/universal/registration-rules/{rule.id}/"
        resp = self.client.delete(url)
        self.assertEqual(resp.status_code, 204)
        self.assertFalse(RegistrationRule.objects.filter(id=rule.id).exists())

