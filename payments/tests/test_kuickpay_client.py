from decimal import Decimal
from django.test import SimpleTestCase
from payments.services.kuickpay import KuickpayClient


class KuickpayClientTests(SimpleTestCase):
    def test_format_amount_positive(self):
        self.assertEqual(KuickpayClient._format_amount(Decimal('1869.00')), '+0000000186900')

    def test_format_amount_negative(self):
        self.assertEqual(KuickpayClient._format_amount(Decimal('-120.00')), '-0000000012000')
