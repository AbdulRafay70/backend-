"""
Mock Kuickpay API Server for Testing

This module provides mock endpoints that simulate the Kuickpay API responses.
Used for testing the integration without needing actual Kuickpay credentials.
"""
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)


class MockKuickpayBillInquiryView(APIView):
    """Mock Kuickpay Bill Inquiry endpoint - simulates /api/v1/BillInquiry"""
    permission_classes = [AllowAny]  # No auth needed for mock server
    
    def post(self, request):
        """Simulate Kuickpay bill inquiry response"""
        data = request.data
        consumer_number = data.get('consumer_number')
        bank_mnemonic = data.get('bank_mnemonic')
        
        logger.info(f"Mock Kuickpay Bill Inquiry: consumer={consumer_number}, bank={bank_mnemonic}")
        
        # Simulate successful response
        mock_response = {
            "response_Code": "00",
            "response_Description": "Successful",
            "consumer_number": consumer_number,
            "consumer_name": "Mock Customer",
            "bill_amount": "1869.00",
            "due_date": "2024-12-31",
            "bill_status": "Unpaid",
            "transaction_id": "MOCK-TXN-001",
            "bank_mnemonic": bank_mnemonic
        }
        
        return Response(mock_response, status=status.HTTP_200_OK)


class MockKuickpayBillPaymentView(APIView):
    """Mock Kuickpay Bill Payment endpoint - simulates /api/v1/BillPayment"""
    permission_classes = [AllowAny]  # No auth needed for mock server
    
    def post(self, request):
        """Simulate Kuickpay bill payment response"""
        data = request.data
        consumer_number = data.get('consumer_number')
        transaction_amount = data.get('transaction_amount')
        tran_auth_id = data.get('tran_auth_id')
        
        logger.info(f"Mock Kuickpay Bill Payment: consumer={consumer_number}, amount={transaction_amount}")
        
        # Simulate successful payment response
        mock_response = {
            "response_Code": "00",
            "response_Description": "Payment Successful",
            "consumer_number": consumer_number,
            "transaction_id": "MOCK-PAY-TXN-001",
            "confirmation_number": "CONF-MOCK-123456",
            "transaction_amount": transaction_amount,
            "tran_auth_id": tran_auth_id,
            "payment_date": "2024-12-15",
            "payment_time": "14:30:22"
        }
        
        return Response(mock_response, status=status.HTTP_200_OK)
