from rest_framework.serializers import ModelSerializer
from organization.serializers import OrganizationSerializer
from .models import City
from booking.models import VehicleType, Sector
from users.serializers import UserSerializer
from .models import (
    Visa,
    PackageInclusion,
    PackageExclusion,
    RiyalRate,
    Shirka,
    UmrahVisaPrice,
    UmrahVisaPriceTwo,
    TransportSectorPrice,
    Airlines,
    City,
    BookingExpiry,
    UmrahPackage,
    UmrahPackageHotelDetails,
    UmrahPackageTransportDetails,
    UmrahPackageTicketDetails,
    UmrahPackageDiscountDetails,
    CustomUmrahPackage,
    CustomUmrahPackageHotelDetails,
    CustomUmrahPackageTransportDetails,
    CustomUmrahPackageTicketDetails,
    CustomUmrahZiaratDetails,
    CustomUmrahFoodDetails,
    OnlyVisaPrice,
    SetVisaType,
    FoodPrice,
    ZiaratPrice,
)
from rest_framework import serializers
from tickets.serializers import HotelsSerializer, TicketSerializer
from django.db import models


class VisaSerializer(serializers.ModelSerializer):
    """
    Serializer for Visa model with full CRUD support.
    Includes validation for status transitions and date validation.
    """
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    visa_type_display = serializers.CharField(source='get_visa_type_display', read_only=True)
    country_display = serializers.CharField(source='get_country_display', read_only=True)
    
    class Meta:
        model = Visa
        fields = '__all__'
        read_only_fields = ('visa_id', 'created_at', 'updated_at', 'application_date')
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None
    
    def validate(self, data):
        """Validate visa dates and status transitions"""
        # Validate expiry_date is after issue_date
        if data.get('issue_date') and data.get('expiry_date'):
            if data['expiry_date'] <= data['issue_date']:
                raise serializers.ValidationError({
                    'expiry_date': 'Expiry date must be after issue date.'
                })
        
        # Validate status transitions
        if self.instance:  # Update operation
            old_status = self.instance.status
            new_status = data.get('status', old_status)
            
            # Prevent changing from 'used' or 'expired' to active statuses
            if old_status in ['used', 'expired'] and new_status in ['pending', 'processing', 'issued']:
                raise serializers.ValidationError({
                    'status': f'Cannot change status from {old_status} to {new_status}.'
                })
        
        return data


class PackageInclusionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackageInclusion
        exclude = ['package']


class PackageExclusionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackageExclusion
        exclude = ['package']


class RiyalRateSerializer(ModelSerializer):
    class Meta:
        model = RiyalRate
        fields = "__all__"


class ShirkaSerializer(ModelSerializer):
    class Meta:
        model = Shirka
        fields = "__all__"


class UmrahVisaPriceSerializer(ModelSerializer):
    class Meta:
        model = UmrahVisaPrice
        fields = "__all__"


class UmrahVisaPriceTwoSerializer(serializers.ModelSerializer):
    vehicle_types = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=VehicleType.objects.all(),
        required=False
    )
    organization = OrganizationSerializer(read_only=True)
    # Accept legacy single-price keys from older frontends and map them
    adault_price = serializers.FloatField(write_only=True, required=False)
    child_price = serializers.FloatField(write_only=True, required=False)
    infant_price = serializers.FloatField(write_only=True, required=False)

    class Meta:
        model = UmrahVisaPriceTwo
        fields = "__all__"

    def create(self, validated_data):
        vehicle_types = validated_data.pop("vehicle_types", [])

        # Map legacy single-price fields to new explicit selling fields when provided
        legacy_adult = validated_data.pop("adault_price", None)
        legacy_child = validated_data.pop("child_price", None)
        legacy_infant = validated_data.pop("infant_price", None)

        if legacy_adult is not None and not validated_data.get("adult_selling_price"):
            validated_data["adult_selling_price"] = legacy_adult
        if legacy_child is not None and not validated_data.get("child_selling_price"):
            validated_data["child_selling_price"] = legacy_child
        if legacy_infant is not None and not validated_data.get("infant_selling_price"):
            validated_data["infant_selling_price"] = legacy_infant


        # create main record
        visa_price = UmrahVisaPriceTwo.objects.create(**validated_data)

        # create related hotel_details

        # set ManyToMany vehicle_types
        if vehicle_types:
            visa_price.vehicle_types.set(vehicle_types)

        return visa_price

    def update(self, instance, validated_data):
        vehicle_types = validated_data.pop("vehicle_types", None)

        # update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # reset & recreate hotel_details if provided
        

        # update vehicle_types if provided
        if vehicle_types is not None:
            instance.vehicle_types.set(vehicle_types)

        return instance



