# This file has been replaced with a harmless placeholder comment to avoid interfering with test discovery.
# Actual tests live under the `leads/tests/` package.
from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from organization.models import Organization, Branch
from .models import Lead, FollowUpHistory

User = get_user_model()


class LoanAndTaskAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # create a staff user to bypass IsBranchUser custom permission
        self.user = User.objects.create_user(username='tester', password='pass')
        # Deprecated placeholder module kept for backward compatibility.
        # Actual tests live under the `leads/tests/` package.