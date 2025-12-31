from rest_framework import viewsets,status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.throttling import SimpleRateThrottle
from rest_framework.exceptions import PermissionDenied
from universal.models import PaxMovement
from django.db.models import Prefetch, Sum, F, Value, DecimalField, FloatField, Count
from django.db.models.functions import Coalesce, Round, Cast
from django.utils.dateparse import parse_datetime, parse_date
from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import action
from django.db import connection
from django.db import transaction
from rest_framework import generics
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from .serializers import PublicBookingCreateSerializer, PublicPaymentCreateSerializer, BookingSerializer
from packages.models import UmrahPackage
from leads.models import Lead, FollowUp
from django.contrib.auth import get_user_model
from .models import Booking, Payment
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from organization.models import Agency
from organization.serializers import AgencySerializer
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse

# Admin endpoint to approve public payments
class AdminApprovePaymentAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, payment_id=None):
        with transaction.atomic():
            try:
                payment = Payment.objects.select_for_update().get(pk=payment_id)
            except Payment.DoesNotExist:
                return Response({"success": False, "message": "Payment not found"}, status=404)

            if payment.status == 'Completed':
                return Response({"success": True, "message": "Already approved"})

            # mark payment completed
            payment.status = 'Completed'
            payment.save(update_fields=['status'])

            # update booking totals (only if payment is associated with a booking)
            booking = payment.booking
            if booking:
                # use Decimal for safe arithmetic when model uses DecimalField
                from decimal import Decimal
                try:
                    prev = Decimal(str(booking.total_payment_received or 0))
                except Exception:
                    prev = Decimal('0')
                try:
                    amt = Decimal(str(payment.amount or 0))
                except Exception:
                    amt = Decimal('0')

                booking.total_payment_received = prev + amt

                # recompute flags
                try:
                    paid = float(booking.total_payment_received or 0)
                    total = float(booking.total_amount or 0)
                    booking.paid_payment = paid
                    booking.pending_payment = max(0.0, total - paid)
                    if paid >= total and total > 0:
                        booking.is_paid = True
                        booking.status = 'confirmed'
                    booking.save(update_fields=['total_payment_received', 'paid_payment', 'pending_payment', 'is_paid', 'status'])
                except Exception:
                    booking.save()

            # ledger entry: record cash received (for all approved payments)
            try:
                from organization.ledger_utils import find_account, create_entry_with_lines
            except Exception:
                find_account = create_entry_with_lines = None

            if create_entry_with_lines:
                # Find appropriate accounts based on payment context
                org_id = booking.organization_id if booking else payment.organization_id
                cash_acc = find_account(org_id, ['CASH', 'BANK']) or find_account(None, ['CASH', 'BANK'])
                suspense_acc = find_account(org_id, ['SUSPENSE', 'RECEIVABLE']) or find_account(None, ['SUSPENSE', 'RECEIVABLE'])
                
                if cash_acc and suspense_acc:
                    amount = payment.amount or 0
                    
                    if booking:
                        # Payment associated with a booking
                        audit_note = f"[auto] Payment #{payment.id} approved for booking {booking.booking_number}"
                        narration = f"Payment received for booking {booking.booking_number}"
                        booking_no = booking.booking_number
                        metadata = {'payment_id': payment.id, 'booking_id': booking.id}
                    else:
                        # Standalone payment (e.g., agent deposit)
                        audit_note = f"[auto] Standalone payment #{payment.id} approved"
                        narration = f"Standalone payment received - Transaction {payment.transaction_number or payment.id}"
                        booking_no = f"PAY-{payment.id}"  # Use payment ID as reference
                        metadata = {'payment_id': payment.id}
                    
                    ledger_entry = create_entry_with_lines(
                        booking_no=booking_no,
                        service_type='payment',
                        narration=narration,
                        metadata=metadata,
                        internal_notes=[audit_note],
                        created_by=request.user if request.user.is_authenticated else None,
                        lines=[
                            {'account': cash_acc, 'debit': amount, 'credit': 0},
                            {'account': suspense_acc, 'debit': 0, 'credit': amount},
                        ],
                        organization=cash_acc.organization if cash_acc else None,
                    )
                    
                    # Store the ledger entry ID on the payment
                    if ledger_entry:
                        payment.ledger_entry_id = ledger_entry.id
                        payment.save(update_fields=['ledger_entry_id'])

            # Update follow-ups for this booking: adjust remaining_amount or close if fully paid
            if booking:
                try:
                    # recompute remaining after payment
                    remaining = float(booking.total_amount or 0) - float(booking.total_payment_received or 0)
                except Exception:
                    remaining = None

                if remaining is not None:
                    open_fus = FollowUp.objects.filter(booking=booking, status__in=['open', 'pending']).order_by('created_at')
                    if remaining <= 0:
                        # close all open follow-ups
                        for fu in open_fus:
                            try:
                                fu.remaining_amount = 0
                                fu.close(user=request.user)
                            except Exception:
                                # best-effort; continue
                                fu.remaining_amount = 0
                                fu.status = 'closed'
                                fu.closed_at = __import__('datetime').datetime.now()
                                fu.save()
                    else:
                        # update first open follow-up remaining_amount
                        fu = open_fus.first()
                        if fu:
                            fu.remaining_amount = remaining
                            fu.save()

        return Response({"success": True, "payment_id": payment.id, "status": payment.status})

from .models import (
    Booking,
    BookingHotelDetails,
    BookingTransportDetails,
    BookingTicketDetails,
    BookingTicketTicketTripDetails,
    BookingTicketStopoverDetails,
    BookingPersonDetail,
    Payment,
    Sector,
    BigSector,
    VehicleType,
    InternalNote,
    BankAccount,
    OrganizationLink,
    AllowedReseller,
    DiscountGroup,
    Markup,
    BookingCallRemark
)
from .serializers import BookingSerializer, PaymentSerializer, SectorSerializer, BigSectorSerializer, VehicleTypeSerializer, InternalNoteSerializer, DiscountGroupSerializer, BankAccountSerializer, OrganizationLinkSerializer, AllowedResellerSerializer, MarkupSerializer, BookingCallRemarkSerializer
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from universal.scope import apply_user_scope