# class OnlyVisaPriceSerializer(ModelSerializer):
#     class Meta:
#         model = OnlyVisaPrice
#         fields = "__all__"
# serializers.py


class TransportSectorPriceSerializer(ModelSerializer):
    class Meta:
        model = TransportSectorPrice
        fields = "__all__"
    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Remove legacy single-price keys that older frontends may still expect
        # These fields are redundant when explicit selling/purchase fields exist
        for k in ("adault_price", "child_price", "infant_price"):
            data.pop(k, None)
        return data


class AirlinesSerializer(ModelSerializer):
    class Meta:
        model = Airlines
        fields = "__all__"

    def to_representation(self, instance):
        data = super().to_representation(instance)
        
        # Provide full URL for logo if available
        try:
            if instance.logo and hasattr(instance.logo, 'url'):
                if request:
                    data['logo'] = request.build_absolute_uri(instance.logo.url)
                else:
                    data['logo'] = instance.logo.url
            else:
                data['logo'] = None
        except Exception:
            data['logo'] = None
        return data


class CitySerializer(ModelSerializer):
    class Meta:
        model = City
        fields = "__all__"

class OnlyVisaPriceSerializer(serializers.ModelSerializer):
    # nested city data read-only
    city = CitySerializer(read_only=True)
    city_id = serializers.PrimaryKeyRelatedField(
        queryset=City.objects.all(), source="city", write_only=True, required=False, allow_null=True
    )

    # Accept legacy single-price keys for backward compatibility
    adault_price = serializers.FloatField(write_only=True, required=False)
    child_price = serializers.FloatField(write_only=True, required=False)
    infant_price = serializers.FloatField(write_only=True, required=False)
     # Accept frontend variants for visa_option and map them to model choices
    visa_option = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    class Meta:
        model = OnlyVisaPrice
        fields = [
            "id",
            "organization",
            "adault_price", "child_price", "infant_price",
            "adult_selling_price", "adult_purchase_price",
            "child_selling_price", "child_purchase_price",
            "infant_selling_price", "infant_purchase_price",
            "type",
            "city", "city_id",
            "status",
            "title",
            "is_transport",
            "sectors",
            # unified option for only/long_term
            "visa_option",
            # long-term optional fields
            "validity_days",
            "multi_entry",
            "long_term_discount_pct",
        ]

    # Allow setting sectors by id list
    sectors = serializers.PrimaryKeyRelatedField(many=True, queryset=Sector.objects.all(), required=False)

    def create(self, validated_data):
        # extract sectors list if provided so we can assign ManyToMany after create
        sectors_data = validated_data.pop('sectors', None)
        # map legacy keys to explicit per-person selling fields when provided
        legacy_adult = validated_data.pop("adault_price", None)
        legacy_child = validated_data.pop("child_price", None)
        legacy_infant = validated_data.pop("infant_price", None)

        if legacy_adult is not None and not validated_data.get("adult_selling_price"):
            validated_data["adult_selling_price"] = legacy_adult
        if legacy_child is not None and not validated_data.get("child_selling_price"):
            validated_data["child_selling_price"] = legacy_child
        if legacy_infant is not None and not validated_data.get("infant_selling_price"):
            validated_data["infant_selling_price"] = legacy_infant

        # Map frontend variant 'longterm' to model choice 'long_term'
        vopt = validated_data.get('visa_option')
        if isinstance(vopt, str) and vopt.lower() == 'longterm':
            validated_data['visa_option'] = 'long_term'

        instance = super().create(validated_data)
        if sectors_data is not None:
            instance.sectors.set(sectors_data)
        return instance

    def update(self, instance, validated_data):
        # extract sectors to set after update
        sectors_data = validated_data.pop('sectors', None)
        legacy_adult = validated_data.pop("adault_price", None)
        legacy_child = validated_data.pop("child_price", None)
        legacy_infant = validated_data.pop("infant_price", None)

        if legacy_adult is not None and not validated_data.get("adult_selling_price"):
            validated_data["adult_selling_price"] = legacy_adult
        if legacy_child is not None and not validated_data.get("child_selling_price"):
            validated_data["child_selling_price"] = legacy_child
        if legacy_infant is not None and not validated_data.get("infant_selling_price"):
            validated_data["infant_selling_price"] = legacy_infant

        # Map frontend variant 'longterm' to model choice 'long_term'
        vopt = validated_data.get('visa_option')
        if isinstance(vopt, str) and vopt.lower() == 'longterm':
            validated_data['visa_option'] = 'long_term'

        instance = super().update(instance, validated_data)
        if sectors_data is not None:
            instance.sectors.set(sectors_data)
        return instance

