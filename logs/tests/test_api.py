from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from logs.models import SystemLog


class LogsAPITest(TestCase):
    def setUp(self):
        User = get_user_model()
        self.admin = User.objects.create_superuser(username="admin", email="admin@example.com", password="pass")
        self.client = APIClient()
        # Use force_authenticate because project uses JWT auth by default
        self.client.force_authenticate(user=self.admin)

    def test_create_log_via_api(self):
        url = reverse("logs-create")
        data = {
            "action_type": "TEST_ACTION",
            "model_name": "TestModel",
            "record_id": 1,
            "description": "Created for test",
            "status": "success",
        }
        resp = self.client.post(url, data, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertIn("id", resp.data)

    def test_list_logs(self):
        SystemLog.objects.create(action_type="A", model_name="M", description="d", status="success")
        url = reverse("logs-list")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        # Support both paginated (dict with 'results') and non-paginated (list) responses
        if isinstance(resp.data, dict):
            self.assertIn("results", resp.data)
        else:
            self.assertIsInstance(resp.data, list)
