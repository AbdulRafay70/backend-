from decimal import Decimal
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from .services import KuickpayClient, KuickpayError


class KuickpayBillInquiryAPIView(APIView):
    """
    Kuickpay Bill Inquiry API

    This endpoint allows querying bill information from Kuickpay payment gateway.
    Used to check bill details before making a payment.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Query bill information from Kuickpay",
        description="""
        Retrieve bill details from Kuickpay payment gateway.

        **Required Parameters:**
        - consumer_number: The consumer/utility account number
        - bank_mnemonic: Bank identifier (e.g., 'KPY' for Kuickpay)

        **Optional Parameters:**
        - reserved: Additional reserved field for future use

        **Response:** Bill inquiry details including amount, due date, and consumer information
        """,
        parameters=[
            OpenApiParameter(
                name="consumer_number",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Consumer/utility account number",
                required=True,
                examples=[OpenApiExample("Example 1", value="0000812345")]
            ),
            OpenApiParameter(
                name="bank_mnemonic",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Bank identifier mnemonic",
                required=True,
                examples=[OpenApiExample("Example 1", value="KPY")]
            ),
            OpenApiParameter(
                name="reserved",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Reserved field for additional data",
                required=False
            ),
        ],
        responses={
            200: OpenApiTypes.OBJECT,
            400: OpenApiTypes.OBJECT,
            500: OpenApiTypes.OBJECT,
        },
        examples=[
            OpenApiExample(
                "Success Response",
                value={
                    "consumer_number": "0000812345",
                    "bill_amount": "1869.00",
                    "due_date": "2024-12-31",
                    "consumer_name": "John Doe",
                    "response_code": "00"
                }
            ),
            OpenApiExample(
                "Error Response",
                value={
                    "error": "Kuickpay request failed",
                    "details": "Invalid consumer number"
                }
            )
        ]
    )
    def get(self, request):
        consumer_number = request.query_params.get('consumer_number')
        bank_mnemonic = request.query_params.get('bank_mnemonic')
        reserved = request.query_params.get('reserved', '')

        if not consumer_number or not bank_mnemonic:
            return Response(
                {'error': 'consumer_number and bank_mnemonic are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            client = KuickpayClient()
            result = client.bill_inquiry(
                consumer_number=consumer_number,
                bank_mnemonic=bank_mnemonic,
                reserved=reserved
            )
            return Response(result, status=status.HTTP_200_OK)

        except KuickpayError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            return Response(
                {'error': f'Unexpected error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class KuickpayBillPaymentAPIView(APIView):
    """
    Kuickpay Bill Payment API

    This endpoint allows making bill payments through Kuickpay payment gateway.
    Used to process utility bill payments.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Process bill payment through Kuickpay",
        description="""
        Make a bill payment through Kuickpay payment gateway.

        **Required Parameters:**
        - consumer_number: The consumer/utility account number
        - tran_auth_id: Transaction authorization ID from bill inquiry
        - transaction_amount: Payment amount (decimal)
        - tran_date: Transaction date (YYYYMMDD format)
        - tran_time: Transaction time (HHMMSS format)
        - bank_mnemonic: Bank identifier (e.g., 'KPY' for Kuickpay)

        **Optional Parameters:**
        - reserved: Additional reserved field for future use

        **Response:** Payment confirmation with transaction details
        """,
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "consumer_number": {"type": "string", "example": "0000812345"},
                    "tran_auth_id": {"type": "string", "example": "AUTH123456"},
                    "transaction_amount": {"type": "string", "example": "1869.00"},
                    "tran_date": {"type": "string", "example": "20241215"},
                    "tran_time": {"type": "string", "example": "143022"},
                    "bank_mnemonic": {"type": "string", "example": "KPY"},
                    "reserved": {"type": "string", "example": ""}
                },
                "required": ["consumer_number", "tran_auth_id", "transaction_amount", "tran_date", "tran_time", "bank_mnemonic"]
            }
        },
        responses={
            200: OpenApiTypes.OBJECT,
            400: OpenApiTypes.OBJECT,
            500: OpenApiTypes.OBJECT,
        },
        examples=[
            OpenApiExample(
                "Payment Request",
                value={
                    "consumer_number": "0000812345",
                    "tran_auth_id": "AUTH123456",
                    "transaction_amount": "1869.00",
                    "tran_date": "20241215",
                    "tran_time": "143022",
                    "bank_mnemonic": "KPY",
                    "reserved": ""
                }
            ),
            OpenApiExample(
                "Success Response",
                value={
                    "transaction_id": "TXN789012",
                    "response_code": "00",
                    "response_message": "Payment successful",
                    "confirmation_number": "CONF123456"
                }
            ),
            OpenApiExample(
                "Error Response",
                value={
                    "error": "Payment failed",
                    "details": "Insufficient funds"
                }
            )
        ]
    )
    def post(self, request):
        data = request.data

        required_fields = [
            'consumer_number', 'tran_auth_id', 'transaction_amount',
            'tran_date', 'tran_time', 'bank_mnemonic'
        ]

        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return Response(
                {'error': f'Missing required fields: {", ".join(missing_fields)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Validate and convert transaction_amount to Decimal
            transaction_amount = Decimal(str(data['transaction_amount']))

            client = KuickpayClient()
            result = client.bill_payment(
                consumer_number=data['consumer_number'],
                tran_auth_id=data['tran_auth_id'],
                transaction_amount=transaction_amount,
                tran_date=data['tran_date'],
                tran_time=data['tran_time'],
                bank_mnemonic=data['bank_mnemonic'],
                reserved=data.get('reserved', '')
            )
            return Response(result, status=status.HTTP_200_OK)

        except (ValueError, Decimal.InvalidOperation) as e:
            return Response(
                {'error': f'Invalid transaction_amount format: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except KuickpayError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            return Response(
                {'error': f'Unexpected error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )