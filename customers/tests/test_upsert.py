from django.test import TestCase
from django.utils import timezone
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from customers.models import Customer
from customers.utils import upsert_customer_from_data


class UpsertCustomerTests(TestCase):
    def setUp(self):
        self.now = timezone.now()

    def test_upsert_create_by_phone(self):
        cust, created = upsert_customer_from_data(full_name="Alice", phone="+123", email=None, branch=None, organization=None, source="test", last_activity=self.now)
        self.assertTrue(created)
        self.assertIsInstance(cust, Customer)
        self.assertEqual(cust.full_name, "Alice")
        self.assertEqual(cust.phone, "+123")

    def test_upsert_update_by_phone(self):
        cust, created = upsert_customer_from_data(full_name="Bob", phone="+200", email=None)
        self.assertTrue(created)
        # update same phone
        cust2, created2 = upsert_customer_from_data(full_name="Bobby", phone="+200", email=None)
        self.assertFalse(created2)
        cust.refresh_from_db()
        self.assertEqual(cust.full_name, "Bobby")

    def test_upsert_create_by_email(self):
        cust, created = upsert_customer_from_data(full_name="Cathy", phone=None, email="cathy@example.com")
        self.assertTrue(created)
        self.assertEqual(cust.email, "cathy@example.com")

    def test_auto_collection_merging_and_soft_delete(self):
        # create user for auth
        user = User.objects.create_user(username="tester", password="pass")
        client = APIClient()
        client.force_authenticate(user=user)

        # create two customers with same phone but different updated_at
        c1 = Customer.objects.create(full_name="Old", phone="+555", email=None, is_active=True)
        c2 = Customer.objects.create(full_name="New", phone="+555", email=None, is_active=True)
        # ensure c2 is newer
        c2.updated_at = timezone.now()
        c2.save()

        # try both hyphen and underscore variants for action path
        resp = client.get("/customers/auto-collection/")
        if resp.status_code == 404:
            resp = client.get("/customers/auto_collection/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("total_customers", data)
        # duplicates with same phone should merge to 1
        self.assertEqual(data["total_customers"], 1)

        # test soft-delete via API destroy
        # get pk
        pk = c2.pk
        resp2 = client.delete(f"/customers/{pk}/")
        self.assertEqual(resp2.status_code, 204)
        c2.refresh_from_db()
        self.assertFalse(c2.is_active)
