from rest_framework import serializers
from django.contrib.auth.models import User
import uuid
from django.utils.timezone import now
from organization.serializers import OrganizationSerializer, AgencySerializer, BranchSerializer
from packages.serializers import RiyalRateSerializer, UmrahPackageSerializer
from tickets.serializers import HotelsSerializer
from users.serializers import UserSerializer
from organization.models import Organization, Agency, Branch
from users.models import UserProfile
from tickets.models import Hotels
from datetime import datetime
from decimal import Decimal
from .models import (
    Booking,
    BookingHotelDetails,
    BookingTransportDetails,
    BookingTicketDetails,
    BookingTicketTicketTripDetails,
    BookingTicketStopoverDetails,
    BookingPersonZiyaratDetails,
    BookingPersonFoodDetails,
    BookingPersonDetail,
    BookingPersonContactDetails,
    Payment,
    Sector,
    BigSector,
    VehicleType,
    InternalNote,
    BookingTransportSector,
    BankAccount,
    OrganizationLink,
    AllowedReseller,
    DiscountGroup,
    Discount,
    Markup,
    BookingCallRemark,
    BookingItem,
    BookingPax,
    BookingStatusTimeline,
    BookingPromotion,
    BookingPayment,
)
from .models import Bank
from django.db import transaction

# Small helper field: accept '0', 0, '' as null to be more tolerant of frontend payloads
class NullablePKRelatedField(serializers.PrimaryKeyRelatedField):
    def to_internal_value(self, data):
        try:
            if data is None:
                return None
            if isinstance(data, str) and data.strip() == "":
                return None
            if str(data) == '0':
                return None
        except Exception:
            pass
        return super().to_internal_value(data)

# --- Public (read-only) serializers for the public booking status API ---
class PublicPersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingPersonDetail
        fields = (
            "person_title",
            "first_name",
            "last_name",
            "age_group",
            "passport_number",
            "date_of_birth",
        )


class PublicHotelDetailsSerializer(serializers.ModelSerializer):
    # show related hotel basic info if available
    hotel = HotelsSerializer(read_only=True)

    class Meta:
        model = BookingHotelDetails
        fields = (
            "hotel",
            "self_hotel_name",
            "check_in_date",
            "check_out_date",
            "number_of_nights",
            "room_type",
            "sharing_type",
        )


class PublicTransportSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingTransportDetails
        fields = (
            "shirka",
            "vehicle_type",
            "voucher_no",
            "brn_no",
        )


class PublicTicketSerializer(serializers.ModelSerializer):
    trip_details = serializers.SerializerMethodField()

    class Meta:
        model = BookingTicketDetails
        fields = (
            "pnr",
            "trip_details",
            "seats",
            "status",
        )

    def get_trip_details(self, obj):
        out = []
        try:
            for t in getattr(obj, 'trip_details').all():
                out.append({
                    'departure_date_time': t.departure_date_time,
                    'arrival_date_time': t.arrival_date_time,
                    'departure_city': getattr(t.departure_city, 'name', None) if getattr(t, 'departure_city', None) else None,
                    'arrival_city': getattr(t.arrival_city, 'name', None) if getattr(t, 'arrival_city', None) else None,
                    'trip_type': t.trip_type,
                })
        except Exception:
            pass
        return out


class PublicBookingSerializer(serializers.ModelSerializer):
    person_details = PublicPersonSerializer(many=True, read_only=True)
    hotel_details = PublicHotelDetailsSerializer(many=True, read_only=True)
    transport_details = PublicTransportSerializer(many=True, read_only=True)
    ticket_details = PublicTicketSerializer(many=True, read_only=True)
    public_ref = serializers.CharField(read_only=True)
    booking_number = serializers.CharField(read_only=True)
    creation_date = serializers.DateTimeField(source="date", read_only=True)
    service_summary = serializers.SerializerMethodField()
    total_paid = serializers.SerializerMethodField()
    remaining_balance = serializers.SerializerMethodField()
    uploaded_documents = serializers.SerializerMethodField()
    status_timeline = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = (
            "booking_number",
            "public_ref",
            "creation_date",
            "person_details",
            "service_summary",
            "booking_type",
            "hotel_details",
            "transport_details",
            "ticket_details",
            "payment_status",
            "status",
            "total_paid",
            "remaining_balance",
            "uploaded_documents",
            "status_timeline",
        )

    def get_service_summary(self, obj):
        # Minimal public-facing summary
        out = {
            "booking_type": obj.booking_type,
            "category": obj.category,
            "is_full_package": obj.is_full_package,
        }
        # package name/duration
        try:
            if getattr(obj, 'umrah_package', None):
                out['package_name'] = getattr(obj.umrah_package, 'title', None) or getattr(obj.umrah_package, 'name', None)
                # approximate duration from hotel nights
                nights = 0
                for h in getattr(obj, 'hotel_details').all():
                    nights += int(getattr(h, 'number_of_nights', 0) or 0)
                out['duration_nights'] = nights
        except Exception:
            pass

        # hotel names and transport summary
        try:
            hotels = []
            for h in getattr(obj, 'hotel_details').all():
                hotels.append(h.self_hotel_name or (getattr(h.hotel, 'name', None) if getattr(h, 'hotel', None) else None))
            out['hotel_names'] = [x for x in hotels if x]
        except Exception:
            out['hotel_names'] = []

        try:
            transports = []
            for t in getattr(obj, 'transport_details').all():
                transports.append({
                    'vehicle_type': getattr(t, 'vehicle_type', None),
                    'voucher_no': getattr(t, 'voucher_no', None),
                })
            out['transport_summary'] = transports
        except Exception:
            out['transport_summary'] = []

        # visa status (public-facing)
        try:
            out['visa_status'] = getattr(obj, 'visa_status', None)
        except Exception:
            out['visa_status'] = None

        return out

    def get_status_timeline(self, obj):
        timeline = []
        try:
            # Booked
            timeline.append({'status': 'booked', 'at': getattr(obj, 'date', None)})
            # Payments (completed)
            if hasattr(obj, 'payment_details'):
                for p in obj.payment_details.filter(status__in=['Completed', 'completed']):
                    timeline.append({'status': 'paid', 'at': getattr(p, 'date', None), 'amount': float(getattr(p, 'amount', 0) or 0)})
            # Confirmed
            if getattr(obj, 'status', None) and str(getattr(obj, 'status')).lower() == 'confirmed':
                # use last payment date or booking date as proxy
                last_paid = None
                try:
                    last_paid = obj.payment_details.filter(status__in=['Completed', 'completed']).order_by('-date').first()
                except Exception:
                    last_paid = None
                timeline.append({'status': 'confirmed', 'at': getattr(last_paid, 'date', None) or getattr(obj, 'date', None)})
        except Exception:
            pass
        return timeline

    def get_total_paid(self, obj):
        # try fields on model first, fall back to summing payments
        try:
            if getattr(obj, "paid_payment", None) not in (None, ""):
                return float(obj.paid_payment or 0)
            # try JSON payments
            if isinstance(obj.payments, (list, tuple)) and obj.payments:
                return sum([float(p.get("amount", 0) or 0) for p in obj.payments])
            # try related payment_details
            if hasattr(obj, "payment_details"):
                return sum([float(p.amount or 0) for p in obj.payment_details.all()])
        except Exception:
            return 0.0
        return 0.0

    def get_remaining_balance(self, obj):
        try:
            if getattr(obj, "pending_payment", None) not in (None, ""):
                return float(obj.pending_payment or 0)
            total = float(obj.total_amount or 0)
            paid = float(self.get_total_paid(obj) or 0)
            return max(0.0, total - paid)
        except Exception:
            return None

    def get_uploaded_documents(self, obj):
        # Return a minimal list of uploaded document info if available. Defensive — do not expose internal paths.
        docs = []
        try:
            # example: look for voucher / passport fields on booking or persons
            # Booking may store attachments in JSON fields; fall back to person passport_picture
            if hasattr(obj, "person_details"):
                for p in obj.person_details.all():
                    if getattr(p, "passport_picture", None):
                        docs.append({"type": "passport_picture", "filename": getattr(p.passport_picture, "name", None), "url": getattr(p.passport_picture, "url", None)})
            # Booking-level attachments could exist in journal_items/payments — skip those for privacy
        except Exception:
            pass
        return docs


