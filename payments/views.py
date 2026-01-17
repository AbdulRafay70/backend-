from decimal import Decimal
from datetime import datetime
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from booking.models import Booking, BookingPayment
import logging

logger = logging.getLogger(__name__)


class KuickpayBillInquiryAPIView(APIView):
    """
    Kuickpay Bill Inquiry API
    
    This endpoint is called BY Kuickpay to query bill information.
    Implements the Bill Inquiry specification from Kuickpay BPS-Rest Based Document V3.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Bill Inquiry - Called by Kuickpay",
        description="""
        Kuickpay calls this endpoint to retrieve bill details for a consumer.
        
        **Request Format (POST with JSON body):**
        - consumer_number: Consumer/booking reference number (18 digits)
        - bank_mnemonic: Bank identifier (e.g., 'KPY')
        - reserved: Optional reserved field
        
        **Response Codes:**
        - 00: Successful bill inquiry
        - 01: Consumer number does not exist
        - 02: Bill blocked or inactive
        - 03: Unknown error/bad transaction
        - 04: Invalid data
        - 05: Service failed
        """,
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "consumer_number": {"type": "string", "example": "0000812345"},
                    "bank_mnemonic": {"type": "string", "example": "KPY"},
                    "reserved": {"type": "string", "example": ""}
                },
                "required": ["consumer_number", "bank_mnemonic"]
            }
        },
        responses={
            200: OpenApiTypes.OBJECT,
            400: OpenApiTypes.OBJECT,
        },
        examples=[
            OpenApiExample(
                "Unpaid Bill Response",
                value={
                    "response_Code": "00",
                    "consumer_Detail": "MUHAMMAD FEROZ",
                    "bill_status": "U",
                    "due_date": "20241014",
                    "amount_within_dueDate": "+0000000186900",
                    "amount_after_dueDate": "+0000000202500",
                    "email_address": "example@gmail.com",
                    "contact_number": "03030303030",
                    "billing_month": "2410",
                    "date_paid": "",
                    "amount_paid": "",
                    "tran_auth_Id": "",
                    "reserved": ""
                }
            ),
            OpenApiExample(
                "Paid Bill Response",
                value={
                    "response_Code": "00",
                    "consumer_Detail": "MUHAMMAD FEROZ",
                    "bill_status": "P",
                    "due_date": "20240925",
                    "amount_within_dueDate": "+0000000186900",
                    "amount_after_dueDate": "+0000000202500",
                    "email_address": "example@gmail.com",
                    "contact_number": "03030303030",
                    "billing_month": "2409",
                    "date_paid": "20240910",
                    "amount_paid": "000000202500",
                    "tran_auth_Id": "202500",
                    "reserved": ""
                }
            ),
            OpenApiExample(
                "Error Response",
                value={
                    "response_Code": "01",
                    "consumer_Detail": "",
                    "bill_status": "",
                    "due_date": "",
                    "amount_within_dueDate": "",
                    "amount_after_dueDate": "",
                    "email_address": "",
                    "contact_number": "",
                    "billing_month": "",
                    "date_paid": "",
                    "amount_paid": "",
                    "tran_auth_Id": "",
                    "reserved": "Consumer number does not exist"
                }
            )
        ]
    )
    def post(self, request):
        """Handle bill inquiry request from Kuickpay"""
        data = request.data
        consumer_number = data.get('consumer_number', '')
        bank_mnemonic = data.get('bank_mnemonic', '')
        reserved = data.get('reserved', '')

        logger.info(f"Kuickpay Bill Inquiry: consumer={consumer_number}, bank={bank_mnemonic}")

        # Validate required fields
        if not consumer_number or not bank_mnemonic:
            return Response({
                "response_Code": "04",
                "consumer_Detail": "",
                "bill_status": "",
                "due_date": "",
                "amount_within_dueDate": "",
                "amount_after_dueDate": "",
                "email_address": "",
                "contact_number": "",
                "billing_month": "",
                "date_paid": "",
                "amount_paid": "",
                "tran_auth_Id": "",
                "reserved": "Invalid data: consumer_number and bank_mnemonic are required"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Look up booking by consumer_number (booking number)
            # Consumer number is the booking_number field
            booking = Booking.objects.filter(
                booking_number=consumer_number
            ).select_related('user', 'organization').first()

            if not booking:
                # Response code 01: Consumer number does not exist
                return Response({
                    "response_Code": "01",
                    "consumer_Detail": "",
                    "bill_status": "",
                    "due_date": "",
                    "amount_within_dueDate": "",
                    "amount_after_dueDate": "",
                    "email_address": "",
                    "contact_number": "",
                    "billing_month": "",
                    "date_paid": "",
                    "amount_paid": "",
                    "tran_auth_Id": "",
                    "reserved": "Booking not found"
                }, status=status.HTTP_200_OK)

            # Check if booking is blocked/inactive
            if booking.status in ['Canceled', 'Rejected']:
                return Response({
                    "response_Code": "02",
                "consumer_Detail": (booking.user.get_full_name() if booking.user and hasattr(booking.user, 'get_full_name') else "")[:30].ljust(30),
                    "bill_status": "B",
                    "due_date": "",
                    "amount_within_dueDate": "",
                    "amount_after_dueDate": "",
                "email_address": (booking.user.email if booking.user else "")[:30],
                "contact_number": "",
                    "billing_month": "",
                    "date_paid": "",
                    "amount_paid": "",
                    "tran_auth_Id": "",
                    "reserved": "Booking is cancelled or refunded"
                }, status=status.HTTP_200_OK)

            # Calculate amounts
            total_amount = Decimal(str(booking.total_amount or 0))
            paid_amount = Decimal(str(booking.paid_payment or 0))
            remaining_amount = total_amount - paid_amount

            # Format amounts according to Kuickpay spec (AN14 format)
            def format_amount(amount):
                """Format amount to Kuickpay AN14 format: +0000000186900 (last 2 digits = minor units)"""
                minor_units = int(amount * 100)
                sign = '+' if minor_units >= 0 else '-'
                return f"{sign}{abs(minor_units):013d}"

            # Determine bill status
            if remaining_amount <= 0:
                bill_status = "P"  # Paid
            else:
                bill_status = "U"  # Unpaid

            # Get payment info if paid
            latest_payment = BookingPayment.objects.filter(
                booking=booking,
                status='completed'
            ).order_by('-payment_date').first()

            # Format dates
            due_date = booking.created_at.strftime('%Y%m%d') if booking.created_at else ""
            billing_month = booking.created_at.strftime('%y%m') if booking.created_at else ""
            date_paid = latest_payment.payment_date.strftime('%Y%m%d') if latest_payment and latest_payment.payment_date else ""
            
            # Format paid amount (12 digits, no sign)
            amount_paid_formatted = ""
            if bill_status == "P" and latest_payment:
                paid_minor = int((latest_payment.amount or Decimal('0')) * 100)
                amount_paid_formatted = f"{paid_minor:012d}"

            # Build response
            response_data = {
                "response_Code": "00",
                "consumer_Detail": (booking.user.get_full_name() if booking.user and hasattr(booking.user, 'get_full_name') else "")[:30].ljust(30),
                "bill_status": bill_status,
                "due_date": due_date,
                "amount_within_dueDate": format_amount(total_amount),
                "amount_after_dueDate": format_amount(total_amount),  # Same for now
                "email_address": (booking.user.email if booking.user else "")[:30],
                "contact_number": "",
                "billing_month": billing_month,
                "date_paid": date_paid,
                "amount_paid": amount_paid_formatted,
                "tran_auth_Id": str(latest_payment.id)[:6] if latest_payment else "",
                "reserved": reserved
            }

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception(f"Bill inquiry error: {e}")
            return Response({
                "response_Code": "05",
                "consumer_Detail": "",
                "bill_status": "",
                "due_date": "",
                "amount_within_dueDate": "",
                "amount_after_dueDate": "",
                "email_address": "",
                "contact_number": "",
                "billing_month": "",
                "date_paid": "",
                "amount_paid": "",
                "tran_auth_Id": "",
                "reserved": f"Processing failed: {str(e)}"
            }, status=status.HTTP_200_OK)


class KuickpayBillPaymentAPIView(APIView):
    """
    Kuickpay Bill Payment API
    
    This endpoint is called BY Kuickpay to process bill payments.
    Implements the Bill Payment specification from Kuickpay BPS-Rest Based Document V3.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Bill Payment - Called by Kuickpay",
        description="""
        Kuickpay calls this endpoint to process a bill payment.
        
        **Request Format (POST with JSON body):**
        - consumer_number: Consumer/booking reference number
        - tran_auth_id: Transaction authorization ID (unique within same date)
        - transaction_amount: Payment amount (numeric string, e.g., "120")
        - tran_date: Transaction date (YYYYMMDD format)
        - tran_time: Transaction time (HHMMSS format)
        - bank_mnemonic: Bank identifier (e.g., 'KPY')
        - reserved: Optional reserved field
        
        **Response Codes:**
        - 00: Successful bill payment
        - 01: Consumer number does not exist
        - 02: Bill blocked or inactive
        - 03: Unknown error/duplicate/bad transaction
        - 04: Invalid data
        - 05: Processing failed
        """,
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "consumer_number": {"type": "string", "example": "0000812345"},
                    "tran_auth_id": {"type": "string", "example": "112233"},
                    "transaction_amount": {"type": "string", "example": "120"},
                    "tran_date": {"type": "string", "example": "20240115"},
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
        },
        examples=[
            OpenApiExample(
                "Success Response",
                value={
                    "response_Code": "00",
                    "Identification_parameter": "receipt_id_12345",
                    "reserved": ""
                }
            ),
            OpenApiExample(
                "Error Response",
                value={
                    "response_Code": "01",
                    "Identification_parameter": "",
                    "reserved": "Consumer number does not exist"
                }
            )
        ]
    )
    def post(self, request):
        """Handle bill payment request from Kuickpay"""
        data = request.data
        consumer_number = data.get('consumer_number', '')
        tran_auth_id = data.get('tran_auth_id', '')
        transaction_amount = data.get('transaction_amount', '')
        tran_date = data.get('tran_date', '')
        tran_time = data.get('tran_time', '')
        bank_mnemonic = data.get('bank_mnemonic', '')
        reserved = data.get('reserved', '')

        logger.info(f"Kuickpay Bill Payment: consumer={consumer_number}, amount={transaction_amount}, tran_auth_id={tran_auth_id}")

        # Validate required fields
        required_fields = ['consumer_number', 'tran_auth_id', 'transaction_amount', 'tran_date', 'tran_time', 'bank_mnemonic']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return Response({
                "response_Code": "04",
                "Identification_parameter": "",
                "reserved": f"Invalid data: missing fields {', '.join(missing_fields)}"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Validate and convert transaction_amount
            try:
                payment_amount = Decimal(str(transaction_amount))
                if payment_amount <= 0:
                    raise ValueError("Amount must be positive")
            except (ValueError, Decimal.InvalidOperation) as e:
                return Response({
                    "response_Code": "04",
                    "Identification_parameter": "",
                    "reserved": f"Invalid transaction amount: {str(e)}"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Look up booking
            booking = Booking.objects.filter(
                booking_number=consumer_number
            ).select_related('user', 'organization').first()

            if not booking:
                return Response({
                    "response_Code": "01",
                    "Identification_parameter": "",
                    "reserved": "Booking not found"
                }, status=status.HTTP_200_OK)

            # Check if booking is blocked/inactive
            if booking.status in ['Canceled', 'Rejected']:
                return Response({
                    "response_Code": "02",
                    "Identification_parameter": "",
                    "reserved": "Booking is cancelled or refunded"
                }, status=status.HTTP_200_OK)

            # Check for duplicate transaction (same tran_auth_id and date)
            # Note: payment_date is auto_now_add, so we check transaction_id instead
            existing_payment = BookingPayment.objects.filter(
                booking=booking,
                transaction_id=tran_auth_id
            ).first()

            if existing_payment:
                return Response({
                    "response_Code": "03",
                    "Identification_parameter": str(existing_payment.id),
                    "reserved": "Duplicate transaction"
                }, status=status.HTTP_200_OK)

            # Parse transaction date and time
            try:
                payment_datetime = datetime.strptime(f"{tran_date}{tran_time}", "%Y%m%d%H%M%S")
            except ValueError:
                payment_datetime = datetime.now()

            # Create payment record
            payment = BookingPayment.objects.create(
                booking=booking,
                amount=payment_amount,
                payment_method='online',  # Kuickpay is an online payment method
                status='completed',
                transaction_id=tran_auth_id,
                reference_no=f"KPY-{tran_date}-{tran_auth_id}",
                notes=f"Kuickpay payment via {bank_mnemonic}" + (f" - {reserved}" if reserved else "")
            )

            # Update booking paid amount
            booking.paid_payment = float((Decimal(str(booking.paid_payment or 0)) + payment_amount))
            booking.pending_payment = float(Decimal(str(booking.total_amount or 0)) - Decimal(str(booking.paid_payment or 0)))
            
            # Update booking status if fully paid
            if booking.paid_payment >= booking.total_amount:
                booking.status = 'Delivered'  # Fully paid
            
            booking.save()

            logger.info(f"Payment successful: booking={booking.id}, payment={payment.id}, amount={payment_amount}")

            # Return success response
            return Response({
                "response_Code": "00",
                "Identification_parameter": str(payment.id).zfill(20),  # Left padded with zeros
                "reserved": reserved
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception(f"Bill payment error: {e}")
            return Response({
                "response_Code": "05",
                "Identification_parameter": "",
                "reserved": f"Processing failed: {str(e)}"
            }, status=status.HTTP_200_OK)
