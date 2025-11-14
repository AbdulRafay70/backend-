from django.test import TestCase
from organization.models import Organization, Branch
from django.contrib.auth.models import User
from .models import FinancialRecord


class AggregationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='agguser', password='pass')
        self.org = Organization.objects.create(name='AggOrg')
        self.branch = Branch.objects.create(name='B', organization=self.org)

    def test_aggregate_includes_linked_walkins(self):
        # main booking FR
        fr_main = FinancialRecord.objects.create(
            booking_id=100,
            organization=self.org,
            branch=self.branch,
            income_amount=1000,
            purchase_cost=600,
            expenses_amount=50,
            profit_loss=350,
        )

        # walk-in FR linked via metadata
        fr_walk = FinancialRecord.objects.create(
            booking_id=200,
            organization=self.org,
            branch=self.branch,
            income_amount=500,
            purchase_cost=300,
            expenses_amount=20,
            profit_loss=180,
            metadata={'linked_booking_id': 100}
        )

        from .utils import aggregate_financials_for_booking
        agg = aggregate_financials_for_booking(100)

        self.assertEqual(agg['income_amount'], 1500)
        self.assertEqual(agg['purchase_cost'], 900)
        self.assertEqual(agg['expenses_amount'], 70)
        self.assertEqual(agg['profit_loss'], 530)
        self.assertEqual(agg['count'], 2)