# --- Public (write) serializers for creating bookings/payments ---
class PublicBookingCreateSerializer(serializers.Serializer):
    umrah_package_id = serializers.IntegerField()
    total_pax = serializers.IntegerField()
    total_adult = serializers.IntegerField(required=False, default=0)
    total_child = serializers.IntegerField(required=False, default=0)
    total_infant = serializers.IntegerField(required=False, default=0)
    contact_name = serializers.CharField(max_length=255)
    contact_phone = serializers.CharField(max_length=50)
    contact_email = serializers.EmailField(required=False, allow_null=True, allow_blank=True)
    pay_now = serializers.BooleanField(required=False, default=False)
    pay_amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)

    def validate(self, data):
        from packages.models import UmrahPackage

        try:
            pkg = UmrahPackage.objects.get(pk=data['umrah_package_id'])
        except UmrahPackage.DoesNotExist:
            raise serializers.ValidationError({"umrah_package_id": "Invalid package id"})

        if not pkg.is_public:
            raise serializers.ValidationError({"umrah_package_id": "Package is not available for public booking"})

        total = int(data.get('total_pax') or 0)
        left = int(pkg.left_seats or 0)
        if total <= 0:
            raise serializers.ValidationError({"total_pax": "Must be greater than zero"})
        if left < total:
            raise serializers.ValidationError({"total_pax": f"Only {left} seats left"})

        return data

    class Meta:
        fields = '__all__'


class PublicPaymentCreateSerializer(serializers.Serializer):
    booking_number = serializers.CharField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    method = serializers.CharField(max_length=50, default="online")
    transaction_number = serializers.CharField(max_length=128, required=False, allow_blank=True, allow_null=True)
    kuickpay_trn = serializers.CharField(max_length=128, required=False, allow_blank=True, allow_null=True)
    # accept bank account references in public flow
    agent_bank_account = serializers.PrimaryKeyRelatedField(queryset=BankAccount.objects.all(), required=False, allow_null=True)
    organization_bank_account = serializers.PrimaryKeyRelatedField(queryset=BankAccount.objects.all(), required=False, allow_null=True)

    def validate(self, data):
        from .models import Booking

        try:
            Booking.objects.get(booking_number=data['booking_number'])
        except Booking.DoesNotExist:
            raise serializers.ValidationError({"booking_number": "Invalid booking_number"})
        # validate bank account types if provided
        oba = data.get('organization_bank_account')
        aba = data.get('agent_bank_account')
        if oba:
            if not getattr(oba, 'is_company_account', False):
                raise serializers.ValidationError({'organization_bank_account': 'Must be a company account'})
            if not getattr(oba, 'created_by', None):
                raise serializers.ValidationError({'organization_bank_account': 'Company account must have a created_by'})
        if aba:
            if getattr(aba, 'is_company_account', False):
                raise serializers.ValidationError({'agent_bank_account': 'Must be an agent (non-company) account'})
        return data

    class Meta:
        fields = '__all__'

# --- Child serializers ---


class BookingTicketTripDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingTicketTicketTripDetails
        fields = "__all__"
        extra_kwargs = {"ticket": {"read_only": True}}


class BookingTicketStopoverDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingTicketStopoverDetails
        fields = "__all__"
        extra_kwargs = {"ticket": {"read_only": True}}


class BookingTicketDetailsSerializer(serializers.ModelSerializer):
    trip_details = BookingTicketTripDetailsSerializer(many=True, required=False)
    stopover_details = BookingTicketStopoverDetailsSerializer(many=True, required=False)

    class Meta:
        model = BookingTicketDetails
        fields = "__all__"
        extra_kwargs = {"booking": {"read_only": True}}

    def create(self, validated_data):
        trip_data = validated_data.pop("trip_details", [])
        stopover_data = validated_data.pop("stopover_details", [])
        ticket = BookingTicketDetails.objects.create(**validated_data)

        if trip_data:
                BookingTicketTicketTripDetails.objects.bulk_create(
                    [
                        BookingTicketTicketTripDetails(
                            ticket=ticket,
                            departure_city=td["departure_city"],
                            arrival_city=td["arrival_city"],
                            departure_date_time=td["departure_date_time"],
                            arrival_date_time=td["arrival_date_time"],
                            trip_type=td["trip_type"],
                        )
                        for td in trip_data
                    ]
                )
      # Stopover Details
        if stopover_data:
            BookingTicketStopoverDetails.objects.bulk_create(
                [
                    BookingTicketStopoverDetails(
                        ticket=ticket,
                        stopover_city=sd["stopover_city"],
                        stopover_duration=sd["stopover_duration"],
                        trip_type=sd["trip_type"],
                    )
                    for sd in stopover_data
                ]
            )

        return ticket

    def update(self, instance, validated_data):
        trip_data = validated_data.pop("trip_details", [])
        stopover_data = validated_data.pop("stopover_details", [])

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()


        if trip_data is not None:
            instance.trip_details.all().delete()
            BookingTicketTicketTripDetails.objects.bulk_create(
                [
                    BookingTicketTicketTripDetails(
                        ticket=instance,
                        departure_city=td["departure_city"],
                        arrival_city=td["arrival_city"],
                        departure_date_time=td["departure_date_time"],
                        arrival_date_time=td["arrival_date_time"],
                        trip_type=td["trip_type"],
                    )
                    for td in trip_data
                ]
            )
        if stopover_data is not None:
            instance.stopover_details.all().delete()
            BookingTicketStopoverDetails.objects.bulk_create(
                [
                    BookingTicketStopoverDetails(
                        ticket=instance,
                        stopover_city=sd["stopover_city"],
                        stopover_duration=sd["stopover_duration"],
                        trip_type=sd["trip_type"],
                    )
                    for sd in stopover_data
                ]
            )
        return instance


class BookingHotelDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingHotelDetails
        fields = "__all__"
        extra_kwargs = {"booking": {"read_only": True}}

class BookingTransportSectorSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingTransportSector
        fields = "__all__"
        extra_kwargs = {
            "transport_detail": {"read_only": True}
        }

