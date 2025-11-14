from django.test import override_settings
from django.core.management import call_command
from django.utils import timezone
from rest_framework.test import APITestCase
from unittest.mock import patch, MagicMock

from blog.models import LeadForm, FormSubmission, FormSubmissionTask


@override_settings(LEADS_API_URL="http://leads.test/submit", LEADS_API_TIMEOUT=2)
class FormForwardingTests(APITestCase):
    def setUp(self):
        self.form = LeadForm.objects.create(name="Contact", slug="contact", schema={}, active=True)

    def test_forward_success_via_process_command(self):
        payload = {"name": "Ali", "phone": "03001234567"}
        resp = self.client.post(f"/api/blog/forms/{self.form.pk}/submit/", data=payload, format="json")
        self.assertEqual(resp.status_code, 201)
        submission_id = resp.data["id"]

        # ensure the task row was created by signals
        task = FormSubmissionTask.objects.filter(submission_id=submission_id).first()
        self.assertIsNotNone(task)

        # mock requests.post to simulate Leads API success
        mock_resp = MagicMock()
        mock_resp.status_code = 201
        mock_resp.json.return_value = {"id": 555, "lead_id": 555}

        with patch("requests.post", return_value=mock_resp):
            call_command("process_form_queue", limit=10)

        submission = FormSubmission.objects.get(pk=submission_id)
        self.assertTrue(submission.is_forwarded)
        self.assertEqual(submission.status, "forwarded")
        self.assertIsNotNone(submission.forwarded_at)
        self.assertIsNotNone(submission.forwarded_response)
        self.assertIn("lead_id", submission.forwarded_response)

    def test_forward_failure_records_error(self):
        payload = {"name": "Bilal", "phone": "03001230000"}
        resp = self.client.post(f"/api/blog/forms/{self.form.pk}/submit/", data=payload, format="json")
        self.assertEqual(resp.status_code, 201)
        submission_id = resp.data["id"]

        task = FormSubmissionTask.objects.filter(submission_id=submission_id).first()
        self.assertIsNotNone(task)

        # simulate network timeout
        import requests

        with patch("requests.post", side_effect=requests.exceptions.Timeout()):
            call_command("process_form_queue", limit=10)

        submission = FormSubmission.objects.get(pk=submission_id)
        self.assertEqual(submission.status, "error")
        self.assertIsNotNone(submission.error_details)
