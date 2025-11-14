from django.test import TestCase

from commissions.models import CommissionRule
from commissions.services import evaluate_rules_for_booking


class DummyBooking:
    def __init__(self, total_amount=0, product_id=None, inventory_item_id=None):
        self.total_amount = total_amount
        self.product_id = product_id
        self.inventory_item_id = inventory_item_id


class CommissionServicesTests(TestCase):
    def test_evaluate_rules_flat_and_percentage(self):
        # flat rule
        CommissionRule.objects.create(commission_type="flat", commission_value=50, active=True)
        # percentage rule
        CommissionRule.objects.create(commission_type="percentage", commission_value=10, active=True)

        booking = DummyBooking(total_amount=200)
        matches = evaluate_rules_for_booking(booking)

        # There should be two matches with amounts 50 and 20
        amounts = sorted([round(a, 2) for (_, a) in matches])
        self.assertEqual(amounts, [20.0, 50.0])

    def test_evaluate_rules_product_matching(self):
        # rule for product 5
        CommissionRule.objects.create(commission_type="flat", commission_value=30, product_id=5, active=True)
        booking_ok = DummyBooking(total_amount=100, product_id=5)
        booking_no = DummyBooking(total_amount=100, product_id=6)

        self.assertEqual(len(evaluate_rules_for_booking(booking_ok)), 1)
        self.assertEqual(len(evaluate_rules_for_booking(booking_no)), 0)