# class BookingTransportDetailsSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = BookingTransportDetails
#         fields = "__all__"
#         extra_kwargs = {"booking": {"read_only": True}}
class BookingTransportDetailsSerializer(serializers.ModelSerializer):
    sector_details = BookingTransportSectorSerializer(many=True, required=False)

    class Meta:
        model = BookingTransportDetails
        fields = "__all__"
        extra_kwargs = {"booking": {"read_only": True}}

    def create(self, validated_data):
        # pop nested data
        sector_data = validated_data.pop("sector_details", [])
        transport_detail = BookingTransportDetails.objects.create(**validated_data)

        # create nested sector records
        for sector in sector_data:
            BookingTransportSector.objects.create(
                transport_detail=transport_detail, **sector
            )

        return transport_detail

    def update(self, instance, validated_data):
        # update main fields
        sector_data = validated_data.pop("sector_details", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # handle nested update
        if sector_data is not None:
            instance.sector_details.all().delete()
            for sector in sector_data:
                BookingTransportSector.objects.create(
                    transport_detail=instance, **sector
                )
        return instance


class BookingPersonZiyaratDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingPersonZiyaratDetails
        fields = "__all__"
        extra_kwargs = {"person": {"read_only": True}}
class BookingPersonFoodDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingPersonFoodDetails
        fields = "__all__"
        extra_kwargs = {"person": {"read_only": True}}
class BookingPersonContactDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingPersonContactDetails
        fields = "__all__"
        extra_kwargs = {"person": {"read_only": True}}

class BookingPersonDetailSerializer(serializers.ModelSerializer):
    # contact_details = BookingPersonContactDetailsSerializer(many=True, required=False)
    class Meta:
        model = BookingPersonDetail
        fields = "__all__"
        extra_kwargs = {"booking": {"read_only": True}}
    
    def create(self, validated_data):
        # nested lists
        ziyarat_data = validated_data.pop("ziyarat_details", [])
        food_data = validated_data.pop("food_details", [])
        contact_data = validated_data.pop("contact_details", [])
        person = BookingPersonDetail.objects.create(**validated_data)

        if ziyarat_data:
            BookingPersonZiyaratDetails.objects.bulk_create(
                [BookingPersonZiyaratDetails(person=person, **zd) for zd in ziyarat_data]
            )
        if food_data:
            BookingPersonFoodDetails.objects.bulk_create(
                [BookingPersonFoodDetails(person=person, **fd) for fd in food_data]
            )
        if contact_data:
            BookingPersonContactDetails.objects.bulk_create(
                [BookingPersonContactDetails(person=person, **cd) for cd in contact_data]
            )
        return person
    
    def update(self, instance, validated_data):
        # nested lists (None if not provided on PATCH)
        ziyarat_data = validated_data.pop("ziyarat_details", None)
        food_data = validated_data.pop("food_details", None)
        contact_data = validated_data.pop("contact_details", [])

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if ziyarat_data is not None:
            # instance.ziyarat_details.all().delete()
            BookingPersonZiyaratDetails.objects.bulk_create(
                [BookingPersonZiyaratDetails(person=instance, **zd) for zd in ziyarat_data]
            )
        if food_data is not None:
            instance.food_details.all().delete()
            BookingPersonFoodDetails.objects.bulk_create(
                [BookingPersonFoodDetails(person=instance, **fd) for fd in food_data]
            )
        if contact_data is not None:
            instance.contact_details.all().delete()
            BookingPersonContactDetails.objects.bulk_create(
                [BookingPersonContactDetails(person=instance, **cd) for cd in contact_data]
            )
        return instance
    


class PaymentSerializer(serializers.ModelSerializer):
    # expose the bank account titles for display in tables
    agent_bank_account_title = serializers.CharField(source='agent_bank_account.account_title', read_only=True)
    organization_bank_account_title = serializers.CharField(source='organization_bank_account.account_title', read_only=True)
    class Meta:
        model = Payment
        # Expose only the fields requested for the Payment API
        fields = [
            'id',
            'method',
            'amount',
            'remarks',
            'status',
            'image',
            'transaction_number',
            'organization',
            'branch',
            'agency',
            'agent',
            'created_by',
            # legacy Bank fields removed from API (use *_bank_account fields)
            'agent_bank_account',
            'organization_bank_account',
            'agent_bank_account_title',
            'organization_bank_account_title',
            'bank',
            # when method == 'cash' capture depositor details
            'cash_depositor_name',
            'cash_depositor_cnic',
            'kuickpay_trn',
            'date',
        ]
        extra_kwargs = {
            'date': {'read_only': True},
        }

    def validate(self, data):
        """Validate bank account types and ownership where possible.

        Rules enforced:
        - organization_bank_account must have is_company_account=True and must have created_by set.
        - agent_bank_account must have is_company_account=False.
        - If organization field is provided, bank accounts must belong to that organization.
        - Validation is best-effort when request/context is missing.
        """
        request = self.context.get('request') if hasattr(self, 'context') else None
        user = getattr(request, 'user', None) if request else None

        oba = data.get('organization_bank_account')
        aba = data.get('agent_bank_account')
        org = data.get('organization')

        errors = {}

        if oba:
            if not getattr(oba, 'is_company_account', False):
                errors['organization_bank_account'] = 'Must be a company account'
            if not getattr(oba, 'created_by', None):
                errors['organization_bank_account'] = 'Company account must have a created_by'
            if org and getattr(oba, 'organization', None) and oba.organization_id != getattr(org, 'id', org):
                errors['organization_bank_account'] = 'Organization bank account does not belong to the given organization'

        if aba:
            if getattr(aba, 'is_company_account', False):
                errors['agent_bank_account'] = 'Must be an agent (non-company) account'
            if org and getattr(aba, 'organization', None) and aba.organization_id != getattr(org, 'id', org):
                errors['agent_bank_account'] = 'Agent bank account does not belong to the given organization'

        # stricter ownership checks for non-superusers
        if request and user and not getattr(user, 'is_superuser', False):
            try:
                user_org_id = getattr(user, 'organization_id', None)
                user_branch_id = getattr(user, 'branch_id', None)
                user_agency_ids = set(user.agencies.values_list('id', flat=True)) if getattr(user, 'agencies', None) is not None else set()

                if aba:
                    ok = False
                    if aba.agency_id and aba.agency_id in user_agency_ids:
                        ok = True
                    if aba.branch_id and user_branch_id and aba.branch_id == user_branch_id:
                        ok = True
                    if aba.organization_id and user_org_id and aba.organization_id == user_org_id:
                        ok = True
                    if not ok:
                        errors['agent_bank_account'] = 'Agent bank account not accessible by current user'

                if oba:
                    # organization account must belong to user's organization (or user is staff)
                    if user_org_id and oba.organization_id != user_org_id:
                        errors['organization_bank_account'] = 'Organization bank account does not belong to your organization'
            except Exception:
                # be defensive: if lookup fails, do not block (we've already done basic checks above)
                pass

        if errors:
            raise serializers.ValidationError(errors)

        # Additional rules when payment method is cash
        # Accept 'cash' case-insensitively; when cash, require bank FK, depositor name and CNIC
        try:
            method_val = (data.get('method') or '').strip().lower()
        except Exception:
            method_val = ''

        if method_val == 'cash':
            bank_val = data.get('bank') or (getattr(self.instance, 'bank_id', None) if getattr(self, 'instance', None) else None)
            depositor = data.get('cash_depositor_name') or (getattr(self.instance, 'cash_depositor_name', None) if getattr(self, 'instance', None) else None)
            cnic = data.get('cash_depositor_cnic') or (getattr(self.instance, 'cash_depositor_cnic', None) if getattr(self, 'instance', None) else None)

            if not bank_val:
                errors['bank'] = 'Bank (FK) is required for cash payments'
            if not depositor:
                errors['cash_depositor_name'] = 'Depositor name is required for cash payments'
            if not cnic:
                errors['cash_depositor_cnic'] = 'Depositor CNIC is required for cash payments'

        if errors:
            raise serializers.ValidationError(errors)

        return data

    def create(self, validated_data):
        # Generate transaction_number if not provided
        if not validated_data.get('transaction_number'):
            import uuid
            validated_data['transaction_number'] = f"TXN-{uuid.uuid4().hex[:8].upper()}"
        # No bank_name field — nothing to populate here
        return super().create(validated_data)


class HotelOutsourcingSerializer(serializers.ModelSerializer):
    booking_id = serializers.PrimaryKeyRelatedField(queryset=Booking.objects.all(), source='booking', write_only=True)
    booking_hotel_detail_id = serializers.PrimaryKeyRelatedField(queryset=BookingHotelDetails.objects.all(), source='booking_hotel_detail', required=False, allow_null=True, write_only=True)
    outsource_cost = serializers.SerializerMethodField(read_only=True)
    
    # Read-only fields for response
    organization_owner = serializers.SerializerMethodField(read_only=True)
    organization_owner_id = serializers.SerializerMethodField(read_only=True)
    branch = serializers.SerializerMethodField(read_only=True)
    branch_id = serializers.SerializerMethodField(read_only=True)
    status = serializers.SerializerMethodField(read_only=True)
    linked_in_ledger = serializers.SerializerMethodField(read_only=True)
    
    # Alias fields for compatibility with API spec
    check_in = serializers.DateField(source='check_in_date', required=False, allow_null=True)
    check_out = serializers.DateField(source='check_out_date', required=False, allow_null=True)
    room_price = serializers.FloatField(source='price', required=False)

    class Meta:
        model = None  # placeholder; we will import locally to avoid circular imports
        fields = [
            'id', 'booking_id', 'booking_hotel_detail_id', 'hotel_name', 'source_company', 
            'check_in', 'check_out', 'check_in_date', 'check_out_date',
            'room_type', 'room_no', 'price', 'room_price', 'quantity', 'number_of_nights', 
            'currency', 'remarks', 'is_paid', 'status', 'agent_notified',
            'created_by', 'created_at', 'updated_at', 'is_deleted', 'outsource_cost', 
            'ledger_entry_id', 'linked_in_ledger',
            'organization_owner', 'organization_owner_id', 'branch', 'branch_id'
        ]
        extra_kwargs = {
            'check_in_date': {'write_only': True},
            'check_out_date': {'write_only': True},
            'price': {'write_only': True},
        }

    def __init__(self, *args, **kwargs):
        # avoid circular import issues by binding model at runtime
        from .models import HotelOutsourcing
        self.Meta.model = HotelOutsourcing
        super().__init__(*args, **kwargs)

    def get_outsource_cost(self, obj):
        return obj.outsource_cost
    
    def get_organization_owner(self, obj):
        try:
            return obj.booking.organization.name if obj.booking and obj.booking.organization else None
        except:
            return None
    
    def get_organization_owner_id(self, obj):
        try:
            return obj.booking.organization_id if obj.booking else None
        except:
            return None
    
    def get_branch(self, obj):
        try:
            return obj.booking.branch.name if obj.booking and obj.booking.branch else None
        except:
            return None
    
    def get_branch_id(self, obj):
        try:
            return obj.booking.branch_id if obj.booking else None
        except:
            return None
    
    def get_status(self, obj):
        return 'paid' if obj.is_paid else 'pending_payment'
    
    def get_linked_in_ledger(self, obj):
        return obj.ledger_entry_id is not None and obj.ledger_entry_id > 0

    def create(self, validated_data):
        from .models import HotelOutsourcing
        from django.db import transaction

        booking = validated_data.get('booking')
        booking_hotel_detail = validated_data.get('booking_hotel_detail', None)

        with transaction.atomic():
            ho = HotelOutsourcing.objects.create(**validated_data)

            # mark booking as outsourced
            booking.is_outsourced = True
            booking.save(update_fields=['is_outsourced'])

            # update booking hotel detail if provided
            if booking_hotel_detail:
                booking_hotel_detail.self_hotel_name = ho.hotel_name
                booking_hotel_detail.check_in_date = ho.check_in_date or booking_hotel_detail.check_in_date
                booking_hotel_detail.check_out_date = ho.check_out_date or booking_hotel_detail.check_out_date
                booking_hotel_detail.room_type = ho.room_type or booking_hotel_detail.room_type
                booking_hotel_detail.outsourced_hotel = True
                booking_hotel_detail.save()

        return ho

    def update(self, instance, validated_data):
        # allow patching payment status and agent_notified only via serializer
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        return instance


# --- Main Booking Serializer ---
class BookingSerializer(serializers.ModelSerializer):
    organization_id = serializers.PrimaryKeyRelatedField(
        queryset=Organization.objects.all(), source="organization", write_only=True
    )
    branch_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(), source="branch", write_only=True
    )
    umrah_package = UmrahPackageSerializer(read_only=True)
    ziyarat_details = BookingPersonZiyaratDetailsSerializer(many=True, required=False)
    food_details = BookingPersonFoodDetailsSerializer(many=True, required=False)
    agency_id = serializers.PrimaryKeyRelatedField(
        queryset=Agency.objects.all(), source="agency"
    )
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="user"
    )
    internal_notes_id = serializers.PrimaryKeyRelatedField(
        source="internals",
        queryset=InternalNote.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
        many=True
    )
    hotel_details = BookingHotelDetailsSerializer(many=True, required=False)
    transport_details = BookingTransportDetailsSerializer(many=True, required=False)
    ticket_details = BookingTicketDetailsSerializer(many=True, required=False)
    person_details = BookingPersonDetailSerializer(many=True, required=False)
    payment_details = PaymentSerializer(many=True, required=False)
    payments = serializers.ListField(child=serializers.DictField(), required=False)
    journal_items = serializers.ListField(child=serializers.DictField(), required=False)
    remaining_amount = serializers.FloatField(read_only=True)
    booking_number = serializers.CharField(read_only=True)
    agency = AgencySerializer(read_only=True)
    user = UserSerializer(read_only=True)
    organization = OrganizationSerializer(read_only=True)
    branch = BranchSerializer(read_only=True)
    confirmed_by = UserSerializer(read_only=True)

    class Meta:
        model = Booking
        fields = "__all__"
    def to_representation(self, instance):
        data = super().to_representation(instance)

        # ✅ Food array sirf tab show hoga jab flag true hai
        if not instance.is_food_included:
            data.pop("food_details", None)

        # ✅ Ziyarat array sirf tab show hoga jab flag true hai
        if not instance.is_ziyarat_included:
            data.pop("ziyarat_details", None)

        return data
    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop("booking_number", None)
        hotel_data = validated_data.pop("hotel_details", [])
        transport_data = validated_data.pop("transport_details", [])
        ticket_data = validated_data.pop("ticket_details", [])
        person_data = validated_data.pop("person_details", [])
        payment_data = validated_data.pop("payment_details", [])
        payments_data = validated_data.pop("payments", [])
        journal_data = validated_data.pop("journal_items", [])
        
        # Pop ManyToMany field - can't be set during create()
        internals_data = validated_data.pop("internals", [])

        booking_number = f"BK-{now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

        # booking = Booking.objects.create(**validated_data)
        booking = Booking.objects.create(
            booking_number=booking_number,
            **validated_data
        )
        
        # Set ManyToMany relationship after booking is created
        if internals_data:
            booking.internals.set(internals_data)

        # attach payments/journal if provided (stored as JSON on Booking)
        if payments_data:
            booking.payments = payments_data
        if journal_data:
            booking.journal_items = journal_data
        booking.save()

        # --- Flat relations (bulk_create) ---
        # if hotel_data:
        #     BookingHotelDetails.objects.bulk_create(
        #         [BookingHotelDetails(booking=booking, **hd) for hd in hotel_data]
        #     )
        from packages.models import RiyalRate  # apni app ka naam dalna
        rate_obj = RiyalRate.objects.filter(organization=booking.organization).first()
        hotel_instances = []
        total_pkr_sum = 0
        total_riyal_sum = 0
        for hd in hotel_data:
            check_in = hd["check_in_date"]
            check_out = hd["check_out_date"]
            

            nights = (check_out - check_in).days
            if nights < 0:
                nights = 0  

            price = hd.get("price", 0)
            quantity = hd.get("quantity", 1)

            total_price = price * nights * quantity
            hd["number_of_nights"] = nights
            hd["total_price"] = total_price
            if rate_obj and rate_obj.is_hotel_pkr is False:
                hd["total_in_riyal_rate"] = total_price
                hd["total_in_pkr"] = total_price * rate_obj.rate
                total_riyal_sum += hd["total_in_riyal_rate"]
                total_pkr_sum += hd["total_in_pkr"]
            else:
                hd["total_in_riyal_rate"] = None
                hd["total_in_pkr"] = None
            hotel_instances.append(BookingHotelDetails(booking=booking, **hd))
        if hotel_instances:
            BookingHotelDetails.objects.bulk_create(hotel_instances)
        booking.total_hotel_amount_pkr = total_pkr_sum
        booking.total_hotel_amount_sar = total_riyal_sum
        booking.save()
        # if transport_data:
        #     BookingTransportDetails.objects.bulk_create(
        #         [BookingTransportDetails(booking=booking, **td) for td in transport_data]
        #     )
        # if transport_data:
        #     for td in transport_data:
        #         # extract nested sectors
        #         sector_data = td.pop("sector_details", [])
        
        #         # create transport detail
        #         transport_detail = BookingTransportDetails.objects.create(
        #             booking=booking, **td
        #         )
        
        #         # create related sector rows
        #         for sd in sector_data:
        #             BookingTransportSector.objects.create(
        #                 transport_detail=transport_detail, **sd
        #             )
        if transport_data:
            from packages.models import RiyalRate  
            from decimal import Decimal
            
            rate_obj = RiyalRate.objects.filter(organization=booking.organization).first()
        
            for td in transport_data:
                sector_data = td.pop("sector_details", [])
        
                # --- vehicle_type ki price le kar td me dal do ---
                vehicle_type = td.get("vehicle_type")
                price_value = 0
                if vehicle_type:
                    try:
                        vt = VehicleType.objects.get(id=vehicle_type.id if hasattr(vehicle_type, "id") else vehicle_type)
                        price_value = vt.price
                    except VehicleType.DoesNotExist:
                        price_value = 0
        
                td["price"] = price_value  
        
                # --- conversion logic ---
                if rate_obj and td.get("is_price_pkr") is False:
                    base_price = Decimal(str(td.get("price", 0)))  # float -> decimal safe conversion
                    riyal_rate = Decimal(str(rate_obj.rate)) if rate_obj else Decimal("0")
                    td["price_in_sar"] = base_price
                    td["price_in_pkr"] = base_price * riyal_rate
                    td["riyal_rate"] = riyal_rate
                else:
                    td["price_in_pkr"] = price_value

                # create transport detail
                transport_detail = BookingTransportDetails.objects.create(
                    booking=booking, **td
                )
        
                # create related sector rows
                for sd in sector_data:
                    BookingTransportSector.objects.create(
                        transport_detail=transport_detail, **sd
                    )

    
        # --- Nested tickets (delegate to serializer) ---
        for td in ticket_data:
            serializer = BookingTicketDetailsSerializer()
            serializer.create({**td, "booking": booking})

        # --- Nested persons (delegate to serializer) ---
        for pd in person_data:
            serializer = BookingPersonDetailSerializer(data=pd)
            serializer.is_valid(raise_exception=True)
            serializer.save(booking=booking)

        # --- Flat payments ---
        if payment_data:
            Payment.objects.bulk_create(
                [Payment(booking=booking, **pay) for pay in payment_data]
            )

        return booking

    @transaction.atomic
    def update(self, instance, validated_data):
        hotel_data = validated_data.pop("hotel_details", [])
        transport_data = validated_data.pop("transport_details", [])
        ticket_data = validated_data.pop("ticket_details", [])
        person_data = validated_data.pop("person_details", [])
        payment_data = validated_data.pop("payment_details", [])

        # update booking fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # --- Hotels ---
        if hotel_data is not None:
            instance.hotel_details.all().delete()
            BookingHotelDetails.objects.bulk_create(
                [BookingHotelDetails(booking=instance, **hd) for hd in hotel_data]
            )

        # --- Transport ---
        if transport_data is not None:
            instance.transport_details.all().delete()
            BookingTransportDetails.objects.bulk_create(
                [BookingTransportDetails(booking=instance, **td) for td in transport_data]
            )

        # --- Tickets ---
        if ticket_data is not None:
            instance.ticket_details.all().delete()
            for td in ticket_data:
                serializer = BookingTicketDetailsSerializer(data=td)
                serializer.is_valid(raise_exception=True)
                serializer.save(booking=instance)

        # --- Persons ---
        if person_data is not None:
            instance.person_details.all().delete()
            for pd in person_data:
                serializer = BookingPersonDetailSerializer(data=pd)
                serializer.is_valid(raise_exception=True)
                serializer.save(booking=instance)

        # --- Payments ---
        if payment_data is not None:
            instance.payment_details.all().delete()
            Payment.objects.bulk_create(
                [Payment(booking=instance, **pay) for pay in payment_data]
            )

        return instance