class FoodPriceSerializer(ModelSerializer):
    city = CitySerializer(read_only=True)
    city_id = serializers.PrimaryKeyRelatedField(
        queryset=City.objects.all(),
        source="city",
        write_only=True,
        required=False,
        allow_null=True
    )
    class Meta:
        model = FoodPrice
        fields = "__all__"


class ZiaratPriceSerializer(ModelSerializer):
    city = CitySerializer(read_only=True)
    city_id = serializers.PrimaryKeyRelatedField(
        queryset=City.objects.all(),
        source="city",
        write_only=True,
        required=False,
        allow_null=True
    )
    class Meta:
        model = ZiaratPrice
        fields = "__all__"


class BookingExpirySerializer(ModelSerializer):
    class Meta:
        model = BookingExpiry
        fields = "__all__"


class UmrahPackageHotelDetailsSerializer(ModelSerializer):
    hotel_info = HotelsSerializer(source="hotel", read_only=True, required=False)

    class Meta:
        model = UmrahPackageHotelDetails
        # Exclude the raw/base bed price fields from API output and keep only
        # the explicit selling/purchase fields (selling/purchase are useful
        # for financial calculations while base display prices may be redundant).
        exclude = [
            "package",
            # base bed prices (we keep selling/purchase fields only)
            "quaint_bed_price",
            "sharing_bed_price",
            "quad_bed_price",
            "triple_bed_price",
            "double_bed_price",
        ]


class UmrahPackageTransportDetailsSerializer(ModelSerializer):
    transport_sector_info = TransportSectorPriceSerializer(
        source="transport_sector", read_only=True, required=False
    )

    class Meta:
        model = UmrahPackageTransportDetails
        exclude = ["package"]

    def to_representation(self, instance):
        """Hide legacy/irrelevant fields and expose explicit per-person prices.

        Remove `vehicle_type` and legacy single-price fields from API output so
        clients always use explicit selling/purchase fields.
        """
        data = super().to_representation(instance)
        # Remove legacy or unwanted keys if present
        for k in ("adault_price", "child_price", "infant_price"):
            if k in data:
                data.pop(k, None)

        # Ensure explicit selling/purchase fields are present in the response
        # (model may already contain these; fall back to None if absent)
        data.setdefault("adult_selling_price", getattr(instance, "adult_selling_price", None))
        data.setdefault("adult_purchase_price", getattr(instance, "adult_purchase_price", None))
        data.setdefault("child_selling_price", getattr(instance, "child_selling_price", None))
        data.setdefault("child_purchase_price", getattr(instance, "child_purchase_price", None))
        data.setdefault("infant_selling_price", getattr(instance, "infant_selling_price", None))
        data.setdefault("infant_purchase_price", getattr(instance, "infant_purchase_price", None))

        return data


