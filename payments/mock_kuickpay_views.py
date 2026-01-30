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
from django.utils import timezone
import logging
from .models import Consumer
from drf_spectacular.openapi import AutoSchema

logger = logging.getLogger(__name__)


class MockKuickpayBillInquiryView(APIView):
    schema = AutoSchema()
    """Mock Kuickpay Bill Inquiry endpoint - simulates /api/v1/BillInquiry"""
    permission_classes = [AllowAny]  # No auth needed for mock server
    
    def post(self, request):
        """Simulate Kuickpay bill inquiry response using real Consumer data"""
        data = request.data
        consumer_number = data.get('consumer_number')
        bank_mnemonic = data.get('bank_mnemonic')
        
        logger.info(f"Mock Kuickpay Bill Inquiry: consumer={consumer_number}, bank={bank_mnemonic}")
        
        try:
            # Query the actual consumer from database
            consumer = Consumer.objects.get(consumer_number=consumer_number)
            
            # Map bill_status to readable format
            status_map = {
                'U': 'Unpaid',
                'P': 'Paid',
                'B': 'Blocked/Expired'
            }
            
            # Simulate successful response with real data
            mock_response = {
                "response_Code": "00",
                "response_Description": "Successful",
                "consumer_number": consumer.consumer_number,
                "consumer_name": consumer.consumer_name,
                "bill_amount": str(consumer.amount),
                "due_date": str(consumer.expiry_date),
                "bill_status": status_map.get(consumer.bill_status, 'Unknown'),
                "transaction_id": f"INQ-{consumer.id}-{timezone.now().strftime('%Y%m%d%H%M%S')}",
                "bank_mnemonic": bank_mnemonic,
                "email": consumer.email_address,
                "contact": consumer.contact_number,
                "reason": consumer.reason
            }
            
            return Response(mock_response, status=status.HTTP_200_OK)
            
        except Consumer.DoesNotExist:
            # Consumer not found
            error_response = {
                "response_Code": "01",
                "response_Description": "Consumer not found",
                "consumer_number": consumer_number,
                "bank_mnemonic": bank_mnemonic
            }
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)
        
        except Exception as e:
            logger.error(f"Error in bill inquiry: {str(e)}")
            error_response = {
                "response_Code": "99",
                "response_Description": f"System error: {str(e)}",
                "consumer_number": consumer_number
            }
            return Response(error_response, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MockKuickpayBillPaymentView(APIView):
    schema = AutoSchema()
    """Mock Kuickpay Bill Payment endpoint - simulates /api/v1/BillPayment"""
    permission_classes = [AllowAny]  # No auth needed for mock server
    
    def post(self, request):
        """Simulate Kuickpay bill payment response and update Consumer status"""
        data = request.data
        consumer_number = data.get('consumer_number')
        transaction_amount = data.get('transaction_amount')
        tran_auth_id = data.get('tran_auth_id')
        
        logger.info(f"Mock Kuickpay Bill Payment: consumer={consumer_number}, amount={transaction_amount}")
        
        try:
            # Query the actual consumer from database
            consumer = Consumer.objects.get(consumer_number=consumer_number)
            
            # Validate amount
            if float(transaction_amount) != float(consumer.amount):
                error_response = {
                    "response_Code": "02",
                    "response_Description": f"Amount mismatch. Expected: {consumer.amount}, Received: {transaction_amount}",
                    "consumer_number": consumer_number
                }
                return Response(error_response, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if bill is already paid
            if consumer.bill_status == 'P':
                error_response = {
                    "response_Code": "03",
                    "response_Description": "Bill already paid",
                    "consumer_number": consumer_number
                }
                return Response(error_response, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if bill is blocked/expired
            if consumer.bill_status == 'B':
                error_response = {
                    "response_Code": "04",
                    "response_Description": "Bill is blocked or expired",
                    "consumer_number": consumer_number
                }
                return Response(error_response, status=status.HTTP_400_BAD_REQUEST)
            
            # Update consumer status to Paid
            consumer.bill_status = 'P'
            consumer.save()
            
            # Simulate successful payment response
            mock_response = {
                "response_Code": "00",
                "response_Description": "Payment Successful",
                "consumer_number": consumer.consumer_number,
                "consumer_name": consumer.consumer_name,
                "transaction_id": f"PAY-{consumer.id}-{timezone.now().strftime('%Y%m%d%H%M%S')}",
                "confirmation_number": f"CONF-{consumer.id}-{timezone.now().strftime('%Y%m%d')}",
                "transaction_amount": str(transaction_amount),
                "tran_auth_id": tran_auth_id,
                "payment_date": timezone.now().strftime('%Y-%m-%d'),
                "payment_time": timezone.now().strftime('%H:%M:%S')
            }
            
            return Response(mock_response, status=status.HTTP_200_OK)
            
        except Consumer.DoesNotExist:
            # Consumer not found
            error_response = {
                "response_Code": "01",
                "response_Description": "Consumer not found",
                "consumer_number": consumer_number
            }
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)
        
        except Exception as e:
            logger.error(f"Error in bill payment: {str(e)}")
            error_response = {
                "response_Code": "99",
                "response_Description": f"System error: {str(e)}",
                "consumer_number": consumer_number
            }
            return Response(error_response, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