class PaymentSerializer(serializers.ModelSerializer):
    # Represent `bank` as a string (bank name) in responses, but accept
    # either a bank id or a bank name on input. Validation will resolve
    # the string/id to a Bank instance for saving.
    bank = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = Payment
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        # Normalize initial_data values like '0' or 0 for bank-account fields
        # so DRF's PrimaryKeyRelatedField won't try to validate an invalid PK
        # (which yields the "Please select a valid ..." error). We convert
        # falsy/zero values to None before field-level validation runs.
        initial = kwargs.get('data') if 'data' in kwargs else (args[1] if len(args) > 1 else None)
        try:
            if isinstance(initial, dict):
                for key in ('agent_bank_account', 'organization_bank_account'):
                    if key in initial and (initial[key] in (0, '0', '', None)):
                        initial[key] = None
                # also normalize bank field if submitted as empty string
                if 'bank' in initial and initial.get('bank') in ('', '0'):
                    initial['bank'] = None
                # place normalized data back into kwargs/args
                if 'data' in kwargs:
                    kwargs['data'] = initial
                else:
                    args = (args[0], initial) + args[2:]
        except Exception:
            pass
        super().__init__(*args, **kwargs)

    def to_representation(self, instance):
        out = super().to_representation(instance)
        try:
            b = getattr(instance, 'bank', None)
            out['bank'] = getattr(b, 'name', None) if b else None
        except Exception:
            out['bank'] = None
        return out

    def validate(self, data):
        # Normalize blank bank values to None to avoid assigning '' to FK
        bank_val = data.get('bank', None)
        if isinstance(bank_val, str) and not bank_val.strip():
            data['bank'] = None
            bank_val = None

        # If `bank` provided as string or id, resolve to Bank instance so the
        # ModelSerializer can save the FK correctly.
        if bank_val is not None and not isinstance(bank_val, Bank):
            bank_obj = None
            # if it's numeric, try pk lookup
            try:
                bank_id = int(bank_val)
                bank_obj = Bank.objects.filter(pk=bank_id).first()
            except Exception:
                bank_obj = None

            # otherwise, try to find by name within the provided organization
            if bank_obj is None and isinstance(bank_val, str) and bank_val.strip():
                org = data.get('organization')
                try:
                    if org:
                        bank_obj = Bank.objects.filter(organization=getattr(org, 'id', org), name=bank_val).first()
                    if not bank_obj:
                        bank_obj = Bank.objects.filter(name=bank_val).first()
                except Exception:
                    bank_obj = None

            # If bank not found and a name was provided, always attempt to create
            # a Bank under the provided organization (fail loudly if creation
            # cannot be completed so callers can correct payloads).
            if bank_obj is None and isinstance(bank_val, str) and bank_val.strip():
                org = data.get('organization')
                try:
                    if org:
                        # support org passed as id or Organization instance
                        org_id = getattr(org, 'id', org)
                        bank_obj, created = Bank.objects.get_or_create(name=bank_val, organization_id=org_id)
                    else:
                        # cannot auto-create without organization context
                        bank_obj = None
                except Exception as e:
                    # Creation failed — surface an explicit validation error
                    raise serializers.ValidationError({'bank': f"Failed to create Bank '{bank_val}': {e}"})

            # set resolved Bank instance (or None)
            if bank_obj:
                data['bank'] = bank_obj
            else:
                data['bank'] = None

        # Determine payment method (prefer validated data, then initial input, then existing instance)
        method_val = data.get('method')
        if not method_val and hasattr(self, 'initial_data'):
            method_val = self.initial_data.get('method')
        # If still not provided (PATCH/partial update), fall back to instance value
        if not method_val and getattr(self, 'instance', None) is not None:
            try:
                method_val = getattr(self.instance, 'method', None)
            except Exception:
                method_val = None
        method_str = str(method_val).strip().lower() if method_val else ''

        # If user provided a bank name but we could not resolve/create it,
        # surface a clear validation error when the payment method requires it.
        if method_str == 'cash' and bank_val and not data.get('bank'):
            raise serializers.ValidationError({'bank': f"Bank '{bank_val}' not found and could not be created."})

        errors = {}

        # Business rules:
        # - If method == 'cash' -> bank is required; agent_bank_account is NOT required
        # - If method != 'cash' -> agent_bank_account is required; bank is NOT required
        if method_str == 'cash':
            # bank can come from validated data or existing instance
            bank_present = data.get('bank') or (getattr(self.instance, 'bank_id', None) if getattr(self, 'instance', None) else None)
            if not bank_present:
                errors['bank'] = 'Bank is required when payment method is cash.'
        else:
            # require agent_bank_account for non-cash methods; allow instance value on PATCH
            aba = data.get('agent_bank_account') or (self.initial_data.get('agent_bank_account') if hasattr(self, 'initial_data') else None) or (getattr(self.instance, 'agent_bank_account_id', None) if getattr(self, 'instance', None) else None)
            if not aba:
                errors['agent_bank_account'] = 'Agent bank account is required when payment method is not cash.'

        if errors:
            raise serializers.ValidationError(errors)

        return data
        
class SectorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sector
        fields = "__all__"
class BigSectorSerializer(serializers.ModelSerializer):
    organization = OrganizationSerializer(read_only=True)
    organization_id = serializers.PrimaryKeyRelatedField(
        queryset=Organization.objects.all(),
        source="organization",
        write_only=True
    )
    # Nested read
    small_sectors = SectorSerializer(many=True, read_only=True)
    # IDs write
    small_sector_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Sector.objects.all(),
        source="small_sectors",
        write_only=True
    )

    class Meta:
        model = BigSector
        fields = [
            "id",
            "organization", "organization_id",
            "small_sectors", "small_sector_ids",
        ]

    def create(self, validated_data):
        small_sectors = validated_data.pop("small_sectors", [])
        big_sector = BigSector.objects.create(**validated_data)
        if small_sectors:
            big_sector.small_sectors.set(small_sectors)
        return big_sector

    def update(self, instance, validated_data):
        small_sectors = validated_data.pop("small_sectors", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if small_sectors is not None:
            instance.small_sectors.set(small_sectors)
        return instance
class VehicleTypeSerializer(serializers.ModelSerializer):
    small_sector = SectorSerializer(read_only=True)
    small_sector_id = serializers.PrimaryKeyRelatedField(
        queryset=Sector.objects.all(), source="small_sector", write_only=True, required=False, allow_null=True
    )

    big_sector = BigSectorSerializer(read_only=True)
    big_sector_id = serializers.PrimaryKeyRelatedField(
        queryset=BigSector.objects.all(), source="big_sector", write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = VehicleType
        fields = [
            "id",
            "vehicle_name",
            "vehicle_type",
            "price",
            "note",
            "visa_type",
            "status",
            "organization",
            "small_sector",
            "small_sector_id",
            "big_sector",
            "big_sector_id",
        ]
class InternalNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = InternalNote

        fields = "__all__"
class BankAccountSerializer(serializers.ModelSerializer):
    organization_id = serializers.PrimaryKeyRelatedField(
        queryset=Organization.objects.all(), source="organization", write_only=True
    )
    branch_id = NullablePKRelatedField(
        queryset=Branch.objects.all(), source="branch", write_only=True, required=False, allow_null=True,
        error_messages={
            'does_not_exist': 'Please select a valid branch_id',
            'invalid': 'Please select a valid branch_id'
        }
    )
    agency_id = serializers.PrimaryKeyRelatedField(
        queryset=Agency.objects.all(), source="agency", write_only=True, required=False, allow_null=True,
        error_messages={
            'does_not_exist': 'Please select a valid agency_id',
            'invalid': 'Please select a valid agency_id'
        }
    )

    organization = OrganizationSerializer(read_only=True)
    branch = BranchSerializer(read_only=True)
    agency = AgencySerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    # allow client to pass created_by as an id (write-only) or default to request.user
    created_by_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    # expose is_company_account as writeable boolean (model has this field)
    is_company_account = serializers.BooleanField(required=False)

    class Meta:
        model = BankAccount
        fields = "__all__"
    def validate(self, attrs):
        # Keep validation minimal here: ensure provided foreign keys are consistent if present.
        return attrs

    def create(self, validated_data):
        # Only pass fields that actually exist on the BankAccount model.
        organization = validated_data.pop("organization", None)
        branch = validated_data.pop("branch", None)
        agency = validated_data.pop("agency", None)
        # handle created_by if provided as id (write-only field)
        created_by = None
        created_by_id = validated_data.pop('created_by_id', None)
        if created_by_id:
            try:
                created_by = User.objects.filter(id=created_by_id).first()
            except Exception:
                created_by = None

        # if not provided, fall back to authenticated request user when available
        if not created_by:
            req = self.context.get('request') if hasattr(self, 'context') else None
            try:
                if req and getattr(req, 'user', None) and req.user.is_authenticated:
                    created_by = req.user
            except Exception:
                pass
        # allow is_company_account to be set by payload (if present)
        is_company = validated_data.pop('is_company_account', None)

        # If client sent camelCase or alternate key names (e.g. from frontend),
        # prefer those explicit values when present in the raw request payload.
        if is_company is None:
            try:
                req = self.context.get('request') if hasattr(self, 'context') else None
                if req is not None and isinstance(req.data, dict):
                    raw_flag = None
                    for key in ('is_company_account', 'isCompanyAccount', 'isCompany'):
                        if key in req.data:
                            raw_flag = req.data.get(key)
                            break
                    if raw_flag is not None:
                        # normalize common string boolean representations
                        if isinstance(raw_flag, str):
                            raw_flag_l = raw_flag.strip().lower()
                            if raw_flag_l in ('true', '1', 'yes'):
                                is_company = True
                            elif raw_flag_l in ('false', '0', 'no'):
                                is_company = False
                        else:
                            is_company = bool(raw_flag)
            except Exception:
                pass

        # If the client didn't explicitly send `is_company_account`, infer it
        # from whether a `created_by` user is present (company accounts must
        # have a creator). Also accept a nested `created_by` object in the
        # original request payload (some frontends send the full user object).
        req = self.context.get('request') if hasattr(self, 'context') else None
        if not created_by and req is not None:
            try:
                raw_created = None
                if isinstance(req.data, dict):
                    raw_created = req.data.get('created_by') or req.data.get('created_by_id')
                if raw_created:
                    cid = None
                    if isinstance(raw_created, dict):
                        cid = raw_created.get('id') or raw_created.get('pk') or raw_created.get('user_id')
                    else:
                        cid = raw_created
                    if cid:
                        try:
                            created_by = User.objects.filter(id=int(cid)).first()
                        except Exception:
                            created_by = created_by
            except Exception:
                pass

        # infer is_company if not explicitly provided
        if is_company is None:
            is_company = True if created_by else False

        # create the BankAccount record
        ba = BankAccount.objects.create(
            organization=organization,
            branch=branch,
            agency=agency,
            created_by=created_by,
            is_company_account=bool(is_company),
            **validated_data
        )

        return ba
class OrganizationLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganizationLink
        fields = "__all__"
class AllowedResellerSerializer(serializers.ModelSerializer):
    reseller_company = serializers.PrimaryKeyRelatedField(
        queryset=Organization.objects.all(), allow_null=True, required=False
    )
    discount_group = serializers.PrimaryKeyRelatedField(
        queryset=DiscountGroup.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = AllowedReseller
        # expose only relevant fields in stable order
        fields = [
            "id",
            "inventory_owner_company",
            "reseller_company",
            "discount_group",
            "allowed_types",
            "allowed_items",
            "requested_status_by_reseller",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        # inventory_owner_company, reseller_company, discount_group, allowed_types
        return AllowedReseller.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
class DiscountSerializer(serializers.ModelSerializer):
    discounted_hotels = serializers.PrimaryKeyRelatedField(
        queryset=Hotels.objects.all(), many=True, write_only=True, required=False
    )
    discounted_hotels_data = HotelsSerializer(
        many=True, read_only=True, source="discounted_hotels"
    )

    class Meta:
        model = Discount
        fields = [
            "id",
            "organization",
            "things",
            "group_ticket_discount_amount",
            "umrah_package_discount_amount",
            "currency",
            "room_type",
            "per_night_discount",
            "discounted_hotels",       # POST/PUT ke liye IDs
            "discounted_hotels_data",  # GET ke liye full objects
        ]


class DiscountGroupSerializer(serializers.ModelSerializer):
    # discounts are accepted on write, but for GET we return a compact object (see to_representation)
    discounts = DiscountSerializer(many=True, write_only=True, required=False)

    # allow a more convenient hotel_night_discounts payload shape as requested by the API (write-only)
    hotel_night_discounts = serializers.ListField(child=serializers.DictField(), write_only=True, required=False)

    class Meta:
        model = DiscountGroup
        fields = ["id", "name", "group_type", "organization", "is_active", "discounts", "hotel_night_discounts"]

    def create(self, validated_data):
        discounts_data = validated_data.pop("discounts", [])
        hotel_night_discounts = validated_data.pop("hotel_night_discounts", [])
        discount_group = DiscountGroup.objects.create(**validated_data)

        # create explicit discounts passed in the `discounts` list
        for discount_data in discounts_data:
            hotels = discount_data.pop("discounted_hotels", [])
            discount = Discount.objects.create(discount_group=discount_group, **discount_data)
            if hotels:
                discount.discounted_hotels.set(hotels)

        # handle hotel_night_discounts convenience format: each entry may contain per-room-type discounts + discounted_hotels list
        # expected keys: quint_per_night_discount, quad_per_night_discount, triple_per_night_discount, double_per_night_discount, sharing_per_night_discount, other_per_night_discount, discounted_hotels
        room_map = {
            "quint_per_night_discount": "quint",
            "quad_per_night_discount": "quad",
            "triple_per_night_discount": "triple",
            "double_per_night_discount": "double",
            "sharing_per_night_discount": "sharing",
            "other_per_night_discount": "all",
        }

        for entry in hotel_night_discounts:
            hotels = entry.get("discounted_hotels", [])
            for key, room_type in room_map.items():
                val = entry.get(key)
                if val in (None, "", []):
                    continue
                # create a Discount per room type
                disc = Discount.objects.create(
                    discount_group=discount_group,
                    organization=discount_group.organization,
                    things="hotel",
                    room_type=room_type,
                    per_night_discount=val,
                )
                if hotels:
                    disc.discounted_hotels.set(hotels)

        return discount_group

    def to_representation(self, instance):
        # Build discounts object (single values)
        group_ticket_disc = instance.discounts.filter(things="group_ticket").first()
        umrah_disc = instance.discounts.filter(things="umrah_package").first()

        discounts_obj = {
            "group_ticket_discount_amount": (
                str(group_ticket_disc.group_ticket_discount_amount)
                if group_ticket_disc and group_ticket_disc.group_ticket_discount_amount is not None
                else ""
            ),
            "umrah_package_discount_amount": (
                str(umrah_disc.umrah_package_discount_amount)
                if umrah_disc and umrah_disc.umrah_package_discount_amount is not None
                else ""
            ),
        }

        # Build hotel_night_discounts list by grouping hotel Discounts by the set of hotel IDs
        hotel_discs = instance.discounts.filter(things="hotel").prefetch_related("discounted_hotels")
        grouped = {}
        room_key_map = {
            "quint": "quint_per_night_discount",
            "quad": "quad_per_night_discount",
            "triple": "triple_per_night_discount",
            "double": "double_per_night_discount",
            "sharing": "sharing_per_night_discount",
            "all": "other_per_night_discount",
        }

        # helper to format hotel per-night discounts: drop ".00" for whole numbers
        def _fmt_hotel_amount(val):
            if val is None:
                return ""
            try:
                dec = Decimal(str(val))
            except Exception:
                return str(val)
            # integer value → return without decimal part
            if dec == dec.to_integral():
                return str(int(dec))
            # otherwise remove trailing zeros
            return format(dec.normalize(), 'f')

        for disc in hotel_discs:
            hotel_ids = tuple(sorted([h.id for h in disc.discounted_hotels.all()]))
            if hotel_ids not in grouped:
                grouped[hotel_ids] = {
                    "quint_per_night_discount": "",
                    "quad_per_night_discount": "",
                    "triple_per_night_discount": "",
                    "double_per_night_discount": "",
                    "sharing_per_night_discount": "",
                    "other_per_night_discount": "",
                    "discounted_hotels": list(hotel_ids),
                }

            key = room_key_map.get(disc.room_type)
            if key:
                grouped[hotel_ids][key] = _fmt_hotel_amount(disc.per_night_discount)

        # Return an explicit minimal representation so no extra keys are included
        return {
            "id": instance.id,
            "name": instance.name,
            "group_type": instance.group_type,
            "organization": instance.organization_id,
            "is_active": instance.is_active,
            "discounts": discounts_obj,
            "hotel_night_discounts": list(grouped.values()),
        }
class MarkupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Markup
        fields = [
            "id",
            "name",
            "applies_to",
            "ticket_markup",
            "hotel_per_night_markup",
            "umrah_package_markup",
            "organization_id",
            "created_at",
            "updated_at",
        ]

class BookingCallRemarkSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    created_by_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="created_by", write_only=True, required=False
    )

    class Meta:
        model = BookingCallRemark
        fields = [
            "id",
            "booking",
            "created_by",
            "created_by_id",
            "remark_text",
            "created_at",
        ]
        read_only_fields = ["id", "created_by", "created_at"]


# ===== New Integrated Booking Serializers =====

class BookingItemSerializer(serializers.ModelSerializer):
    """Serializer for booking inventory items"""
    hotel_name = serializers.CharField(source='hotel.name', read_only=True, allow_null=True)
    package_name = serializers.CharField(source='package.title', read_only=True, allow_null=True)
    
    class Meta:
        model = BookingItem
        fields = [
            'id',
            'inventory_type',
            'inventory_id',
            'hotel',
            'transport',
            'package',
            'visa',
            'ticket',
            'hotel_name',
            'package_name',
            'item_name',
            'description',
            'unit_price',
            'quantity',
            'total_amount',
            'discount_amount',
            'final_amount',
            'item_details',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'final_amount']
    
    def to_representation(self, instance):
        """Customize output based on inventory type"""
        data = super().to_representation(instance)
        
        # Add inventory_id based on type
        if instance.inventory_type == 'hotel' and instance.hotel:
            data['inventory_id'] = instance.hotel.id
        elif instance.inventory_type == 'package' and instance.package:
            data['inventory_id'] = instance.package.id
            data['visa_id'] = instance.item_details.get('visa_id')
            data['price_per_person'] = instance.unit_price
        elif instance.inventory_type == 'transport' and instance.transport:
            data['inventory_id'] = instance.transport.id
            data['pickup_point'] = instance.item_details.get('pickup_point')
            data['drop_point'] = instance.item_details.get('drop_point')
            data['vehicle_type'] = instance.item_details.get('vehicle_type')
        elif instance.inventory_type == 'visa' and instance.visa:
            data['inventory_id'] = instance.visa.id
        
        # Add item-specific details from item_details JSON
        if instance.item_details:
            data.update(instance.item_details)
        
        # Clean up None values
        return {k: v for k, v in data.items() if v is not None}


class BookingPaxSerializer(serializers.ModelSerializer):
    """Serializer for passenger (PAX) details"""
    visa_id = serializers.IntegerField(source='visa.id', read_only=True, allow_null=True)
    
    class Meta:
        model = BookingPax
        fields = [
            'id',
            'pax_id',
            'first_name',
            'last_name',
            'passport_no',
            'passport_expiry',
            'nationality',
            'date_of_birth',
            'visa',
            'visa_id',
            'pax_type',
            'phone',
            'email',
            'special_requests',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'pax_id', 'created_at', 'updated_at']


class BookingStatusTimelineSerializer(serializers.ModelSerializer):
    """Serializer for booking status timeline/history"""
    
    class Meta:
        model = BookingStatusTimeline
        fields = [
            'id',
            'status',
            'timestamp',
            'changed_by',
            'notes',
        ]
        read_only_fields = ['id', 'timestamp']


class BookingPromotionSerializer(serializers.ModelSerializer):
    """Serializer for applied promotions/discounts"""
    
    class Meta:
        model = BookingPromotion
        fields = [
            'id',
            'promotion_code',
            'promotion_name',
            'discount_type',
            'discount_value',
            'discount_amount',
            'applies_to',
            'is_active',
            'applied_at',
        ]
        read_only_fields = ['id', 'applied_at']


class BookingPaymentSerializer(serializers.ModelSerializer):
    """Serializer for payment records"""
    
    class Meta:
        model = BookingPayment
        fields = [
            'id',
            'amount',
            'payment_method',
            'status',
            'transaction_id',
            'reference_no',
            'ledger_entry_id',
            'payment_date',
            'notes',
            'created_by',
        ]
        read_only_fields = ['id', 'payment_date']
    
    def to_representation(self, instance):
        """Format payment details for output"""
        data = super().to_representation(instance)
        # Group payment details
        return {
            'amount': data['amount'],
            'method': data['payment_method'],
            'status': data['status'],
            'transaction_id': data.get('transaction_id'),
            'reference_no': data.get('reference_no'),
            'payment_date': data['payment_date'],
        }


class IntegratedBookingSerializer(serializers.ModelSerializer):
    """
    Comprehensive booking serializer with all integrated modules:
    - Umrah/Visa/Package Inventory
    - PAX (Passenger) Module
    - Promotion & Discount Modules
    - Payment tracking
    - Status timeline
    """
    booking_items = BookingItemSerializer(many=True, read_only=True)
    pax_details = BookingPaxSerializer(source='booking_pax', many=True, read_only=True)
    payment_details = serializers.SerializerMethodField()
    status_timeline = BookingStatusTimelineSerializer(many=True, read_only=True)
    applied_promotions = BookingPromotionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id',
            'booking_number',
            'customer_name',
            'customer_contact',
            'customer_email',
            'organization',
            'agency',
            'date',
            'status',
            'payment_status',
            'ledger_id',
            'total_amount',
            'total_discount',
            'created_by',
            'booking_items',
            'pax_details',
            'payment_details',
            'status_timeline',
            'applied_promotions',
            'created_at',
        ]
        read_only_fields = ['id', 'booking_number', 'date', 'created_at']
    
    def get_payment_details(self, obj):
        """Get latest payment or aggregated payment info"""
        latest_payment = obj.payment_records.filter(status='completed').order_by('-payment_date').first()
        
        if latest_payment:
            return {
                'amount': float(latest_payment.amount),
                'method': latest_payment.payment_method,
                'status': latest_payment.status,
                'transaction_id': latest_payment.transaction_id,
                'payment_date': latest_payment.payment_date,
            }
        
        return {
            'amount': float(obj.total_payment_received) if obj.total_payment_received else 0,
            'method': None,
            'status': obj.payment_status.lower() if obj.payment_status else 'pending',
            'transaction_id': None,
        }
    
    def to_representation(self, instance):
        """Customize output to match the exact format requested"""
        data = super().to_representation(instance)
        
        # Rename fields to match requested format
        data['booking_no'] = data.pop('booking_number')
        data['booking_date'] = data.pop('date')
        
        # Ensure status is lowercase
        data['status'] = data['status'].lower() if data['status'] else 'pending'
        data['payment_status'] = data['payment_status'].lower() if data['payment_status'] else 'pending'
        
        return data