import json
class BookingViewSet(viewsets.ModelViewSet):
    def create(self, request, *args, **kwargs):
        """Override create to return a fresh serialization of the created
        Booking instance. The default behavior may return the serializer
        bound to input data which can miss related nested objects that are
        created in the serializer's `create` method. Re-serializing the
        instance ensures nested `ticket_details` and `person_details`
        (and other related lists) are included in the response.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        instance = serializer.instance
        # Re-serialize the created instance to include nested relations
        out_serializer = self.get_serializer(instance)
        headers = self.get_success_headers(out_serializer.data)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    @action(detail=False, methods=["get"], url_path="unpaid/(?P<organization_id>[^/.]+)")
    def get_unpaid_orders(self, request, organization_id=None):
        from django.utils import timezone
        now = timezone.now()
        unpaid_bookings = (
            Booking.objects.filter(
                organization_id=organization_id,
                status="unpaid",
                expiry_time__gte=now
            )
            .annotate(
                paid_payment_sum=Coalesce(
                    Sum("payment_details__amount", output_field=FloatField()),
                    Value(0.0, output_field=FloatField())
                ),
                pending_payment_sum=F("total_amount") - Coalesce(
                    Sum("payment_details__amount", output_field=FloatField()),
                    Value(0.0, output_field=FloatField())
                )
            )
            .filter(pending_payment_sum__gt=0)
        )

        results = []
        for booking in unpaid_bookings:
            person = booking.person_details.first()
            results.append({
                "booking_id": booking.id,
                "booking_no": booking.booking_number,
                "customer_name": f"{person.first_name} {person.last_name}".strip() if person else "",
                "contact_number": getattr(person, "contact_number", "") if person else "",
                "total_amount": booking.total_amount,
                "paid_payment": booking.paid_payment_sum,
                "pending_payment": booking.pending_payment_sum,
                "expiry_time": booking.expiry_time,
                "agent_id": getattr(booking, "user_id", None),
                "status": booking.status,
                "call_status": getattr(booking, "call_status", False),
                "client_note": getattr(booking, "client_note", None),
            })

        return Response({
            "total_unpaid": len(results),
            "unpaid_bookings": results
        })
    
    @action(detail=False, methods=["post"], url_path="unpaid/remarks")
    def add_call_remarks(self, request):
        data = request.data
        booking_id = data.get("booking_id")
        call_status = data.get("call_status")
        remarks = data.get("remarks", [])
        created_by = data.get("created_by")

        # Validate booking
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({"success": False, "message": "Invalid booking_id."}, status=status.HTTP_400_BAD_REQUEST)

        # Update call_status
        if call_status is not None:
            booking.call_status = call_status
            booking.save(update_fields=["call_status"])

        # Add remarks (support both IDs and new text remarks)
        remarks_created = 0
        for remark in remarks:
            if isinstance(remark, int):
                # If remark is an ID, skip (or you can fetch and link if you have a separate remarks table)
                continue
            if isinstance(remark, str) and remark.strip():
                BookingCallRemark.objects.create(
                    booking=booking,
                    created_by_id=created_by,
                    remark_text=remark.strip(),
                )
                remarks_created += 1

        return Response({
            "success": True,
            "message": "Call remarks added successfully.",
            "data": {
                "booking_id": booking.id,
                "call_status": booking.call_status,
                "remarks_count": remarks_created
            }
        }, status=status.HTTP_200_OK)
    serializer_class = BookingSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    NESTED_FIELDS = [
        "ticket_details",
        "person_details",
        "hotel_details",
        "transport_details",
    ]
    def get_queryset(self):
        """
        Optimized queryset to prevent N+1 queries using select_related and prefetch_related.
        Excludes public bookings to prevent finance conflicts.
        """
        qs = (
            Booking.objects.filter(is_public_booking=False)  # Exclude public bookings
            .annotate(
                paid_amount=Coalesce(
                    Sum("payment_details__amount", output_field=FloatField()),
                    Value(0.0, output_field=FloatField()),
                    output_field=FloatField(),
                ),
                remaining_amount=Cast(
                    Round(
                        Cast(F("total_amount"), FloatField()) - Coalesce(
                            Sum("payment_details__amount", output_field=FloatField()),
                            Value(0.0, output_field=FloatField()),
                            output_field=FloatField(),
                        ),
                        2  # round to 2 decimals
                    ),
                    FloatField()
                )
            )
            .prefetch_related(
                "hotel_details",
                "transport_details",
                "food_details",
                "ziyarat_details",
                Prefetch(
                    "ticket_details",
                    queryset=BookingTicketDetails.objects.prefetch_related(
                        "trip_details", "stopover_details"
                    ),
                ),
                "person_details",
                "payment_details",
            )
            .order_by("-date")
        )
        booking_number = self.request.query_params.get("booking_number")
        if booking_number:
            qs = qs.filter(booking_number=booking_number)
    
        return qs



@extend_schema(
    summary="Create a public booking for an Umrah package",
    description="""
    Create a public booking with optional passenger details.
    
    **Features:**
    - No authentication required
    - Accepts passenger details (name, passport, email, phone, bed preference)
    - Validates passenger counts and types
    - Creates booking, person records, and lead
    - Optionally creates payment
    
    **Passenger Details:**
    - Optional array of passenger information
    - Each passenger must have: type, name, passport_number, passport_expiry
    - Optional fields: email, phone, include_bed
    - Types: Adult, Child, Infant
    """,
    request=PublicBookingCreateSerializer,
    responses={
        201: {
            "type": "object",
            "properties": {
                "success": {"type": "boolean"},
                "booking_number": {"type": "string"},
                "invoice_no": {"type": "string"},
                "total_amount": {"type": "number"},
                "remaining_balance": {"type": "number"},
                "payment_id": {"type": "integer", "nullable": True}
            }
        },
        400: {"description": "Validation error"}
    },
    examples=[
        OpenApiExample(
            "Basic Booking",
            value={
                "umrah_package_id": 38,
                "total_pax": 2,
                "total_adult": 2,
                "contact_name": "Test User",
                "contact_phone": "03001234567",
                "contact_email": "test@example.com",
                "pay_now": False
            }
        ),
        OpenApiExample(
            "Booking with Passenger Details",
            value={
                "umrah_package_id": 38,
                "total_pax": 2,
                "total_adult": 2,
                "total_child": 0,
                "total_infant": 0,
                "contact_name": "Test User",
                "contact_phone": "03001234567",
                "contact_email": "test@example.com",
                "person_details": [
                    {
                        "type": "Adult",
                        "name": "Ali Raza",
                        "passport_number": "123AK098",
                        "passport_expiry": "2025-06-16",
                        "email": "ali@example.com",
                        "phone": "03001111111",
                        "include_bed": True
                    },
                    {
                        "type": "Adult",
                        "name": "Sara Khan",
                        "passport_number": "456XY789",
                        "passport_expiry": "2026-12-31",
                        "email": "sara@example.com",
                        "phone": "03002222222",
                        "include_bed": False
                    }
                ],
                "pay_now": False
            }
        )
    ]
)
class PublicBookingCreateAPIView(generics.ListCreateAPIView):
    """Public booking endpoints supporting both list (GET) and create (POST).
    
    GET /api/public/bookings/ - List public bookings (with filters)
    POST /api/public/bookings/ - Create new booking
    
    Accepts the full booking payload with:
    - hotel_details, ticket_details, transport_details
    - food_details, ziyarat_details, person_details
    - All booking-level fields
    
    Creates Booking with is_public_booking=True and status='Under-process'.
    
    Query parameters for GET:
    - email: Filter by contact email
    - phone: Filter by contact phone
    - booking_number: Filter by booking number
    """
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = Booking.objects.filter(is_public_booking=True)
        
        # Filter by email
        email = self.request.query_params.get('email')
        if email:
            queryset = queryset.filter(person_details__contact_details__icontains=email)
        
        # Filter by phone
        phone = self.request.query_params.get('phone')
        if phone:
            queryset = queryset.filter(person_details__contact_number__icontains=phone)
        
        # Filter by booking number
        booking_number = self.request.query_params.get('booking_number')
        if booking_number:
            queryset = queryset.filter(booking_number__iexact=booking_number)
        
        return queryset.select_related('umrah_package', 'organization').prefetch_related('person_details', 'hotel_details', 'ticket_details')
    
    def get_serializer_class(self):
        from .serializers import BookingSerializer
        return BookingSerializer
    
    def to_representation(self, instance):
        """Override to exclude user, agency, branch, organization objects from response."""
        ret = super().to_representation(instance)
        # Remove dummy user/agency/branch/organization objects
        ret.pop('user', None)
        ret.pop('agency', None)
        ret.pop('branch', None)
        ret.pop('organization', None)
        # Add organization_id
        ret['organization_id'] = instance.organization_id
        return ret
    
    def list(self, request, *args, **kwargs):
        """Override list to apply to_representation to each item."""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        # Remove user/agency/branch/organization from each item
        for item in data:
            item.pop('user', None)
            item.pop('agency', None)
            item.pop('branch', None)
            item.pop('organization', None)
            # Add organization_id if not present
            if 'organization_id' not in item:
                booking = queryset.get(id=item['id'])
                item['organization_id'] = booking.organization_id
        return Response(data)
    
    def perform_create(self, serializer):
        # Get umrah_package_id from validated data
        umrah_package_id = serializer.validated_data.get('umrah_package_id') or serializer.validated_data.get('umrah_package')
        
        # Get contact_information from validated data
        contact_information = serializer.validated_data.get('contact_information', [])
        
        # Save booking with public booking flags
        booking = serializer.save(
            is_public_booking=True,
            status='Under-process',
            created_by_user_type='customer',
            contact_information=contact_information  # Save contact information
        )
        
        # Store package_id on the instance for use in create() method
        if umrah_package_id:
            booking._umrah_package_id = umrah_package_id
    
    def create(self, request, *args, **kwargs):
        # Add required organization fields to request data before validation
        request_data = request.data.copy()
        
        # Get package to extract organization details
        umrah_package_id = request_data.get('umrah_package_id') or request_data.get('umrah_package')
        
        if umrah_package_id:
            try:
                pkg = UmrahPackage.objects.select_related('organization').get(pk=umrah_package_id)
                org = pkg.organization
                
                # Get or create branch
                branch = org.branches.first() if hasattr(org, 'branches') else None
                
                # Get or create agency
                agency = None
                if branch and hasattr(branch, 'agencies'):
                    agency = branch.agencies.first()
                if not agency and hasattr(org, 'agencies'):
                    agency = org.agencies.first()
                if not agency and branch:
                    agency = Agency.objects.create(branch=branch, name='Public Agency')
<<<<<<< HEAD
                
                # Get system user
                User = get_user_model()
                system_user = User.objects.filter(is_superuser=True).first() or User.objects.first()
                
                # Add required fields to request data
                request_data['organization_id'] = org.id
                request_data['branch_id'] = branch.id if branch else None
                request_data['agency_id'] = agency.id if agency else None
                request_data['user_id'] = system_user.id
                
            except UmrahPackage.DoesNotExist:
                pass
        
        # Now validate and create with the updated data
        serializer = self.get_serializer(data=request_data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Auto-populate inventory from package for public bookings
        booking = serializer.instance
        # Use the package_id stored in perform_create or fall back to request data
        package_id_for_population = getattr(booking, '_umrah_package_id', None) or umrah_package_id
        
        print(f"DEBUG: package_id_for_population = {package_id_for_population}, booking = {booking}, booking.id = {booking.id if booking else None}")
        print(f"DEBUG: booking.umrah_package = {booking.umrah_package if booking else None}")
        
        if package_id_for_population and booking:
            try:
                print(f"DEBUG: Calling _populate_inventory_from_package for booking {booking.id}")
                self._populate_inventory_from_package(booking, package_id_for_population)
                print(f"DEBUG: Successfully populated inventory for booking {booking.id}")
            except Exception as e:
                # Log error but don't fail the booking
                import traceback
                print(f"ERROR populating inventory: {e}")
                print(traceback.format_exc())
        else:
            print(f"DEBUG: Skipping inventory population - package_id={package_id_for_population}, booking={booking}")
        
        headers = self.get_success_headers(serializer.data)
        from rest_framework.response import Response
        return Response(serializer.data, status=201, headers=headers)
    
    def _populate_inventory_from_package(self, booking, package_id):
        """Auto-populate hotel, ticket, transport, food, and ziyarat details from package."""
        from .models import BookingHotelDetail, BookingTicketDetail, BookingTransportDetail
        
        # Get package with all related data
        pkg = UmrahPackage.objects.prefetch_related(
            'hotel_details__hotel_info',
            'ticket_details__ticket_info', 
            'transport_details__transport_sector_info'
        ).get(pk=package_id)
        
        total_pax = booking.total_pax or 1
        
        # 1. Create Hotel Details
        for hotel_detail in pkg.hotel_details.all():
            hotel_info = hotel_detail.hotel_info
            # Use sharing bed price as default (can be enhanced based on passenger room selections)
            price_per_night = hotel_detail.sharing_bed_selling_price or 0
            total_price = price_per_night * (hotel_detail.number_of_nights or 0) * total_pax
            
            BookingHotelDetail.objects.create(
                booking=booking,
                hotel=hotel_info,
                check_in_date=hotel_detail.check_in_date,
                check_out_date=hotel_detail.check_out_date,
                number_of_nights=hotel_detail.number_of_nights,
                room_type='Sharing',  # Default to sharing
                quantity=total_pax,
                price=price_per_night,
                total_price=total_price,
                is_price_pkr=True,
                riyal_rate=1,
                total_in_pkr=total_price,
=======
            except Exception:
                agency = None

            booking = Booking.objects.create(
                user=system_user,
                organization=org,
                branch=branch,
                agency=agency,
                booking_number=booking_number,
                total_pax=total_pax,
                total_adult=data.get('total_adult', 0) or 0,
                total_child=data.get('total_child', 0) or 0,
                total_infant=data.get('total_infant', 0) or 0,
                total_amount=float((pkg.price_per_person or 0) * total_pax),
                status='Pending',
                is_public_booking=True,
                created_by_user_type='customer',
                umrah_package=pkg,
>>>>>>> f9cbc8a4bc532ae662e983738af71ee464ed2766
            )
        
        # 2. Create Ticket Details
        for ticket_detail in pkg.ticket_details.all():
            ticket_info = ticket_detail.ticket_info
            adult_price = ticket_info.adult_selling_price or ticket_info.adult_price or 0
            child_price = ticket_info.child_selling_price or ticket_info.child_price or 0
            infant_price = ticket_info.infant_selling_price or ticket_info.infant_price or 0
            
            total_ticket_price = (
                (booking.total_adult or 0) * adult_price +
                (booking.total_child or 0) * child_price +
                (booking.total_infant or 0) * infant_price
            )
            
            BookingTicketDetail.objects.create(
                booking=booking,
                ticket=ticket_info,
                adult_price=adult_price,
                child_price=child_price,
                infant_price=infant_price,
                total_price=total_ticket_price,
            )
        
        # 3. Create Transport Details
        for transport_detail in pkg.transport_details.all():
            transport_sector = transport_detail.transport_sector_info
            price = transport_detail.transport_selling_price or 0
            total_transport_price = price * total_pax
            
            BookingTransportDetail.objects.create(
                booking=booking,
                transport_sector=transport_sector,
                vehicle_type=transport_detail.vehicle_type,
                price=price,
                total_price=total_transport_price,
            )
        
        # 4. Create Food Details (if package has food)
        if pkg.food_selling_price and pkg.food_selling_price > 0:
            from .models import BookingFoodDetail
            total_food_price = pkg.food_selling_price * total_pax
            
            BookingFoodDetail.objects.create(
                booking=booking,
                food_price=pkg.food_selling_price,
                total_price=total_food_price,
                is_price_pkr=True,
            )
        
        # 5. Create Ziyarat Details (if package has ziyarat)
        from .models import BookingZiyaratDetail
        
        if pkg.makkah_ziyarat_selling_price and pkg.makkah_ziyarat_selling_price > 0:
            total_makkah_ziyarat = pkg.makkah_ziyarat_selling_price * total_pax
            BookingZiyaratDetail.objects.create(
                booking=booking,
                ziyarat_type='Makkah',
                price=pkg.makkah_ziyarat_selling_price,
                total_price=total_makkah_ziyarat,
                is_price_pkr=True,
            )
        
        if pkg.madinah_ziyarat_selling_price and pkg.madinah_ziyarat_selling_price > 0:
            total_madinah_ziyarat = pkg.madinah_ziyarat_selling_price * total_pax
            BookingZiyaratDetail.objects.create(
                booking=booking,
                ziyarat_type='Madinah',
                price=pkg.madinah_ziyarat_selling_price,
                total_price=total_madinah_ziyarat,
                is_price_pkr=True,
            )
        
        # 6. Refresh booking to recalculate totals
        booking.refresh_from_db()
        print(f"DEBUG: Inventory populated successfully for booking {booking.id}")



class PublicBookingViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public booking endpoints for customers to view their bookings.
    
    GET /api/public/bookings/ - List bookings (filtered by email or phone)
    GET /api/public/bookings/{id}/ - Retrieve single booking
    
    Query parameters:
    - email: Filter by contact email
    - phone: Filter by contact phone  
    - booking_number: Filter by booking number
    """
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        from .serializers import BookingSerializer
        return BookingSerializer
    
    def get_queryset(self):
        queryset = Booking.objects.filter(is_public_booking=True)
        
        # Filter by email
        email = self.request.query_params.get('email')
        if email:
            queryset = queryset.filter(person_details__contact_details__icontains=email)
        
        # Filter by phone
        phone = self.request.query_params.get('phone')
        if phone:
            queryset = queryset.filter(person_details__contact_number__icontains=phone)
        
        # Filter by booking number
        booking_number = self.request.query_params.get('booking_number')
        if booking_number:
            queryset = queryset.filter(booking_number__iexact=booking_number)
        
        return queryset.select_related('umrah_package', 'organization').prefetch_related('person_details', 'hotel_details', 'ticket_details')
    
    @action(detail=True, methods=['post', 'patch'], url_path='confirm')
    def confirm(self, request, pk=None):
        """
        Confirm a public booking by updating its status to 'Confirmed'.
        
        POST/PATCH /api/public/bookings/{id}/confirm/
        """
        booking = self.get_object()
        
        # Update status to Confirmed
        booking.status = 'Confirmed'
        booking.save()
        
        # Return updated booking
        serializer = self.get_serializer(booking)
        return Response(serializer.data)

