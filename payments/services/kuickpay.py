import logging
from decimal import Decimal
from typing import Optional

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class KuickpayError(Exception):
    pass


class KuickpayClient:
    """Simple Kuickpay REST client.

    Usage:
        from payments.services import KuickpayClient
        client = KuickpayClient()
        resp = client.bill_inquiry(consumer_number='0000812345', bank_mnemonic='KPY')

    Configuration (recommended):
        settings.KUICKPAY_CONFIG = {
            'BASE_URL': 'https://kuickpay.example',
            'USERNAME': 'your_user',
            'PASSWORD': 'your_pass',
            'TIMEOUT': 10,
        }
    """

    def __init__(self, base_url: Optional[str] = None, username: Optional[str] = None, password: Optional[str] = None, timeout: int = 10):
        cfg = getattr(settings, 'KUICKPAY_CONFIG', {}) or {}
        self.base_url = base_url or cfg.get('BASE_URL', '').rstrip('/')
        self.username = username or cfg.get('USERNAME')
        self.password = password or cfg.get('PASSWORD')
        self.timeout = timeout or cfg.get('TIMEOUT', 10)

        if not self.base_url:
            raise KuickpayError('KUICKPAY base_url not configured (settings.KUICKPAY_CONFIG.BASE_URL)')

    # --- helpers
    @staticmethod
    def _format_amount(amount: Decimal) -> str:
        """Format Decimal amount to Kuickpay AN14 signed string.

        Kuickpay expects last 2 digits as minor units and total width 14 with sign.
        Example: Decimal('1869.00') -> '+0000000186900'
        """
        if not isinstance(amount, Decimal):
            amount = Decimal(str(amount))
        minor = int((amount * 100).to_integral_value())
        sign = '+' if minor >= 0 else '-'
        # Kuickpay expects the last 2 digits as minor units and a fixed-width numeric field.
        # Tests and spec expect 13 digits after the sign (total length 14 including sign).
        return f"{sign}{abs(minor):013d}"

    def _headers(self):
        return {
            'username': self.username or '',
            'password': self.password or '',
            'Content-Type': 'application/json',
        }

    def _post(self, path: str, json_payload: dict):
        url = f"{self.base_url.rstrip('/')}/{path.lstrip('/') }"
        try:
            r = requests.post(url, json=json_payload, headers=self._headers(), timeout=self.timeout)
        except requests.RequestException as exc:
            logger.exception('Kuickpay request failed: %s %s', url, exc)
            raise KuickpayError(f'Kuickpay request failed: {exc}')

        # HTTP errors
        if r.status_code >= 400:
            logger.error('Kuickpay returned HTTP %s: %s', r.status_code, r.text[:1000])
            raise KuickpayError(f'Kuickpay HTTP {r.status_code}')

        try:
            return r.json()
        except ValueError:
            # some responses may be plain strings; return raw text wrapped
            return {'raw_response': r.text}

    # --- public API
    def bill_inquiry(self, consumer_number: str, bank_mnemonic: str, reserved: Optional[str] = None) -> dict:
        payload = {
            'consumer_number': consumer_number,
            'bank_mnemonic': bank_mnemonic,
            'reserved': reserved or ''
        }
        resp = self._post('/api/v1/BillInquiry', payload)
        # normalize response keys to consistent lower/underscore naming if needed
        return resp

    def bill_payment(self, consumer_number: str, tran_auth_id: str, transaction_amount: Decimal, tran_date: str, tran_time: str, bank_mnemonic: str, reserved: Optional[str] = None) -> dict:
        # transaction_amount must be Decimal or numeric; Kuickpay expects special formatting
        formatted_amount = self._format_amount(Decimal(str(transaction_amount)))
        payload = {
            'consumer_number': consumer_number,
            'tran_auth_id': tran_auth_id,
            'transaction_amount': formatted_amount,
            'tran_date': tran_date,
            'tran_time': tran_time,
            'bank_mnemonic': bank_mnemonic,
            'reserved': reserved or ''
        }
        resp = self._post('/api/v1/BillPayment', payload)
        return resp


def map_response_code(resp: dict) -> str:
    """Return Kuickpay response_Code or fall back to other keys."""
    for key in ('response_Code', 'response_code', 'Response_Code', 'ResponseCode'):
        if key in resp:
            return str(resp[key])
    return ''
