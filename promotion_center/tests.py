from django.test import TestCase
from django.utils import timezone
from organization.models import Organization, Branch
from django.contrib.auth.models import User
from .models import PromotionContact


class PromotionContactModelTest(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name="Org A")
        self.branch = Branch.objects.create(name="Branch A", organization=self.org)
        self.user = User.objects.create(username="tester")

    def test_create_contact_and_normalize_phone(self):
        # use organization_id/branch_id (model stores numeric ids)
        c = PromotionContact.objects.create(name="Alice", phone="+92 300 1234567", organization_id=self.org.id, branch_id=self.branch.id, created_by=self.user)
        self.assertTrue(c.phone.isdigit() or c.phone.startswith("+"))
        self.assertIsNotNone(c.last_seen)