class PublicBookingPaymentCreateAPIView(generics.CreateAPIView):
    """Create a public payment for a booking (public_mode=True).

    Admin will later approve/verify these payments via admin endpoints.
    """
    permission_classes = [AllowAny]
    serializer_class = PublicPaymentCreateSerializer

    def create(self, request, booking_number=None, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            booking = Booking.objects.get(booking_number=data['booking_number'])
        except Booking.DoesNotExist:
            return Response({"success": False, "message": "Invalid booking_number"}, status=400)

        with transaction.atomic():
            org = booking.organization
            branch = booking.branch
            payment = Payment.objects.create(
                organization=org,
                branch=branch,
                booking=booking,
                method=data.get('method', 'online'),
                amount=float(data['amount']),
                status='Pending',
                public_mode=True,
                transaction_number=data.get('transaction_number'),
            )

            # After creating a public payment (pending), create or update a FollowUp
            try:
                User = get_user_model()
                system_user = User.objects.filter(is_superuser=True).first() or User.objects.first()
            except Exception:
                system_user = None

            try:
                paid = float(payment.amount) if payment else 0.0
                remaining = float(booking.total_amount or 0) - paid
                if remaining > 0:
                    # prefer existing open follow-up for booking
                    fu = FollowUp.objects.filter(booking=booking, status__in=['open', 'pending']).order_by('created_at').first()
                    if fu:
                        fu.remaining_amount = remaining
                        fu.save()
                    else:
                        # attach to any lead associated with booking if present
                        lead = None
                        try:
                            lead = booking.lead_set.first()
                        except Exception:
                            lead = None
                        fu = FollowUp.objects.create(
                            booking=booking,
                            lead=lead,
                            remaining_amount=remaining,
                            status='open',
                            notes='Auto follow-up for remaining payment (public payment created)',
                            created_by=system_user,
                        )

                    # enqueue a notification for follow-up creation (best-effort)
                    try:
                        from django.db import transaction as _tx
                        def _notify_fu():
                            try:
                                from notifications import services as _ns
                                _ns.enqueue_followup_created(fu.id)
                            except Exception:
                                pass
                        _tx.on_commit(_notify_fu)
                    except Exception:
                        pass

            except Exception:
                # Best-effort; do not fail payment creation if follow-up logic fails
                pass

        return Response({"success": True, "payment_id": payment.id, "status": payment.status}, status=201)
    @action(detail=False, methods=["get"], url_path="by-ticket")
    def by_ticket(self, request):
        ticket_id = request.query_params.get("ticket_id")
        if not ticket_id:
            return Response({"error": "ticket_id is required"}, status=400)

        query = """
        SELECT 
            tickets_ticket.id AS id, 
            tickets_ticket.is_meal_included as is_meal_included,
            tickets_ticket.is_refundable as is_refundable,
            tickets_ticket.pnr as pnr,
            tickets_ticket.child_price as child_price,
            tickets_ticket.infant_price as infant_price,
            tickets_ticket.adult_price as adult_price,
            tickets_ticket.total_seats as total_seats,
            tickets_ticket.left_seats as left_seats,
            tickets_ticket.booked_tickets as booked_tickets,
            tickets_ticket.confirmed_tickets as confirmed_tickets,
            tickets_ticket.weight as weight,
            tickets_ticket.pieces as pieces,
            tickets_ticket.is_umrah_seat as is_umrah_seat,
            tickets_ticket.trip_type as trip_type,
            tickets_ticket.departure_stay_type as departure_stay_type,
            tickets_ticket.return_stay_type as return_stay_type,
            tickets_ticket.status as status,
            tickets_ticket.organization_id as organization_id,
            tickets_ticket.airline_id as airline_id,
            tickets_tickettripdetails.id as trip_id,
            tickets_tickettripdetails.departure_date_time as departure_date_time,
            tickets_tickettripdetails.arrival_date_time as arrival_date_time,
            tickets_tickettripdetails.trip_type as trip_type,
            tickets_tickettripdetails.departure_city_id as departure_city,
            tickets_tickettripdetails.arrival_city_id as arrival_city,
            booking_bookingticketstopoverdetails.stopover_duration as stopover_duration,
            booking_bookingticketstopoverdetails.trip_type as stop_trip_type,
            booking_bookingticketstopoverdetails.stopover_city_id as stopover_city,
            organization_agency.name as agency_name,
            organization_agency.address as agency_address,
            organization_agency.ageny_name AS agency_name2,
            organization_agency.agreement_status AS agency_agreement_status,
            organization_agency.email AS agency_email,
            organization_agency.phone_number AS agency_phone,
            organization_agency.logo AS agency_logo,
            booking_bookingpersondetail.age_group as person_age_group,
            booking_bookingpersondetail.person_title as person_title,
            booking_bookingpersondetail.first_name as person_first_name,
            booking_bookingpersondetail.last_name as person_last_name,
            booking_bookingpersondetail.passport_number as person_passport_number,
            booking_bookingpersondetail.date_of_birth as person_date_of_birth,
            booking_bookingpersondetail.passpoet_issue_date as person_passpoet_issue_date,
            booking_bookingpersondetail.passport_expiry_date as person_passport_expiry_date,
            booking_bookingpersondetail.country as person_passport_country,
            booking_bookingpersondetail.ticket_price as person_ticket_price,
            booking_booking.total_ticket_amount_pkr as total_ticket_amount_pkr,
            booking_booking.status as booking_status,
            booking_booking.is_paid as booking_is_paid,
            booking_booking.category as booking_category
        FROM tickets_ticket 
        JOIN tickets_tickettripdetails ON tickets_ticket.id=tickets_tickettripdetails.ticket_id 
        JOIN booking_bookingticketdetails ON tickets_ticket.id= booking_bookingticketdetails.ticket_id 
        JOIN booking_booking ON booking_bookingticketdetails.booking_id = booking_booking.id 
        JOIN booking_bookingticketstopoverdetails ON tickets_ticket.id=booking_bookingticketstopoverdetails.ticket_id 
        JOIN organization_agency ON booking_booking.agency_id=organization_agency.id 
        JOIN booking_bookingpersondetail ON booking_booking.id= booking_bookingpersondetail.booking_id
        WHERE tickets_ticket.id = %s
        """

        with connection.cursor() as cursor:
            cursor.execute(query, [ticket_id])
            columns = [col[0] for col in cursor.description]
            result = [dict(zip(columns, row)) for row in cursor.fetchall()]

        if not result:
            # Return an empty list when there are no bookings for the ticket
            # (previously returned 404). Returning 200 with [] is easier for
            # frontend handling and avoids noisy 404 logs when a ticket has
            # no associated bookings yet.
            return Response([], status=200)

        return Response(result)
    # @action(detail=False, methods=["get"], url_path="by-ticket")
    # def by_ticket(self, request):
    #     ticket_id = request.query_params.get("ticket_id")
    #     if not ticket_id:
    #         return Response({"error": "ticket_id is required"}, status=400)
    
    #     booking = (
    #         self.get_queryset()
    #         .filter(ticket_details__id=ticket_id)
    #         .first()
    #     )
    
    #     if not booking:
    #         return Response({"error": "No booking found for this ticket_id"}, status=404)
    
    #     serializer = self.get_serializer(booking)
    #     data = serializer.data
    
    #     # ✅ sirf required fields pick karo
    #     filtered_data = {
    #         "ticket_details": data.get("ticket_details", []),
    #         "agency": data.get("agency", {}),
    #         "user": data.get("user", {}),  # agent details
    #         "order_number": data.get("booking_number"),
    #         "persons": [
    #             {
    #                 "age_group": p.get("age_group"),
    #                 "person_title": p.get("person_title"),
    #                 "first_name": p.get("first_name"),
    #                 "last_name": p.get("last_name"),
    #                 "passport_number": p.get("passport_number"),
    #                 "date_of_birth": p.get("date_of_birth"),
    #                 "passpoet_issue_date": p.get("passpoet_issue_date"),
    #                 "passport_expiry_date": p.get("passport_expiry_date"),
    #                 "country": p.get("country"),
    #                 "ticket_price": p.get("ticket_price"),
    #             }
    #             for p in data.get("person_details", [])
    #         ],
    #         "total_ticket_amount_pkr": data.get("total_ticket_amount_pkr", 0),
    #         "status": data.get("status"),
    #         "is_paid": data.get("is_paid"),
    #         "category": data.get("category"),
    #     }
    
    #     return Response(filtered_data)
    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def get_by_umrah_package(self, request):
        package_id = request.query_params.get("umrah_package_id")
        if not package_id:
            return Response(
                {"error": "Missing 'umrah_package_id' query parameter"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        bookings = Booking.objects.filter(umrah_package_id=package_id).select_related(
            "user", "organization", "branch", "agency", "umrah_package"
        )

        # If frontend provides an organization query param, restrict results to that org
        org_id = request.query_params.get("organization")
        if org_id:
            try:
                bookings = bookings.filter(organization_id=int(org_id))
            except Exception:
                # if org_id is invalid, return bad request
                return Response({"error": "Invalid 'organization' query parameter"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(bookings, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Split a booking into multiple bookings",
        description="""
        Split a single booking into multiple separate bookings while maintaining data integrity.
        
        **What it does:**
        1. Creates new bookings with selected passengers and services
        2. Auto-updates ledger entries for each new booking
        3. Maintains audit trail (who split, when, why)
        4. Marks original booking as 'split'
        5. Preserves all relationships (hotels, transport, ziyarat, food)
        
        **Use cases:**
        - Group dividing into separate travel plans
        - Different return dates for passengers
        - Separating families from larger groups
        
        **Important:**
        - Original booking is preserved (not deleted)
        - All split bookings reference original_booking_id
        - Ledger entries auto-generated
        - Commission/profit recalculated
        """,
        tags=["Bookings - Split"],
        request=OpenApiTypes.OBJECT,
        responses={
            200: OpenApiTypes.OBJECT,
            400: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT,
        },
        examples=[
            OpenApiExample(
                "Split Request",
                value={
                    "original_booking_id": 123,
                    "split_reason": "Customer group divided into 2 separate travel plans",
                    "new_booking_structure": [
                        {
                            "person_detail_ids": [1, 2],
                            "payment_adjustment": 25000,
                            "notes": "First group - earlier return"
                        },
                        {
                            "person_detail_ids": [3],
                            "payment_adjustment": 18000,
                            "notes": "Second group - later return"
                        }
                    ]
                }
            ),
            OpenApiExample(
                "Split Response",
                value={
                    "status": "success",
                    "message": "Booking successfully split into 2 new bookings",
                    "original_booking_id": 123,
                    "new_bookings": [
                        {
                            "booking_id": 456,
                            "booking_number": "BKG-2024-A",
                            "pax_count": 2,
                            "total_amount": 25000
                        },
                        {
                            "booking_id": 457,
                            "booking_number": "BKG-2024-B",
                            "pax_count": 1,
                            "total_amount": 18000
                        }
                    ],
                    "split_by": "admin@example.com",
                    "split_at": "2025-11-02T20:00:00Z"
                }
            )
        ]
    )
    @action(detail=False, methods=["post"], url_path="split")
    def split_booking(self, request):
        """
        Split a booking into multiple bookings.
        """
        from django.db import transaction
        from django.utils import timezone
        import copy
        
        # Validate input
        original_booking_id = request.data.get('original_booking_id')
        split_reason = request.data.get('split_reason', 'Booking split')
        new_structure = request.data.get('new_booking_structure', [])
        
        if not original_booking_id:
            return Response(
                {"error": "original_booking_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not new_structure or len(new_structure) < 2:
            return Response(
                {"error": "At least 2 new booking structures required for split"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get original booking
        try:
            original_booking = Booking.objects.select_related(
                'organization', 'branch', 'agency', 'user', 'umrah_package'
            ).prefetch_related(
                'person_details', 'payments', 'hotel_details', 
                'transport_details', 'ziyarat_details', 'food_details'
            ).get(id=original_booking_id)
        except Booking.DoesNotExist:
            return Response(
                {"error": f"Booking {original_booking_id} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Validate person_detail_ids exist
        all_person_ids = []
        for struct in new_structure:
            person_ids = struct.get('person_detail_ids', [])
            all_person_ids.extend(person_ids)
        
        existing_person_ids = set(
            original_booking.person_details.values_list('id', flat=True)
        )
        
        for pid in all_person_ids:
            if pid not in existing_person_ids:
                return Response(
                    {"error": f"Person detail ID {pid} not found in booking {original_booking_id}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        new_bookings = []
        
        try:
            with transaction.atomic():
                # Mark original booking as split
                original_booking.status = 'split'
                original_booking.save(update_fields=['status'])
                
                # Create new bookings
                for idx, struct in enumerate(new_structure):
                    person_ids = struct.get('person_detail_ids', [])
                    payment_adjustment = struct.get('payment_adjustment', 0)
                    notes = struct.get('notes', '')
                    
                    # Clone booking
                    new_booking = copy.copy(original_booking)
                    new_booking.pk = None
                    new_booking.id = None
                    new_booking.booking_number = f"{original_booking.booking_number}-{chr(65+idx)}"  # A, B, C...
                    new_booking.status = 'confirmed'
                    new_booking.total = payment_adjustment
                    new_booking.created_at = timezone.now()
                    new_booking.save()
                    
                    # Clone person details
                    persons = original_booking.person_details.filter(id__in=person_ids)
                    for person in persons:
                        person.pk = None
                        person.id = None
                        person.booking = new_booking
                        person.save()
                    
                    # Create audit log
                    from logs.models import SystemLog
                    SystemLog.objects.create(
                        action_type='booking_split',
                        model_name='Booking',
                        record_id=new_booking.id,
                        user_id=request.user.id,
                        organization_id=original_booking.organization_id,
                        branch_id=original_booking.branch_id,
                        description=f"Split from booking {original_booking.booking_number}. Reason: {split_reason}. Notes: {notes}",
                        status='success',
                        old_data={'original_booking_id': original_booking.id},
                        new_data={'person_count': len(person_ids), 'amount': payment_adjustment}
                    )
                    
                    new_bookings.append({
                        'booking_id': new_booking.id,
                        'booking_number': new_booking.booking_number,
                        'pax_count': len(person_ids),
                        'total_amount': payment_adjustment
                    })
            
            return Response({
                'status': 'success',
                'message': f'Booking successfully split into {len(new_bookings)} new bookings',
                'original_booking_id': original_booking.id,
                'original_booking_number': original_booking.booking_number,
                'new_bookings': new_bookings,
                'split_by': request.user.email or request.user.username,
                'split_at': timezone.now().isoformat(),
                'split_reason': split_reason
            })
            
        except Exception as e:
            return Response(
                {"error": f"Failed to split booking: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



    def _parse_to_list(self, val):
        """Return a list of dicts from val (str JSON / dict / list) or [] on failure."""
        if isinstance(val, str):
            try:
                parsed = json.loads(val)
            except Exception:
                return []
        elif isinstance(val, dict):
            return [val]
        elif isinstance(val, list):
            parsed = val
        else:
            return []

        if isinstance(parsed, dict):
            return [parsed]
        if isinstance(parsed, list):
            return parsed
        return []

    def _normalize_data(self, request):
        """
        Convert request.data (QueryDict) â†’ plain dict with proper nested Python lists/dicts.
        IMPORTANT: Do NOT return a QueryDict; return a normal dict.
        """
        raw = request.data
        out = {}

        # If it's a QueryDict, use get() for first item; else treat it like a normal dict
        is_qd = hasattr(raw, "getlist")

        for key in (raw.keys() if is_qd else raw):
            value = raw.get(key) if is_qd else raw.get(key)

            if key in self.NESTED_FIELDS:
                out[key] = self._parse_to_list(value)
            else:
                out[key] = value  # let serializer coerce scalars (ints/bools/dates)

        # Attach uploaded passport picture to the right person record
        persons = out.get("person_details")
        if isinstance(persons, list):
            for person in persons:
                if isinstance(person, dict) and "passport_picture_field" in person:
                    ref = person["passport_picture_field"]
                    file_key = f"person_files[{ref}]"
                    file_obj = request.FILES.get(file_key)
                    if file_obj:
                        person["passport_picture"] = file_obj

        return out


class AdminPublicBookingViewSet(viewsets.ModelViewSet):
    """Admin endpoints for public bookings: list, retrieve and actions: confirm, cancel, verify_payment."""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_serializer_class(self):
        from .serializers import BookingSerializer
        return BookingSerializer

    def get_queryset(self):
        qs = Booking.objects.filter(is_public_booking=True).prefetch_related('person_details', 'payment_details').order_by('-date')
        
        # Filter by organization if provided
        organization_id = self.request.query_params.get('organization')
        if organization_id:
            qs = qs.filter(organization_id=organization_id)
        
        # allow optional filtering by status/booking_number
        booking_no = self.request.query_params.get('booking_number')
        status_q = self.request.query_params.get('status')
        if booking_no:
            qs = qs.filter(booking_number=booking_no)
        if status_q:
            qs = qs.filter(status=status_q)
        return qs

    def list(self, request, *args, **kwargs):
        """Override list to exclude user/agency/branch/organization objects."""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        # Remove user/agency/branch/organization from each item
        for item in data:
            item.pop('user', None)
            item.pop('agency', None)
            item.pop('branch', None)
            item.pop('organization', None)
            # Ensure organization_id is present
            if 'organization_id' not in item:
                booking = queryset.get(id=item['id'])
                item['organization_id'] = booking.organization_id
        return Response(data)
    # Removed custom list() method - now uses PublicBookingSerializer
    # which excludes dummy user/agency/branch objects

    @action(detail=True, methods=['post'], url_path='approve')
    def approve_booking(self, request, pk=None):
        """Approve a public booking - sets status to 'Approved'."""
        try:
            booking = Booking.objects.get(pk=pk, is_public_booking=True)
        except Booking.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)

        booking.status = 'Approved'
        booking.save(update_fields=['status'])

        return Response({'detail': 'Booking approved successfully', 'status': booking.status})

    @action(detail=True, methods=['post'], url_path='confirm')
    def confirm_booking(self, request, pk=None):
        try:
            booking = Booking.objects.get(pk=pk, is_public_booking=True)
        except Booking.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)

        booking.status = 'confirmed'
        booking.save(update_fields=['status'])

        # try to notify customer/sales via on_commit hook (best-effort)
        try:
            def _notify():
                try:
                    from notifications import services as _ns
                    _ns.enqueue_booking_confirmed(booking.id)
                except Exception:
                    pass
            transaction.on_commit(_notify)
        except Exception:
            pass

        # update package confirmed seats if applicable
        try:
            pkg = getattr(booking, 'umrah_package', None)
            if pkg:
                pkg.confirmed_seats = (pkg.confirmed_seats or 0) + (booking.total_pax or 0)
                pkg.save(update_fields=['confirmed_seats'])
        except Exception:
            pass

        return Response({'success': True, 'booking_id': booking.id, 'status': booking.status})

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel_booking(self, request, pk=None):
        try:
            booking = Booking.objects.select_related('umrah_package').get(pk=pk, is_public_booking=True)
        except Booking.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)
        # capture previous status to adjust confirmed seats if needed
        prev_status = getattr(booking, 'status', None)

        # mark canceled and free up package seats if associated
        booking.status = 'canceled'
        booking.save(update_fields=['status'])

        try:
            pkg = booking.umrah_package
            if pkg:
                # free seats
                pkg.left_seats = (pkg.left_seats or 0) + (booking.total_pax or 0)
                pkg.booked_seats = max(0, (pkg.booked_seats or 0) - (booking.total_pax or 0))
                # if booking was previously confirmed, reduce confirmed_seats
                if str(prev_status).lower() == 'confirmed':
                    pkg.confirmed_seats = max(0, (pkg.confirmed_seats or 0) - (booking.total_pax or 0))
                pkg.save(update_fields=['left_seats', 'booked_seats', 'confirmed_seats'])
        except Exception:
            pass

        # notify cancellation
        try:
            def _notify_cancel():
                try:
                    from notifications import services as _ns
                    _ns.enqueue_booking_canceled(booking.id)
                except Exception:
                    pass
            transaction.on_commit(_notify_cancel)
        except Exception:
            pass

        return Response({'success': True, 'booking_id': booking.id, 'status': booking.status})

    @action(detail=True, methods=['post'], url_path='verify-payment')
    def verify_payment(self, request, pk=None):
        """Approve a public payment associated with this booking.
        Accepts POST body: {"payment_id": <id>} or will attempt to approve the latest pending public payment.
        """
        payment_id = request.data.get('payment_id')
        try:
            booking = Booking.objects.get(pk=pk, is_public_booking=True)
        except Booking.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)

        payment = None
        if payment_id:
            payment = Payment.objects.filter(pk=payment_id, booking=booking, public_mode=True).first()
        if not payment:
            payment = Payment.objects.filter(booking=booking, public_mode=True, status='Pending').order_by('-id').first()
        if not payment:
            return Response({'detail': 'No pending payment found'}, status=404)

        # reuse admin approval logic (similar to AdminApprovePaymentAPIView)
        from decimal import Decimal
        with transaction.atomic():
            payment.status = 'Completed'
            payment.save(update_fields=['status'])

            try:
                prev = Decimal(str(booking.total_payment_received or 0))
            except Exception:
                prev = Decimal('0')
            try:
                amt = Decimal(str(payment.amount or 0))
            except Exception:
                amt = Decimal('0')

            booking.total_payment_received = prev + amt
            try:
                paid = float(booking.total_payment_received or 0)
                total = float(booking.total_amount or 0)
                booking.paid_payment = paid
                booking.pending_payment = max(0.0, total - paid)
                if paid >= total and total > 0:
                    booking.is_paid = True
                    booking.status = 'confirmed'
                booking.save(update_fields=['total_payment_received', 'paid_payment', 'pending_payment', 'is_paid', 'status'])
            except Exception:
                booking.save()

            # ledger entry (best-effort)
            try:
                from organization.ledger_utils import find_account, create_entry_with_lines
            except Exception:
                find_account = create_entry_with_lines = None

            if create_entry_with_lines:
                cash_acc = find_account(booking.organization_id, ['CASH', 'BANK']) or find_account(None, ['CASH', 'BANK'])
                suspense_acc = find_account(booking.organization_id, ['SUSPENSE', 'RECEIVABLE']) or find_account(None, ['SUSPENSE', 'RECEIVABLE'])
                if cash_acc and suspense_acc:
                    amount = payment.amount or 0
                    audit_note = f"[auto] Public payment #{payment.id} approved for booking {booking.booking_number}"
                    create_entry_with_lines(
                        booking_no=booking.booking_number,
                        service_type='payment',
                        narration=f"Public payment received for booking {booking.booking_number}",
                        metadata={'payment_id': payment.id, 'booking_id': booking.id},
                        internal_notes=[audit_note],
                        created_by=request.user if request.user.is_authenticated else None,
                        lines=[
                            {'account': cash_acc, 'debit': amount, 'credit': 0},
                            {'account': suspense_acc, 'debit': 0, 'credit': amount},
                        ],
                    )

            # update follow-ups similar to AdminApprovePaymentAPIView
            try:
                remaining = float(booking.total_amount or 0) - float(booking.total_payment_received or 0)
            except Exception:
                remaining = None

            if remaining is not None:
                open_fus = FollowUp.objects.filter(booking=booking, status__in=['open', 'pending']).order_by('created_at')
                if remaining <= 0:
                    for fu in open_fus:
                        try:
                            fu.remaining_amount = 0
                            fu.close(user=request.user)
                        except Exception:
                            fu.remaining_amount = 0
                            fu.status = 'closed'
                            fu.closed_at = __import__('datetime').datetime.now()
                            fu.save()
                else:
                    fu = open_fus.first()
                    if fu:
                        fu.remaining_amount = remaining
                        fu.save()

        return Response({'success': True, 'payment_id': payment.id, 'booking_id': booking.id})


class PublicBookingRateThrottle(SimpleRateThrottle):
    """Simple per-IP throttle for public booking endpoint."""
    scope = "public_booking"

    def get_rate(self):
        # Fixed rate for now. Can be moved to settings if desired.
        return "10/min"

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}


class PublicBookingStatusAPIView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [PublicBookingRateThrottle]

    def get(self, request, booking_no=None):
        ref = request.query_params.get("ref")

        # validate booking_no when present to avoid path traversal / abusive lookup
        if booking_no:
            import re
            # allow alphanumerics, dash, underscore; reasonable max length
            if not re.match(r'^[A-Za-z0-9\-\_]{1,60}$', booking_no):
                return Response({"detail": "Invalid booking number format."}, status=status.HTTP_400_BAD_REQUEST)

        # support three modes: /.../<booking_no>/?ref=..., /...?ref=..., /.../<booking_no>/
        booking = None
        if ref and not booking_no:
            booking = Booking.objects.filter(public_ref=ref).first()
        elif booking_no and ref:
            booking = Booking.objects.filter(booking_number=booking_no, public_ref=ref).first()
        elif booking_no:
            booking = Booking.objects.filter(booking_number=booking_no).first()
        else:
            # ref-only via query param
            if ref:
                booking = Booking.objects.filter(public_ref=ref).first()

        if not booking:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        # check expiry
        from django.utils import timezone
        if booking.expiry_time and booking.expiry_time < timezone.now():
            return Response({"detail": "Booking expired."}, status=status.HTTP_404_NOT_FOUND)

        serializer = BookingSerializer(booking, context={"request": request})
        return Response(serializer.data)
    
    # The public booking view is read-only for status lookups. Create/update
    # behavior is handled by the internal BookingViewSet. Keep this APIView
    # focused on GET lookups to avoid exposing write actions publicly.


class PaxSummaryAPIView(APIView):
    """Simple Pax summary aggregator.

    Query params:
      - date_from, date_to (ISO date)
      - group_by (booking_type|status) — default booking_type

    Response: { total_bookings, total_pax, breakdown: [{key, bookings, pax}] }
    """
    permission_classes = []  # use default auth elsewhere; rely on apply_user_scope

    def get(self, request):
        qs = Booking.objects.all()

        # apply user scope so callers only see their allowed data
        qs = apply_user_scope(qs, request.user)

        # date filtering (created_at is used for booking creation time when available)
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        if date_from:
            # accept date or datetime
            dt = parse_date(date_from) or parse_datetime(date_from)
            if dt:
                qs = qs.filter(created_at__gte=dt)
        if date_to:
            dt = parse_date(date_to) or parse_datetime(date_to)
            if dt:
                # include the whole day if date provided
                if isinstance(dt, (type(None),)):
                    qs = qs.filter(created_at__lte=dt)
                else:
                    qs = qs.filter(created_at__lte=dt)

        group_by = request.query_params.get("group_by", "booking_type")

        # map group_by to model field
        if group_by == "status":
            key_field = "status"
        elif group_by == "organization":
            key_field = "organization_id"
        elif group_by == "branch":
            key_field = "branch_id"
        elif group_by == "agency":
            key_field = "agency_id"
        else:
            key_field = "booking_type"

        # use DB aggregation: Count bookings and Sum total_pax
        agg_qs = (
            qs.values(key_field)
            .annotate(bookings=Count("id"), pax=Coalesce(Sum("total_pax", output_field=FloatField()), Value(0, output_field=FloatField()), output_field=FloatField()))
            .order_by()
        )

        breakdown = []
        for row in agg_qs:
            key = row.get(key_field)
            # For foreign keys, present the id (caller can resolve names separately if needed)
            breakdown.append({"key": key, "bookings": int(row.get("bookings") or 0), "pax": float(row.get("pax") or 0)})

        total_bookings = sum(item["bookings"] for item in breakdown)
        total_pax = sum(item["pax"] for item in breakdown)

        return Response({"total_bookings": total_bookings, "total_pax": total_pax, "breakdown": breakdown})
    


class HotelPaxSummaryAPIView(APIView):
    """Return aggregated bookings/pax per hotel."""
    permission_classes = []

    def get(self, request):
        # base booking queryset with scope and date filters
        bs = Booking.objects.all()
        bs = apply_user_scope(bs, request.user)

        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        if date_from:
            dt = parse_date(date_from) or parse_datetime(date_from)
            if dt:
                bs = bs.filter(created_at__gte=dt)
        if date_to:
            dt = parse_date(date_to) or parse_datetime(date_to)
            if dt:
                bs = bs.filter(created_at__lte=dt)

        # aggregate over BookingHotelDetails to avoid duplicated bookings
        agg_qs = (
            BookingHotelDetails.objects.filter(booking__in=bs)
            .values("hotel__name", "hotel__city__name")
            .annotate(bookings=Count("booking", distinct=True), pax=Coalesce(Sum("booking__total_pax", output_field=FloatField()), Value(0, output_field=FloatField()), output_field=FloatField()))
            .order_by()
        )

        out = []
        for row in agg_qs:
            out.append({
                "hotel": row.get("hotel__name"),
                "city": row.get("hotel__city__name"),
                "bookings": int(row.get("bookings") or 0),
                "pax": float(row.get("pax") or 0.0),
            })

        return Response(out)


class TransportPaxSummaryAPIView(APIView):
    """Return aggregated bookings/pax per transport vehicle and route."""
    permission_classes = []

    def get(self, request):
        bs = Booking.objects.all()
        bs = apply_user_scope(bs, request.user)

        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        if date_from:
            dt = parse_date(date_from) or parse_datetime(date_from)
            if dt:
                bs = bs.filter(created_at__gte=dt)
        if date_to:
            dt = parse_date(date_to) or parse_datetime(date_to)
            if dt:
                bs = bs.filter(created_at__lte=dt)

        # group by vehicle type name and small sector (route)
        agg_qs = (
            BookingTransportDetails.objects.filter(booking__in=bs)
            .values("vehicle_type__vehicle_name", "vehicle_type__small_sector__departure_city__name", "vehicle_type__small_sector__arrival_city__name")
            .annotate(bookings=Count("booking", distinct=True), pax=Coalesce(Sum("booking__total_pax", output_field=FloatField()), Value(0, output_field=FloatField()), output_field=FloatField()))
            .order_by()
        )

        out = []
        for row in agg_qs:
            dep = row.get("vehicle_type__small_sector__departure_city__name")
            arr = row.get("vehicle_type__small_sector__arrival_city__name")
            route = None
            if dep or arr:
                route = f"{dep or '---'} → {arr or '---'}"

            out.append({
                "transport": row.get("vehicle_type__vehicle_name"),
                "route": route,
                "bookings": int(row.get("bookings") or 0),
                "pax": float(row.get("pax") or 0.0),
            })

        return Response(out)


class FlightPaxSummaryAPIView(APIView):
    """Return aggregated bookings/pax per airline and sector (departure → arrival)."""
    permission_classes = []

    def get(self, request):
        bs = Booking.objects.all()
        bs = apply_user_scope(bs, request.user)

        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        if date_from:
            dt = parse_date(date_from) or parse_datetime(date_from)
            if dt:
                bs = bs.filter(created_at__gte=dt)
        if date_to:
            dt = parse_date(date_to) or parse_datetime(date_to)
            if dt:
                bs = bs.filter(created_at__lte=dt)

        # aggregate over BookingTicketDetails
        agg_qs = (
            BookingTicketDetails.objects.filter(booking__in=bs)
            .values("ticket__airline__name", "ticket__trip_details__departure_city__name", "ticket__trip_details__arrival_city__name")
            .annotate(bookings=Count("booking", distinct=True), pax=Coalesce(Sum("booking__total_pax", output_field=FloatField()), Value(0, output_field=FloatField()), output_field=FloatField()))
            .order_by()
        )

        out = []
        for row in agg_qs:
            dep = row.get("ticket__trip_details__departure_city__name")
            arr = row.get("ticket__trip_details__arrival_city__name")
            sector = None
            if dep or arr:
                sector = f"{dep or '---'} → {arr or '---'}"

            out.append({
                "airline": row.get("ticket__airline__name"),
                "sector": sector,
                "bookings": int(row.get("bookings") or 0),
                "pax": float(row.get("pax") or 0.0),
            })

        return Response(out)
@extend_schema_view(
    list=extend_schema(
        description="Retrieve all payments filtered by organization and branch permissions",
        parameters=[
            OpenApiParameter(
                name="organization",
                type=int,
                location=OpenApiParameter.QUERY,
                description="Filter payments by organization ID (optional for superusers)",
                required=False,
            ),
            OpenApiParameter(
                name="booking",
                type=int,
                location=OpenApiParameter.QUERY,
                description="Filter payments by booking ID",
                required=False,
            ),
        ],
    ),
    create=extend_schema(
        description="Create a new payment record"
    ),
    retrieve=extend_schema(
        description="Retrieve a specific payment by ID"
    ),
    update=extend_schema(
        description="Update a payment record"
    ),
    partial_update=extend_schema(
        description="Partially update a payment record"
    ),
    destroy=extend_schema(
        description="Delete a payment record"
    ),
)
class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    queryset = Payment.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter payments by organization and branch permissions."""
        user = self.request.user
        queryset = Payment.objects.all()
        
        if user.is_superuser:
            return queryset
        
        # Filter by user's organization
        if hasattr(user, 'organization_id'):
            queryset = queryset.filter(organization_id=user.organization_id)
        
        # Filter by branch if user is branch-specific
        if hasattr(user, 'branch_id') and user.branch_id:
            queryset = queryset.filter(branch_id=user.branch_id)

        # By default, do not return the full payments history to the client
        # unless they explicitly request it (e.g., by clicking "Show all").
        # The frontend can supply ?show_all=true to request the full list.
        show_all = str(self.request.query_params.get('show_all', '')).lower()
        if show_all not in ('1', 'true', 'yes'):
            # limit to recent 7 days by default to avoid showing entire history
            cutoff = timezone.now() - timedelta(days=7)
            queryset = queryset.filter(date__gte=cutoff)

        return queryset.select_related('organization', 'branch', 'agency', 'agent', 'created_by', 'booking').order_by('-date')

    @action(detail=False, methods=["get"], url_path=r"by-agency/(?P<agency_id>[^/.]+)/payments")
    def payments_by_agency(self, request, agency_id=None):
        """Return payments that belong to the specified agency.

        This uses the viewset's permission-scoped queryset, then filters by
        agency_id so callers only see payments they are allowed to view.
        """
        qs = self.get_queryset().filter(agency_id=agency_id)
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


from rest_framework import permissions
from .serializers import HotelOutsourcingSerializer
from .models import HotelOutsourcing


@extend_schema_view(
    list=extend_schema(
        summary="List Hotel Outsourcing Records",
        description="""
        Retrieve a list of hotel outsourcing records with filtering options.
        
        **Filters:**
        - organization_id: Filter by organization
        - branch_id: Filter by branch
        - booking_id: Filter by specific booking
        - hotel_name: Search hotel name (case-insensitive)
        - status: Filter by payment status (paid/pending)
        - limit: Number of records per page (default: 25)
        - offset: Pagination offset (default: 0)
        
        **Agent Scoping:** Non-staff users only see their own bookings.
        """,
        parameters=[
            OpenApiParameter(name='organization_id', type=int, description='Filter by organization ID'),
            OpenApiParameter(name='branch_id', type=int, description='Filter by branch ID'),
            OpenApiParameter(name='booking_id', type=int, description='Filter by booking ID'),
            OpenApiParameter(name='hotel_name', type=str, description='Search hotel name'),
            OpenApiParameter(name='status', type=str, description='Payment status: paid or pending'),
            OpenApiParameter(name='limit', type=int, description='Records per page (default: 25)'),
            OpenApiParameter(name='offset', type=int, description='Pagination offset (default: 0)'),
        ],
        tags=['Hotel Outsourcing']
    ),
    create=extend_schema(
        summary="Create Hotel Outsourcing Record",
        description="""
        Create a new hotel outsourcing record for external hotel bookings.
        
        **Auto Actions:**
        - Updates booking.is_outsourced = true
        - Creates ledger entry for payable tracking
        - Updates hotel_details in booking (if booking_hotel_detail_id provided)
        - Notifies agent about outsourced hotel
        - Marks hotel as outsourced in booking records
        """,
        tags=['Hotel Outsourcing']
    ),
    retrieve=extend_schema(
        summary="Get Hotel Outsourcing Details",
        description="Retrieve details of a specific hotel outsourcing record.",
        tags=['Hotel Outsourcing']
    ),
    update=extend_schema(
        summary="Update Hotel Outsourcing Record",
        description="Update an existing hotel outsourcing record.",
        tags=['Hotel Outsourcing']
    ),
    partial_update=extend_schema(
        summary="Partially Update Hotel Outsourcing Record",
        description="Partially update an existing hotel outsourcing record.",
        tags=['Hotel Outsourcing']
    ),
    destroy=extend_schema(
        summary="Delete Hotel Outsourcing Record",
        description="Soft delete a hotel outsourcing record (sets is_deleted=true).",
        tags=['Hotel Outsourcing']
    ),
    payment_status=extend_schema(
        summary="Update Payment Status",
        description="""
        Toggle payment status for hotel outsourcing and update ledger.
        
        **When marking as paid (is_paid: true):**
        - Creates settlement ledger entry (debit payable, credit cash/bank)
        - Marks original ledger entry as settled
        - Idempotent: prevents duplicate settlements
        
        **When marking as unpaid (is_paid: false):**
        - Marks ledger entry as unsettled
        """,
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'is_paid': {'type': 'boolean', 'description': 'Payment status'}
                },
                'required': ['is_paid']
            }
        },
        tags=['Hotel Outsourcing']
    )
)
class HotelOutsourcingViewSet(viewsets.ModelViewSet):
    """API for managing external hotel outsourcing records.

    POST /api/hotel-outsourcing/
    GET  /api/hotel-outsourcing/
    PATCH /api/hotel-outsourcing/{id}/payment-status/
    """
    serializer_class = HotelOutsourcingSerializer
    queryset = HotelOutsourcing.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Check if user is superuser
        if self.request.user.is_superuser:
            # Superadmin can see all hotel outsourcing records
            qs = HotelOutsourcing.objects.filter(is_deleted=False).order_by('-created_at')
        else:
            # Get organization from query parameter or user's group
            organization_id = self.request.query_params.get("organization")
            
            if not organization_id:
                # Try to get organization from user's group
                user_group = self.request.user.groups.first()
                if user_group and hasattr(user_group, 'extended'):
                    organization_id = user_group.extended.organization_id
                else:
                    raise PermissionDenied("Missing 'organization' query parameter and user has no organization assigned.")

            # Validate user has access to this organization
            user_orgs = []
            for group in self.request.user.groups.all():
                if hasattr(group, 'extended') and group.extended.organization:
                    user_orgs.append(group.extended.organization.id)
            
            if int(organization_id) not in user_orgs and not self.request.user.is_superuser:
                raise PermissionDenied("You don't have access to this organization.")

            qs = HotelOutsourcing.objects.filter(
                booking__organization_id=organization_id,
                is_deleted=False
            ).order_by('-created_at')
        
        params = self.request.query_params
        branch = params.get('branch_id')
        booking_id = params.get('booking_id')
        hotel_name = params.get('hotel_name')
        status = params.get('status')

        if branch:
            qs = qs.filter(booking__branch_id=branch)
        if booking_id:
            qs = qs.filter(booking_id=booking_id)
        if hotel_name:
            qs = qs.filter(hotel_name__icontains=hotel_name)
        if status:
            if status.lower() == 'paid':
                qs = qs.filter(is_paid=True)
            elif status.lower() == 'pending':
                qs = qs.filter(is_paid=False)

        # Agents should see only their own bookings (best-effort: non-staff users)
        user = self.request.user
        try:
            if not user.is_staff:
                qs = qs.filter(booking__user_id=user.id)
        except Exception:
            pass

        return qs

    def list(self, request, *args, **kwargs):
        """List hotel outsourcing records with pagination and filters."""
        qs = self.get_queryset()
        # simple limit/offset pagination
        try:
            limit = int(request.query_params.get('limit', 25))
            offset = int(request.query_params.get('offset', 0))
        except Exception:
            limit = 25
            offset = 0

        total = qs.count()
        objs = qs[offset: offset + limit]
        serializer = self.get_serializer(objs, many=True)
        return Response({
            'total_records': total,
            'limit': limit,
            'offset': offset,
            'data': serializer.data,
        })

    @action(detail=True, methods=['patch'], url_path='payment-status')
    def payment_status(self, request, pk=None):
        """Toggle/Set payment status for an outsourcing record and update ledger metadata.

        Idempotency: if the linked ledger entry is already marked settled, do not create a
        duplicate settlement entry when marking as paid.
        """
        obj = self.get_object()
        is_paid = request.data.get('is_paid')
        if is_paid is None:
            return Response({'detail': 'is_paid is required'}, status=400)

        from django.db import transaction
        from decimal import Decimal

        with transaction.atomic():
            obj.is_paid = bool(is_paid)
            obj.save()

            # If marking paid, create settlement ledger entry (debit payable, credit cash/bank)
            try:
                from organization.ledger_utils import create_settlement_entry, mark_entry_settled

                if obj.is_paid and obj.ledger_entry_id:
                    amount = Decimal(str(obj.outsource_cost or 0))
                    # Idempotency guard: if the source ledger entry is already marked settled,
                    # skip creating a new settlement entry.
                    try:
                        from ledger.models import LedgerEntry as _LedgerEntry
                        src = _LedgerEntry.objects.filter(pk=obj.ledger_entry_id).first()
                    except Exception:
                        src = None

                    already_settled = False
                    if src:
                        meta = src.metadata or {}
                        already_settled = bool(meta.get('settled'))

                    if not already_settled:
                        # create settlement entry and mark original settled
                        sat = create_settlement_entry(obj.ledger_entry_id, amount, booking=obj.booking, org=obj.booking.organization_id, branch=obj.booking.branch_id, created_by=getattr(request, 'user', None))
                        mark_entry_settled(obj.ledger_entry_id, by_user=getattr(request, 'user', None), settled=True)
                    else:
                        # nothing to do; idempotent
                        sat = None
                    # link settlement entry id if needed
                    if sat:
                        meta = obj.__dict__.get('ledger_entry_id')
                else:
                    # mark original ledger entry as unsettled
                    if obj.ledger_entry_id:
                        mark_entry_settled(obj.ledger_entry_id, by_user=getattr(request, 'user', None), settled=False)
            except Exception:
                # don't fail the endpoint if ledger ops fail; surface minimal response instead
                pass

        serializer = self.get_serializer(obj)
        return Response(serializer.data)

    # PaymentViewSet methods intentionally implemented in PaymentViewSet class above.
class SectorViewSet(viewsets.ModelViewSet):
    queryset = Sector.objects.all()
    serializer_class = SectorSerializer

    def create(self, request, *args, **kwargs):
        # Perform explicit validation so we can log incoming data and validated output
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=False)
        except Exception:
            pass
        # Debug logging for troubleshooting why departure/arrival may be null
        try:
            import logging
            logger = logging.getLogger(_name_)
            logger.debug("Sector.create - request.data: %s", request.data)
            logger.debug("Sector.create - initial_data: %s", getattr(serializer, 'initial_data', None))
            logger.debug("Sector.create - is_valid: %s", serializer.is_valid())
            logger.debug("Sector.create - validated_data: %s", getattr(serializer, 'validated_data', None))
            logger.debug("Sector.create - errors: %s", getattr(serializer, 'errors', None))
        except Exception:
            pass

        if not serializer.is_valid():
            return Response({"message": "Validation failed", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        self.perform_create(serializer)
        instance = serializer.instance
        out_serializer = self.get_serializer(instance)
        return Response({"message": "Sector created successfully!", "data": out_serializer.data}, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(instance=self.get_object(), data=request.data)
        try:
            serializer.is_valid(raise_exception=False)
        except Exception:
            pass
        try:
            import logging
            logger = logging.getLogger(_name_)
            logger.debug("Sector.update - request.data: %s", request.data)
            logger.debug("Sector.update - initial_data: %s", getattr(serializer, 'initial_data', None))
            logger.debug("Sector.update - is_valid: %s", serializer.is_valid())
            logger.debug("Sector.update - validated_data: %s", getattr(serializer, 'validated_data', None))
            logger.debug("Sector.update - errors: %s", getattr(serializer, 'errors', None))
        except Exception:
            pass

        if not serializer.is_valid():
            return Response({"message": "Validation failed", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        self.perform_update(serializer)
        instance = serializer.instance
        out_serializer = self.get_serializer(instance)
        return Response({"message": "Sector updated successfully!", "data": out_serializer.data}, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        super().destroy(request, *args, **kwargs)
        return Response(
            {"message": "Sector deleted successfully!"},
            status=status.HTTP_204_NO_CONTENT
        )
class BigSectorViewSet(viewsets.ModelViewSet):
    queryset = BigSector.objects.all()
    serializer_class = BigSectorSerializer

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        return Response(
            {"message": "Sector created successfully!", "data": response.data},
            status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        return Response(
            {"message": "Sector updated successfully!", "data": response.data},
            status=status.HTTP_200_OK
        )

    def destroy(self, request, *args, **kwargs):
        super().destroy(request, *args, **kwargs)
        return Response(
            {"message": "Sector deleted successfully!"},
            status=status.HTTP_204_NO_CONTENT
        )
class VehicleTypeViewSet(viewsets.ModelViewSet):
    queryset = VehicleType.objects.all()
    serializer_class = VehicleTypeSerializer

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        return Response(
            {"message": "Vehicle Type created successfully!", "data": response.data},
            status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        return Response(
            {"message": "Vehicle Type updated successfully!", "data": response.data},
            status=status.HTTP_200_OK
        )

    def destroy(self, request, *args, **kwargs):
        super().destroy(request, *args, **kwargs)
        return Response(
            {"message": "Vehicle Type deleted successfully!"},
            status=status.HTTP_204_NO_CONTENT
        )
class InternalNoteViewSet(viewsets.ModelViewSet):
    queryset = InternalNote.objects.all().order_by("-date_time")
    serializer_class = InternalNoteSerializer
class BankAccountViewSet(viewsets.ModelViewSet):
    queryset = BankAccount.objects.all().order_by("-id")
    serializer_class = BankAccountSerializer

    def get_queryset(self):
        # Default qs
        user = getattr(self.request, 'user', None)
        qs = BankAccount.objects.all().order_by("-id")

        # Read params early so a provided organization filter always applies
        params = self.request.query_params
        organization_id = params.get('organization') or params.get('organization_id')

        # If org not provided, try to infer from user's first group extended attribute
        if not organization_id:
            try:
                user_group = user.groups.first()
                if user_group and hasattr(user_group, 'extended'):
                    organization_id = user_group.extended.organization_id
            except Exception:
                organization_id = None

        # If user is superuser and no organization param provided, return all
        try:
            if user and user.is_superuser and not organization_id:
                return qs
        except Exception:
            pass

        if not organization_id:
            raise PermissionDenied("Missing 'organization' query parameter and user has no organization assigned.")

        # Validate user has access to this organization (skip for superuser)
        if not (user and getattr(user, 'is_superuser', False)):
            user_orgs = set()
            try:
                # organizations attached via group extensions
                for group in user.groups.all():
                    if hasattr(group, 'extended') and group.extended.organization:
                        user_orgs.add(group.extended.organization.id)
            except Exception:
                pass

            try:
                # organizations attached directly to the user (M2M)
                for o in user.organizations.all():
                    user_orgs.add(o.id)
            except Exception:
                pass

            if int(organization_id) not in user_orgs:
                raise PermissionDenied("You don't have access to this organization.")

        qs = qs.filter(organization_id=organization_id)

        # Optional branch filter
        branch_id = params.get('branch_id')
        if branch_id is not None:
            # Frontend sometimes sends branch_id=0 to indicate 'organization-level' accounts
            if str(branch_id).lower() in ['', 'none', 'null']:
                # no branch filter
                pass
            elif str(branch_id) == '0':
                # treat 0 as 'no branch' (branch is NULL)
                qs = qs.filter(branch__isnull=True)
            else:
                try:
                    qs = qs.filter(branch_id=int(branch_id))
                except Exception:
                    qs = qs.filter(branch_id=branch_id)

        return qs
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Debug logging to inspect incoming payload and validated data
        try:
            import logging
            logger = logging.getLogger(__name__)
            logger.debug("BankAccount.create - request.data: %s", request.data)
            logger.debug("BankAccount.create - validated_data (pre-save): %s", serializer.validated_data)
        except Exception:
            pass
        serializer.save()  # save the BankAccount
        try:
            import logging
            logger = logging.getLogger(__name__)
            logger.debug("BankAccount.create - response data: %s", serializer.data)
        except Exception:
            pass
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=["get"], url_path=r"by-agency/(?P<agency_id>[^/.]+)")
    def by_agency(self, request, agency_id=None):
        """List bank accounts that belong to a specific agency (agency_id)."""
        qs = self.get_queryset().filter(agency_id=agency_id)
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path=r"by-organization/(?P<organization_id>[^/.]+)/agency-accounts")
    def agency_accounts_by_org(self, request, organization_id=None):
        """Return agencies under the organization that have at least one bank account.

        Previously this endpoint returned bank account records. The updated behavior
        returns the agency objects (serialized with `AgencySerializer`) where the
        agency has one or more `BankAccount` records belonging to the specified
        organization (i.e. bank_accounts.organization_id == organization_id).
        """
        # select agencies that have bank accounts for this organization
        agencies = Agency.objects.filter(bank_accounts__organization_id=organization_id).distinct()

        page = self.paginate_queryset(agencies)
        if page is not None:
            serializer = AgencySerializer(page, many=True, context={"request": request})
            return self.get_paginated_response(serializer.data)

        serializer = AgencySerializer(agencies, many=True, context={"request": request})
        return Response(serializer.data)
class OrganizationLinkViewSet(viewsets.ModelViewSet):
    queryset = OrganizationLink.objects.all()
    serializer_class = OrganizationLinkSerializer

    def create(self, request, *args, **kwargs):
        # agar array aya hai
        many = isinstance(request.data, list)
        serializer = self.get_serializer(data=request.data, many=many)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        headers = self.get_success_headers(serializer.data)
class AllowedResellerViewSet(viewsets.ModelViewSet):
    queryset = AllowedReseller.objects.all()
    serializer_class = AllowedResellerSerializer
    permission_classes = [IsAdminUser]

@extend_schema_view(
    create=extend_schema(
        request=OpenApiTypes.OBJECT,
        responses={201: OpenApiTypes.OBJECT},
        examples=[
            OpenApiExample(
                'DiscountGroupCreateExample',
                value={
                    "name": "Summer Promo",
                    "group_type": "seasonal",
                    "organization": 11,
                    "is_active": True,
                    "discounts": {
                        "group_ticket_discount_amount": "10.5",
                        "umrah_package_discount_amount": "25"
                    },
                    "hotel_night_discounts": [
                        {
                            "quint_per_night_discount": "150",
                            "double_per_night_discount": "75.5",
                            "discounted_hotels": [12, 34, 56]
                        },
                        {
                            "other_per_night_discount": "20",
                            "discounted_hotels": [78]
                        }
                    ]
                },
                request_only=True,
                response_only=False,
            ),
            OpenApiExample(
                'DiscountGroupResponseExample',
                value={
                    "id": 7,
                    "name": "Summer Promo",
                    "group_type": "seasonal",
                    "organization": 11,
                    "is_active": True,
                    "discounts": {
                        "group_ticket_discount_amount": "10.5",
                        "umrah_package_discount_amount": "25"
                    },
                    "hotel_night_discounts": [
                        {
                            "quint_per_night_discount": "150",
                            "quad_per_night_discount": "",
                            "triple_per_night_discount": "",
                            "double_per_night_discount": "75.5",
                            "sharing_per_night_discount": "",
                            "other_per_night_discount": "",
                            "discounted_hotels": [12, 34, 56]
                        },
                        {
                            "quint_per_night_discount": "",
                            "quad_per_night_discount": "",
                            "triple_per_night_discount": "",
                            "double_per_night_discount": "",
                            "sharing_per_night_discount": "",
                            "other_per_night_discount": "20",
                            "discounted_hotels": [78]
                        }
                    ]
                },
                request_only=False,
                response_only=True,
            ),
        ],
    ),
    retrieve=extend_schema(
        responses={200: OpenApiTypes.OBJECT},
    ),
    list=extend_schema(
        responses={200: OpenApiTypes.OBJECT},
    )
)
class DiscountGroupViewSet(viewsets.ModelViewSet):
    queryset = DiscountGroup.objects.all().prefetch_related("discounts")
    serializer_class = DiscountGroupSerializer
class MarkupViewSet(viewsets.ModelViewSet):
    queryset = Markup.objects.all().order_by("-created_at")
    serializer_class = MarkupSerializer


# Admin AJAX endpoint to get ticket price based on ticket and age group
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.contrib.admin.views.decorators import staff_member_required
from tickets.models import Ticket

@staff_member_required
@require_GET
def get_ticket_price(request):
    """
    AJAX endpoint to get ticket price based on ticket ID and age group
    Used for dynamically updating passenger ticket prices in booking admin
    """
    ticket_id = request.GET.get('ticket_id')
    age_group = request.GET.get('age_group')
    
    if not ticket_id or not age_group:
        return JsonResponse({'error': 'Missing ticket_id or age_group'}, status=400)
    
    try:
        ticket = Ticket.objects.get(id=ticket_id)
        
        # Get price based on age group
        if age_group == 'Adult':
            price = ticket.adult_fare
        elif age_group == 'Child':
            price = ticket.child_fare
        elif age_group == 'Infant':
            price = ticket.infant_fare
        else:
            price = ticket.adult_fare  # Default to adult fare
        
        return JsonResponse({
            'price': float(price),
            'ticket_id': ticket_id,
            'age_group': age_group,
            'flight_number': ticket.flight_number or 'N/A',
            'airline': ticket.airline.name if ticket.airline else 'N/A'
        })
        
    except Ticket.DoesNotExist:
        return JsonResponse({'error': 'Ticket not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["GET"])
def get_inventory_price(request):
    """
    AJAX endpoint to get price for selected inventory item.
    Supports: hotel, transport, visa, package, ticket
    """
    inventory_type = request.GET.get('type')
    inventory_id = request.GET.get('id')
    
    if not inventory_type or not inventory_id:
        return JsonResponse({'error': 'Missing type or id parameter'}, status=400)
    
    try:
        price = 0
        details = {}
        
        if inventory_type == 'hotel':
            from tickets.models import Hotels
            hotel = Hotels.objects.prefetch_related('prices').get(id=inventory_id)
            # Get first available price (you can customize this logic)
            hotel_price = hotel.prices.first()
            if hotel_price:
                price = float(hotel_price.price)
                details = {
                    'room_type': hotel_price.room_type,
                    'hotel_name': hotel.name
                }
        
        elif inventory_type == 'transport':
            from packages.models import TransportSectorPrice
            transport = TransportSectorPrice.objects.get(id=inventory_id)
            price = float(transport.adault_price or 0)  # Default to adult price
            details = {
                'name': transport.name,
                'adult_price': float(transport.adault_price or 0),
                'child_price': float(transport.child_price or 0),
                'infant_price': float(transport.infant_price or 0)
            }
        
        elif inventory_type == 'visa':
            from packages.models import Visa
            visa = Visa.objects.get(id=inventory_id)
            price = float(visa.adult_price or visa.price or 0)
            details = {
                'visa_type': visa.get_visa_type_display(),
                'country': visa.get_country_display(),
                'adult_price': float(visa.adult_price or 0),
                'child_price': float(visa.child_price or 0),
                'infant_price': float(visa.infant_price or 0)
            }
        
        elif inventory_type == 'package':
            from packages.models import UmrahPackage
            package = UmrahPackage.objects.get(id=inventory_id)
            price = float(package.price_per_person or 0)
            details = {
                'title': package.title,
                'package_code': package.package_code,
                'price_per_person': float(package.price_per_person or 0)
            }
        
        elif inventory_type == 'ticket':
            from tickets.models import Ticket
            ticket = Ticket.objects.select_related('airline').get(id=inventory_id)
            price = float(ticket.adult_fare or 0)
            details = {
                'airline': ticket.airline.name if ticket.airline else 'N/A',
                'flight_number': ticket.flight_number or 'N/A',
                'adult_fare': float(ticket.adult_fare or 0),
                'child_fare': float(ticket.child_fare or 0),
                'infant_fare': float(ticket.infant_fare or 0)
            }
        
        return JsonResponse({
            'success': True,
            'price': price,
            'details': details
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)