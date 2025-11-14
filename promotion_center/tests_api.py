from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from io import BytesIO


class PromotionCenterAPITest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(username="admin", email="a@b.com", password="pass")
        self.user = User.objects.create_user(username="user", email="u@b.com", password="pass")
        self.client = APIClient()

    def test_list_requires_admin(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.get("/api/promotion-center/contacts/")
        self.assertEqual(resp.status_code, 403)

        self.client.force_authenticate(user=self.admin)
        resp = self.client.get("/api/promotion-center/contacts/")
        # empty list OK
        self.assertEqual(resp.status_code, 200)

    def test_import_csv_admin(self):
        self.client.force_authenticate(user=self.admin)
        csv_content = b"contact_number,full_name,email,type,organization_id,branch_id,city\n+923001234567,Alice,alice@example.com,customer,1,1,Lahore\n"
        resp = self.client.post("/api/promotion-center/contacts/import/", {"file": BytesIO(csv_content)}, format="multipart")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("created", data)