class UmrahPackageTicketDetailsSerializer(ModelSerializer):
    ticket_info = TicketSerializer(source="ticket", read_only=True, required=False)

    class Meta:
        model = UmrahPackageTicketDetails
        exclude = ["package"]


class UmrahPackageDiscountDetailsSerializer(ModelSerializer):
    class Meta:
        model = UmrahPackageDiscountDetails
        exclude = ["package"]


class UmrahPackageSerializer(ModelSerializer):
    """
    Enhanced serializer for UmrahPackage with complete package details including
    hotels, transport, flights, visa, inclusions, and exclusions.
    """
    # Nested relationships
    hotel_details = UmrahPackageHotelDetailsSerializer(many=True, required=False)
    transport_details = UmrahPackageTransportDetailsSerializer(
        many=True, required=False
    )
    ticket_details = UmrahPackageTicketDetailsSerializer(many=True, required=False)
    discount_details = UmrahPackageDiscountDetailsSerializer(many=True, required=False)
    # These nested fields are intentionally disabled for the public package list
    # to avoid returning large nested inclusion/exclusion arrays. They are
    # excluded by Meta.exclude below; setting to None prevents DRF assert.
    inclusions = None
    exclusions = None
    
    # Display fields
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    owner_organization_id = serializers.IntegerField(source='organization_id', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    package_type_display = serializers.CharField(source='get_package_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    available_slots = serializers.IntegerField(source='get_available_slots', read_only=True)
    
    # Existing calculated fields
    excluded_tickets = serializers.SerializerMethodField(read_only=True)
    adult_price = serializers.SerializerMethodField(read_only=True)
    infant_price = serializers.SerializerMethodField(read_only=True)
    child_discount = serializers.SerializerMethodField(read_only=True)
    
    # New pricing breakdown
    total_price_breakdown = serializers.SerializerMethodField()

    class Meta:
        model = UmrahPackage
        # Exclude a number of detailed/internal fields from the public package list
        # to avoid returning duplicate / unnecessary information in the list endpoint.
        exclude = [
            # The following fields were previously excluded from public list
            # responses to reduce payload size. They are now exposed so create/
            # update requests can set selling & purchase prices for extras.
            # (Keep other internal fields excluded below.)

            # activation flags / service & partial payment internals
            'is_active', 'is_quaint_active', 'is_sharing_active', 'is_quad_active',
            'is_triple_active', 'is_double_active',
            'adault_service_charge', 'child_service_charge', 'infant_service_charge',
            'is_service_charge_active',
            'adault_partial_payment', 'child_partial_payment', 'infant_partial_payment',
            'is_partial_payment_active', 'min_partial_percent', 'min_partial_amount',

            # age/restriction & organisation internals
            'filght_min_adault_age', 'filght_max_adault_age', 'max_chilld_allowed', 'max_infant_allowed',
            'inventory_owner_organization_id',
            # nested inclusions/exclusions are disabled separately by setting
            # the declared fields to None (see above). Do NOT include them
            # in Meta.exclude because they are not direct model fields.
        ]

        # Keep a few fields read-only as before
        read_only_fields = ('package_code', 'created_at', 'updated_at', 'left_seats')
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None

    def to_representation(self, instance):
        """Ensure transport and removed room-price fields are not present in output.

        Some endpoints or legacy code may produce dicts or include fields outside
        the serializer `exclude`. This defensive removal guarantees the API
        never returns these keys.
        """
        data = super().to_representation(instance)
        # remove legacy top-level numeric organization FK if present and
        # expose `owner_organization_id` for clarity in API responses
        if 'organization' in data:
            data.pop('organization', None)

        for k in (
            'transport_price', 'transport_purchase_price',
            'quint_room_price', 'quad_room_price', 'triple_room_price', 'double_room_price', 'sharing_bed_price',
        ):
            if k in data:
                data.pop(k, None)
        return data
    
    def get_total_price_breakdown(self, obj):
        """Return complete pricing breakdown for different passenger counts"""
        return {
            '1_adult': obj.calculate_total_price(adults=1, children=0, infants=0),
            '2_adults': obj.calculate_total_price(adults=2, children=0, infants=0),
            '1_adult_1_child': obj.calculate_total_price(adults=1, children=1, infants=0),
            '1_adult_1_infant': obj.calculate_total_price(adults=1, children=0, infants=1),
        }

    def create(self, validated_data):
        hotel_data = validated_data.pop("hotel_details", [])
        transport_data = validated_data.pop("transport_details", [])
        ticket_data = validated_data.pop("ticket_details", [])
        discount_data = validated_data.pop("discount_details", [])
        inclusions_data = validated_data.pop("inclusions", [])
        exclusions_data = validated_data.pop("exclusions", [])

        package = UmrahPackage.objects.create(**validated_data)

        for hotel in hotel_data:
            UmrahPackageHotelDetails.objects.create(package=package, **hotel)

        for transport in transport_data:
            UmrahPackageTransportDetails.objects.create(package=package, **transport)

        for ticket in ticket_data:
            UmrahPackageTicketDetails.objects.create(package=package, **ticket)
            
        for discount in discount_data:
            UmrahPackageDiscountDetails.objects.create(package=package, **discount)
        
        for inclusion in inclusions_data:
            PackageInclusion.objects.create(package=package, **inclusion)
        
        for exclusion in exclusions_data:
            PackageExclusion.objects.create(package=package, **exclusion)

        return package

    def update(self, instance, validated_data):
        hotel_data = validated_data.pop("hotel_details", [])
        transport_data = validated_data.pop("transport_details", [])
        ticket_data = validated_data.pop("ticket_details", [])
        discount_data = validated_data.pop("discount_details", [])
        inclusions_data = validated_data.pop("inclusions", [])
        exclusions_data = validated_data.pop("exclusions", [])

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Clear old nested data
        instance.hotel_details.all().delete()
        instance.transport_details.all().delete()
        instance.ticket_details.all().delete()
        instance.discount_details.all().delete()
        instance.inclusions.all().delete()
        instance.exclusions.all().delete()

        # Recreate new nested data
        for hotel in hotel_data:
            UmrahPackageHotelDetails.objects.create(package=instance, **hotel)

        for transport in transport_data:
            UmrahPackageTransportDetails.objects.create(package=instance, **transport)

        for ticket in ticket_data:
            UmrahPackageTicketDetails.objects.create(package=instance, **ticket)

        for discount in discount_data:
            UmrahPackageDiscountDetails.objects.create(package=instance, **discount)
        
        for inclusion in inclusions_data:
            PackageInclusion.objects.create(package=instance, **inclusion)
        
        for exclusion in exclusions_data:
            PackageExclusion.objects.create(package=instance, **exclusion)

        return instance

    def get_excluded_tickets(self, obj):
        """Return full Ticket objects where any of the seat-related fields equals 2147483647
        and the ticket is not part of this package's included ticket_details.
        """
        from tickets.models import Ticket

        MAX_SENTINEL = 2147483647
        included_ids = list(obj.ticket_details.values_list("ticket_id", flat=True))

        qs = Ticket.objects.filter(
            (
                models.Q(total_seats=MAX_SENTINEL)
                | models.Q(left_seats=MAX_SENTINEL)
                | models.Q(booked_tickets=MAX_SENTINEL)
                | models.Q(confirmed_tickets=MAX_SENTINEL)
            )
        ).exclude(id__in=included_ids)

        return TicketSerializer(qs, many=True).data

    def get_adult_price(self, obj):
        """Adult price / cost computed from components (food, ziarat, transport, visa, ticket)."""
        try:
            return obj.adult_cost()
        except Exception:
            return getattr(obj, 'adault_visa_selling_price', None)

    def get_infant_price(self, obj):
        """INFANT PRICE = INFANT TICKET SELLING PRICE + INFANT VISA SELLING PRICE"""
        try:
            return obj.infant_price()
        except Exception:
            # fallback similar to previous logic
            base = getattr(obj, "infant_visa_selling_price", 0) or 0
            first_ticket = obj.ticket_details.first()
            ticket_price = 0
            if first_ticket and getattr(first_ticket, "ticket", None):
                ticket_obj = first_ticket.ticket
                ticket_price = getattr(ticket_obj, "infant_price", 0) or 0
            return base + ticket_price

    def get_child_discount(self, obj):
        """CHILD DISCOUNT = ADULT TICKET SELLING PRICE - CHILD TICKET SELLING PRICE"""
        try:
            return obj.child_discount()
        except Exception:
            ticket = obj.ticket_details.first()
            if not ticket or not getattr(ticket, 'ticket', None):
                return 0
            t = ticket.ticket
            return (getattr(t, 'adult_price', 0) or 0) - (getattr(t, 'child_price', 0) or 0)

    def _first_hotel_field(self, obj, field_name):
        """Helper to get field from first hotel detail"""
        first = obj.hotel_details.first()
        if not first:
            return None
        return getattr(first, field_name, None)

    


class PublicUmrahPackageHotelSummarySerializer(serializers.ModelSerializer):
    hotel_name = serializers.CharField(source="hotel.name", read_only=True)
    hotel_info = HotelsSerializer(source="hotel", read_only=True)  # Include full hotel object with ID

    class Meta:
        model = UmrahPackageHotelDetails
        fields = [
            "hotel_info",  # Add hotel_info to fields
            "hotel_name", 
            "check_in_date", 
            "check_out_date", 
            "number_of_nights",
            "sharing_bed_selling_price",
            "quaint_bed_selling_price",
            "quad_bed_selling_price",
            "triple_bed_selling_price",
            "double_bed_selling_price",
        ]


class PublicUmrahPackageTicketSummarySerializer(serializers.ModelSerializer):
    ticket_info = serializers.SerializerMethodField()
    trip_details = serializers.SerializerMethodField()

    class Meta:
        model = UmrahPackageTicketDetails
        fields = ["trip_details", "ticket_info"]
    
    def get_ticket_info(self, obj):
        """Return ticket pricing information"""
        try:
            if not hasattr(obj, 'ticket') or not obj.ticket:
                return None
            
            ticket = obj.ticket
            return {
                "adult_price": getattr(ticket, 'adult_price', 0),
                "adult_selling_price": getattr(ticket, 'adult_selling_price', None),
                "child_price": getattr(ticket, 'child_price', 0),
                "child_selling_price": getattr(ticket, 'child_selling_price', None),
                "infant_price": getattr(ticket, 'infant_price', 0),
                "infant_selling_price": getattr(ticket, 'infant_selling_price', None),
            }
        except Exception:
            return None

    def get_trip_details(self, obj):
        # Get trip details from the related ticket
        try:
            # The model has a 'ticket' field, not 'ticket_info'
            if not hasattr(obj, 'ticket') or not obj.ticket:
                return []
            
            # trip_details is a related field on the Ticket model
            if not hasattr(obj.ticket, 'trip_details'):
                return []
            
            trips = obj.ticket.trip_details.all()
            return [{
                "trip_type": getattr(trip, 'trip_type', ''),
                # Get city names from the related City model
                "departure_city_name": trip.departure_city.name if trip.departure_city else '',
                "arrival_city_name": trip.arrival_city.name if trip.arrival_city else '',
                "flight_number": getattr(trip, 'flight_number', ''),
                "departure_date_time": getattr(trip, 'departure_date_time', None),
                "arrival_date_time": getattr(trip, 'arrival_date_time', None),
            } for trip in trips]
        except Exception as e:
            # Log the error but don't crash the API
            import traceback
            print(f"Error getting trip details: {e}")
            print(traceback.format_exc())
            return []


class PublicUmrahPackageListSerializer(serializers.ModelSerializer):
    price = serializers.SerializerMethodField()
    hotels = PublicUmrahPackageHotelSummarySerializer(source="hotel_details", many=True, read_only=True)
    transport = UmrahPackageTransportDetailsSerializer(source="transport_details", many=True, read_only=True)
    tickets = PublicUmrahPackageTicketSummarySerializer(source="ticket_details", many=True, read_only=True)

    class Meta:
        model = UmrahPackage
        fields = [
            "id",
            "title",
            "price",
            "total_seats",
            "left_seats",
            "booked_seats",
            "confirmed_seats",
            "available_start_date",
            "available_end_date",
            "reselling_allowed",
            "is_public",
            "hotels",
            "transport",
            "tickets",
            "adault_visa_selling_price",
            "child_visa_selling_price",
            "infant_visa_selling_price",
            "food_selling_price",
            "makkah_ziyarat_selling_price",
            "madinah_ziyarat_selling_price",
            "transport_selling_price",
        ]

    def get_price(self, obj):
        # prefer explicit price_per_person, fallback to adult visa price + service charge
        if getattr(obj, "price_per_person", None):
            return obj.price_per_person
        # try adult price fields
        try:
            return getattr(obj, 'adault_visa_selling_price', 0) + (obj.adault_service_charge or 0)
        except Exception:
            return None


class PublicUmrahPackageDetailSerializer(ModelSerializer):
    hotels = PublicUmrahPackageHotelSummarySerializer(source="hotel_details", many=True, read_only=True)
    transport = UmrahPackageTransportDetailsSerializer(source="transport_details", many=True, read_only=True)
    tickets = UmrahPackageTicketDetailsSerializer(source="ticket_details", many=True, read_only=True)

    class Meta:
        model = UmrahPackage
        fields = [
            "id",
            "title",
            "rules",
            "price",
            "price_per_person",
            "organization_id",  # Add organization_id
            "adault_visa_selling_price",
            "child_visa_selling_price",
            "infant_visa_selling_price",
            "total_seats",
            "left_seats",
            "booked_seats",
            "confirmed_seats",
            "available_start_date",
            "available_end_date",
            "reselling_allowed",
            "is_public",
            "food_selling_price",
            "makkah_ziyarat_selling_price",
            "madinah_ziyarat_selling_price",
            "transport_selling_price",
            "hotels",
            "transport",
            "tickets",
        ]

    price = serializers.SerializerMethodField()

    def get_price(self, obj):
        if getattr(obj, "price_per_person", None):
            return obj.price_per_person
        try:
            return getattr(obj, 'adault_visa_selling_price', 0) + (obj.adault_service_charge or 0)
        except Exception:
            return None

    def get_adult_price(self, obj):
        # keep the original (typo'd) field name as the source
        return getattr(obj, "adault_visa_selling_price", None)

    def get_infant_price(self, obj):
        # infant_price = infant_visa_price + ticket price (use first included ticket if present)
        base = getattr(obj, "infant_visa_selling_price", 0) or 0
        first_ticket = obj.ticket_details.first()
        ticket_price = 0
        if first_ticket and getattr(first_ticket, "ticket", None):
            ticket_obj = first_ticket.ticket
            ticket_price = getattr(ticket_obj, "adult_price", 0) or 0
        return base + ticket_price

    def get_child_discount(self, obj):
        # use child_visa_price as the flat child discount/price if present
        return getattr(obj, "child_visa_selling_price", None)

    def _first_hotel_field(self, obj, field_name):
        first = obj.hotel_details.first()
        if not first:
            return None
        return getattr(first, field_name, None)
    


class CustomUmrahPackageHotelDetailsSerializer(ModelSerializer):
    hotel_info = HotelsSerializer(source="hotel", read_only=True, required=False)

    class Meta:
        model = CustomUmrahPackageHotelDetails
        exclude = ["package"]


class CustomUmrahPackageTransportDetailsSerializer(ModelSerializer):
    transport_sector_info = TransportSectorPriceSerializer(
        source="transport_sector", read_only=True, required=False
    )

    class Meta:
        model = CustomUmrahPackageTransportDetails
        exclude = ["package"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        for k in ("vehicle_type", "adault_price", "child_price", "infant_price"):
            if k in data:
                data.pop(k, None)

        data.setdefault("adult_selling_price", getattr(instance, "adult_selling_price", None))
        data.setdefault("adult_purchase_price", getattr(instance, "adult_purchase_price", None))
        data.setdefault("child_selling_price", getattr(instance, "child_selling_price", None))
        data.setdefault("child_purchase_price", getattr(instance, "child_purchase_price", None))
        data.setdefault("infant_selling_price", getattr(instance, "infant_selling_price", None))
        data.setdefault("infant_purchase_price", getattr(instance, "infant_purchase_price", None))

        return data


class CustomUmrahPackageTicketDetailsSerializer(ModelSerializer):
    ticket_info = TicketSerializer(source="ticket", read_only=True, required=False)

    class Meta:
        model = CustomUmrahPackageTicketDetails
        exclude = ["package"]


class CustomUmrahZiaratDetailsSerializer(ModelSerializer):
    class Meta:
        model = CustomUmrahZiaratDetails
        exclude = ["package"]


class CustomUmrahFoodDetailsSerializer(ModelSerializer):
    class Meta:
        model = CustomUmrahFoodDetails
        exclude = ["package"]


class CustomUmrahPackageSerializer(ModelSerializer):
    # agent_name = serializers.CharField(source="agent.username", read_only=True)
    agency_name = serializers.CharField(source="agency.name", read_only=True)
    hotel_details = CustomUmrahPackageHotelDetailsSerializer(many=True, required=False)
    transport_details = CustomUmrahPackageTransportDetailsSerializer(
        many=True, required=False
    )
    ticket_details = CustomUmrahPackageTicketDetailsSerializer(
        many=True, required=False
    )
    ziarat_details = CustomUmrahZiaratDetailsSerializer(many=True, required=False)
    food_details = CustomUmrahFoodDetailsSerializer(many=True, required=False)
    user = UserSerializer(read_only=True)

    class Meta:
        model = CustomUmrahPackage
        fields = "__all__"

    def create(self, validated_data):
        hotel_data = validated_data.pop("hotel_details", [])
        transport_data = validated_data.pop("transport_details", [])
        ticket_data = validated_data.pop("ticket_details", [])
        ziarat_data = validated_data.pop("ziarat_details", [])
        food_data = validated_data.pop("food_details", [])

        package = CustomUmrahPackage.objects.create(**validated_data)

        for hotel in hotel_data:
            CustomUmrahPackageHotelDetails.objects.create(package=package, **hotel)

        for transport in transport_data:
            CustomUmrahPackageTransportDetails.objects.create(
                package=package, **transport
            )

        for ticket in ticket_data:
            CustomUmrahPackageTicketDetails.objects.create(package=package, **ticket)
        for ziarat in ziarat_data:
            CustomUmrahZiaratDetails.objects.create(package=package, **ziarat)
        for food in food_data:
            CustomUmrahFoodDetails.objects.create(package=package, **food)

        return package

    def update(self, instance, validated_data):
        hotel_data = validated_data.pop("hotel_details", None)
        transport_data = validated_data.pop("transport_details", None)
        ticket_data = validated_data.pop("ticket_details", None)
        ziarat_data = validated_data.pop("ziarat_details", None)
        food_data = validated_data.pop("food_details", None)

        # Update scalar fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Conditionally update nested relations
        if hotel_data is not None:
            instance.hotel_details.all().delete()
            for hotel in hotel_data:
                CustomUmrahPackageHotelDetails.objects.create(package=instance, **hotel)

        if transport_data is not None:
            instance.transport_details.all().delete()
            for transport in transport_data:
                CustomUmrahPackageTransportDetails.objects.create(
                    package=instance, **transport
                )

        if ticket_data is not None:
            instance.ticket_details.all().delete()
            for ticket in ticket_data:
                CustomUmrahPackageTicketDetails.objects.create(
                    package=instance, **ticket
                )

        if ziarat_data is not None:
            instance.ziarat_details.all().delete()
            for ziarat in ziarat_data:
                CustomUmrahZiaratDetails.objects.create(package=instance, **ziarat)

        if food_data is not None:
            instance.food_details.all().delete()
            for food in food_data:
                CustomUmrahFoodDetails.objects.create(package=instance, **food)

        return instance


class SetVisaTypeSerializer(ModelSerializer):
    class Meta:
        model = SetVisaType
        fields = "__all__"