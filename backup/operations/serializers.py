from rest_framework import serializers

# ===============================================
# PAX FULL DETAILS SERIALIZER
# ===============================================
# PAX FULL DETAILS SERIALIZER
# ===============================================
from booking.models import Booking, BookingPersonDetail
from operations.models import HotelOperation, TransportOperation, FoodOperation, AirportOperation, ZiyaratOperation

from booking.models import Booking, BookingPersonDetail
from operations.models import HotelOperation, TransportOperation, FoodOperation, AirportOperation, ZiyaratOperation

class PaxFullDetailSerializer(serializers.Serializer):
    pax_id = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    passport_no = serializers.CharField(source='passport_number')
    family_no = serializers.CharField(source='family_number')
    booking_id = serializers.CharField(source='booking.booking_number')
    package_type = serializers.CharField(source='booking.package_type')
    family_head_contact = serializers.CharField()
    flight = serializers.DictField()
    hotel = serializers.ListField()
    transport = serializers.ListField()
    ziyarats = serializers.ListField()
    food = serializers.ListField()

    def to_representation(self, instance):
        # instance is BookingPersonDetail
        data = {
            'pax_id': str(instance.id),
            'first_name': instance.first_name,
            'last_name': instance.last_name,
            'passport_no': instance.passport_number,
            'family_no': getattr(instance, 'family_number', ''),
            'booking_id': instance.booking.booking_number if instance.booking else '',
            'package_type': getattr(instance.booking, 'package_type', ''),
        }
        # Family head contact
        family_head = BookingPersonDetail.objects.filter(booking=instance.booking, is_family_head=True).first()
        data['family_head_contact'] = getattr(family_head, 'contact_number', '') if family_head else ''

        # Date filter
        request = self.context.get('request')
        date = request.query_params.get('date') if request else None
        if not date:
            from django.utils import timezone
            date = timezone.now().date()

        # Flight (AirportOperation)
        flight_qs = AirportOperation.objects.filter(pax=instance, date=date)
        flight = None
        if flight_qs.exists():
            f = flight_qs.first()
            flight = {
                'departure': f.pickup_point,
                'arrival': f.drop_point,
                'flight_time': str(f.flight_time),
            }
        data['flight'] = flight or {}

        # Hotel (HotelOperation)
        hotel_qs = HotelOperation.objects.filter(pax=instance, date=date)
        hotels = []
        for h in hotel_qs:
            hotels.append({
                'name': h.hotel_name_display if hasattr(h, 'hotel_name_display') else '',
                'check_in': str(h.check_in_date),
                'check_out': str(h.check_out_date),
            })
        data['hotel'] = hotels

        # Transport (TransportOperation)
        transport_qs = TransportOperation.objects.filter(pax=instance, date=date)
        transports = []
        for t in transport_qs:
            transports.append({
                'pickup': t.pickup_location,
                'drop': t.drop_location,
                'status': t.status,
            })
        data['transport'] = transports

        # Ziyarats (ZiyaratOperation)
        ziyarat_qs = ZiyaratOperation.objects.filter(pax=instance, date=date)
        ziyarats = []
        for z in ziyarat_qs:
            ziyarats.append({
                'location': z.location,
                'status': z.status,
            })
        data['ziyarats'] = ziyarats

        # Food (FoodOperation)
        food_qs = FoodOperation.objects.filter(pax=instance, date=date)
        foods = []
        for f in food_qs:
            foods.append({
                'meal_type': f.meal_type,
                'status': f.status,
            })
        data['food'] = foods

        return data
from rest_framework import serializers
from .models import RoomMap, HotelOperation, TransportOperation, FoodOperation, AirportOperation, ZiyaratOperation
from tickets.models import Hotels
from booking.models import Booking, BookingPersonDetail, VehicleType


# --- Payload serializers for Hotel Room Map API ---
class BedPayloadSerializer(serializers.Serializer):
    bed_no = serializers.CharField()
    status = serializers.CharField(required=False, default='available')
    coords = serializers.DictField(required=False)


class RoomPayloadSerializer(serializers.Serializer):
    room_no = serializers.CharField()
    room_type = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    capacity = serializers.IntegerField()
    coords = serializers.DictField(required=False)
    beds = BedPayloadSerializer(many=True)


class HotelRoomMapSerializer(serializers.Serializer):
    hotel_id = serializers.IntegerField()
    floor_no = serializers.CharField()
    floor_map_url = serializers.CharField(required=False, allow_blank=True)
    rooms = RoomPayloadSerializer(many=True)

    def validate_hotel_id(self, value):
        if not Hotels.objects.filter(id=value).exists():
            raise serializers.ValidationError('Hotel not found')
        return value



class RoomMapSerializer(serializers.ModelSerializer):
    """
    Serializer for RoomMap model.
    Handles CRUD operations for hotel room inventory.
    """
    
    hotel_name = serializers.CharField(source='hotel.name', read_only=True)
    hotel_city = serializers.CharField(source='hotel.city.name', read_only=True, allow_null=True)
    
    class Meta:
        model = RoomMap
        fields = [
            'id',
            'hotel',
            'hotel_name',
            'hotel_city',
            'floor_no',
            'room_no',
            'beds',
            'availability_status',
            'room_type',
            'created_at',
            'updated_at',
            'created_by'
        ]
        read_only_fields = ['created_at', 'updated_at', 'hotel_name', 'hotel_city']
    
    def validate_beds(self, value):
        """Validate that beds count is positive"""
        if value < 1:
            raise serializers.ValidationError("Number of beds must be at least 1")
        if value > 20:
            raise serializers.ValidationError("Number of beds cannot exceed 20")
        return value
    
    def validate(self, data):
        """
        Cross-field validation:
        - Ensure hotel exists
        - Check for duplicate room_no within same hotel
        """
        hotel = data.get('hotel')
        room_no = data.get('room_no')
        
        # Check for duplicate room_no in same hotel (on create)
        if self.instance is None:  # Creating new record
            if hotel and room_no:
                if RoomMap.objects.filter(hotel=hotel, room_no=room_no).exists():
                    raise serializers.ValidationError(
                        f"Room {room_no} already exists in {hotel.name}"
                    )
        else:  # Updating existing record
            if hotel and room_no:
                existing = RoomMap.objects.filter(
                    hotel=hotel,
                    room_no=room_no
                ).exclude(id=self.instance.id)
                
                if existing.exists():
                    raise serializers.ValidationError(
                        f"Room {room_no} already exists in {hotel.name}"
                    )
        
        return data


class RoomMapListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing room maps.
    Used in GET list endpoints for better performance.
    """
    
    hotel_name = serializers.CharField(source='hotel.name', read_only=True)
    
    class Meta:
        model = RoomMap
        fields = [
            'id',
            'hotel',
            'hotel_name',
            'floor_no',
            'room_no',
            'beds',
            'availability_status',
            'room_type'
        ]


class RoomAvailabilitySerializer(serializers.Serializer):
    """
    Serializer for checking room availability.
    Used in availability check endpoints.
    """
    
    hotel_id = serializers.IntegerField(required=True)
    floor_no = serializers.CharField(required=False, allow_blank=True)
    beds = serializers.IntegerField(required=False)
    availability_status = serializers.ChoiceField(
        choices=['available', 'occupied', 'cleaning_pending', 'maintenance', 'reserved', 'blocked'],
        required=False
    )


class SetRoomStatusSerializer(serializers.Serializer):
    """Serializer for manual status override API"""
    status = serializers.ChoiceField(choices=[c[0] for c in RoomMap.AVAILABILITY_STATUS_CHOICES])
    reason = serializers.CharField(required=False, allow_blank=True, allow_null=True)



class AssignRoomSerializer(serializers.Serializer):
    """
    Serializer for assign-room action request body.
    """
    booking_id = serializers.IntegerField()
    hotel_id = serializers.IntegerField()
    pax_id = serializers.IntegerField()
    room_id = serializers.IntegerField()
    bed_no = serializers.CharField()
    checkin_date = serializers.DateField()
    checkout_date = serializers.DateField()

    def validate(self, data):
        # basic cross-field sanity
        if data['checkout_date'] < data['checkin_date']:
            raise serializers.ValidationError('checkout_date must be >= checkin_date')
        return data


# ==================== Hotel Operation Serializers ====================

class PaxListSerializer(serializers.Serializer):
    """
    Serializer for individual pax in the grouped hotel response.
    """
    pax_id = serializers.CharField(source='pax_id_str')
    pax_first_name = serializers.CharField()
    pax_last_name = serializers.CharField()
    contact_no = serializers.CharField(allow_blank=True, allow_null=True)
    room_no = serializers.CharField(allow_blank=True, allow_null=True)
    bed_no = serializers.CharField(allow_blank=True, allow_null=True)
    check_in_date = serializers.DateField()
    check_out_date = serializers.DateField()
    status = serializers.CharField()


class HotelGroupSerializer(serializers.Serializer):
    """
    Serializer for grouped hotel data in daily operations list.
    Groups pax by booking and hotel.
    """
    booking_id = serializers.CharField(source='booking_id_str')
    contact_no_of_family_head = serializers.CharField(allow_blank=True, allow_null=True)
    hotel_name = serializers.CharField()
    city = serializers.CharField()
    pax_list = PaxListSerializer(many=True)


class DailyHotelOperationResponseSerializer(serializers.Serializer):
    """
    Response serializer for daily hotel operations list.
    Format: {"date": "2025-10-17", "hotels": [...]}
    """
    date = serializers.DateField()
    hotels = HotelGroupSerializer(many=True)


class HotelOperationSerializer(serializers.ModelSerializer):
    """
    Full serializer for HotelOperation CRUD operations.
    """
    
    hotel_name_display = serializers.CharField(source='hotel.name', read_only=True)
    booking_reference = serializers.CharField(source='booking.booking_reference', read_only=True)
    pax_full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = HotelOperation
        fields = [
            'id',
            'booking',
            'booking_id_str',
            'booking_reference',
            'pax',
            'pax_id_str',
            'pax_first_name',
            'pax_last_name',
            'pax_full_name',
            'contact_no',
            'family_head_contact',
            'hotel',
            'hotel_name',
            'hotel_name_display',
            'city',
            'room',
            'room_no',
            'bed_no',
            'date',
            'check_in_date',
            'check_out_date',
            'status',
            'notes',
            'created_by',
            'updated_by',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'created_at',
            'updated_at',
            'hotel_name_display',
            'booking_reference',
            'pax_full_name'
        ]
    
    def get_pax_full_name(self, obj):
        """Return full name of pax"""
        return f"{obj.pax_first_name} {obj.pax_last_name}"
    
    def validate(self, data):
        """
        Validate HotelOperation data:
        - Check mandatory fields
        - Validate dates
        - Ensure pax belongs to booking
        """
        # Validate check-out is after check-in
        check_in = data.get('check_in_date')
        check_out = data.get('check_out_date')
        
        if check_in and check_out and check_out < check_in:
            raise serializers.ValidationError(
                "Check-out date must be after check-in date"
            )
        
        # Validate date is within check-in/check-out range
        operation_date = data.get('date')
        if operation_date and check_in and check_out:
            if not (check_in <= operation_date <= check_out):
                raise serializers.ValidationError(
                    f"Operation date {operation_date} must be between check-in ({check_in}) and check-out ({check_out})"
                )
        
        # Validate pax belongs to booking
        booking = data.get('booking')
        pax = data.get('pax')
        
        if booking and pax:
            if pax.booking_id != booking.id:
                raise serializers.ValidationError(
                    f"Pax {pax.id} ({pax.first_name} {pax.last_name}) does not belong to booking {booking.booking_number}"
                )
        
        # Validate room belongs to hotel
        hotel = data.get('hotel')
        room = data.get('room')
        
        if hotel and room:
            if room.hotel_id != hotel.id:
                raise serializers.ValidationError(
                    f"Room {room.room_no} does not belong to hotel {hotel.name}"
                )
        
        return data
    
    def create(self, validated_data):
        """
        Auto-populate denormalized fields on create.
        """
        # Set denormalized fields
        if 'booking' in validated_data and not validated_data.get('booking_id_str'):
            validated_data['booking_id_str'] = validated_data['booking'].booking_reference
        
        if 'pax' in validated_data:
            pax = validated_data['pax']
            if not validated_data.get('pax_id_str'):
                validated_data['pax_id_str'] = pax.pax_id
            if not validated_data.get('pax_first_name'):
                validated_data['pax_first_name'] = pax.first_name
            if not validated_data.get('pax_last_name'):
                validated_data['pax_last_name'] = pax.last_name
        
        if 'hotel' in validated_data:
            hotel = validated_data['hotel']
            if not validated_data.get('hotel_name'):
                validated_data['hotel_name'] = hotel.name
            if not validated_data.get('city') and hasattr(hotel, 'city') and hotel.city:
                validated_data['city'] = hotel.city.name
        
        if 'room' in validated_data and validated_data['room']:
            room = validated_data['room']
            if not validated_data.get('room_no'):
                validated_data['room_no'] = room.room_no
        
        return super().create(validated_data)


class HotelOperationListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing hotel operations.
    """
    
    hotel_name_display = serializers.CharField(source='hotel.name', read_only=True)
    pax_full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = HotelOperation
        fields = [
            'id',
            'booking_id_str',
            'pax_id_str',
            'pax_full_name',
            'hotel_name_display',
            'city',
            'room_no',
            'bed_no',
            'date',
            'check_in_date',
            'check_out_date',
            'status'
        ]
    
    def get_pax_full_name(self, obj):
        return f"{obj.pax_first_name} {obj.pax_last_name}"


class HotelStatusUpdateSerializer(serializers.Serializer):
    """
    Serializer for updating hotel operation status.
    Request format:
    {
        "booking_id": "BKG-101",
        "pax_id": "PAX001",
        "status": "checked_in",
        "updated_by": "EMP-12"
    }
    """
    
    booking_id = serializers.CharField(required=True)
    pax_id = serializers.CharField(required=True)
    status = serializers.ChoiceField(
        choices=['pending', 'checked_in', 'checked_out', 'canceled'],
        required=True
    )
    updated_by = serializers.CharField(required=True)
    
    def validate(self, data):
        """Validate that operation exists for this booking and pax"""
        booking_id = data.get('booking_id')
        pax_id = data.get('pax_id')
        
        # Find the operation
        operation = HotelOperation.objects.filter(
            booking_id_str=booking_id,
            pax_id_str=pax_id
        ).first()
        
        if not operation:
            raise serializers.ValidationError(
                f"Hotel operation not found for booking_id '{booking_id}' and pax_id '{pax_id}'"
            )
        
        # Store operation for use in view
        data['operation'] = operation
        return data


class BulkHotelOperationCreateSerializer(serializers.Serializer):
    """
    Serializer for bulk creating hotel operations from booking data.
    """
    
    booking_id = serializers.IntegerField(required=True)
    hotel_id = serializers.IntegerField(required=True)
    check_in_date = serializers.DateField(required=True)
    check_out_date = serializers.DateField(required=True)
    city = serializers.CharField(required=True)
    
    def validate_booking_id(self, value):
        """Validate booking exists"""
        if not Booking.objects.filter(id=value).exists():
            raise serializers.ValidationError(f"Booking with id {value} does not exist")
        return value
    
    def validate_hotel_id(self, value):
        """Validate hotel exists"""
        if not Hotels.objects.filter(id=value).exists():
            raise serializers.ValidationError(f"Hotel with id {value} does not exist")
        return value
    
    def validate(self, data):
        """Validate dates"""
        if data['check_out_date'] <= data['check_in_date']:
            raise serializers.ValidationError("Check-out date must be after check-in date")
        return data


# ===============================================
# TRANSPORT OPERATION SERIALIZERS
# ===============================================

class TransportOperationSerializer(serializers.ModelSerializer):
    """
    Serializer for TransportOperation model.
    Handles CRUD operations for daily transport jobs.
    
    POST Request - You only need to provide:
    - booking_id (integer)
    - pax_id (integer)
    - pickup_location
    - drop_location
    - vehicle_id (integer, optional)
    - driver_name (optional)
    - date
    - pickup_time (optional)
    
    The serializer auto-populates:
    - pax_id_str, pax_first_name, pax_last_name (from pax)
    - booking_id_str (from booking)
    - vehicle_name (from vehicle)
    - contact_no (from pax if available)
    """
    
    # Input fields (use these for POST/PUT)
    booking_id = serializers.IntegerField(write_only=True, required=True)
    pax_id = serializers.IntegerField(write_only=True, required=True)
    vehicle_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    # Read-only display fields
    booking_number = serializers.CharField(source='booking.booking_number', read_only=True)
    pax_full_name = serializers.SerializerMethodField()
    vehicle_display = serializers.CharField(source='vehicle.vehicle_name', read_only=True)
    
    class Meta:
        model = TransportOperation
        fields = [
            'id',
            # Input fields for POST/PUT
            'booking_id',
            'pax_id',
            'vehicle_id',
            # Display fields (read-only)
            'booking',
            'booking_number',
            'pax',
            'pax_id_str',
            'pax_first_name',
            'pax_last_name',
            'pax_full_name',
            'booking_id_str',
            'contact_no',
            'pickup_location',
            'drop_location',
            'vehicle',
            'vehicle_name',
            'vehicle_display',
            'driver_name',
            'driver_contact',
            'date',
            'pickup_time',
            'actual_pickup_time',
            'actual_drop_time',
            'status',
            'notes',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by'
        ]
        read_only_fields = [
            'booking',
            'pax',
            'vehicle',
            'pax_id_str',
            'pax_first_name', 
            'pax_last_name',
            'booking_id_str',
            'vehicle_name',
            'created_at', 
            'updated_at', 
            'booking_number', 
            'pax_full_name',
            'vehicle_display'
        ]
    
    def get_pax_full_name(self, obj):
        """Return full name of passenger"""
        return f"{obj.pax_first_name} {obj.pax_last_name}"
    
    def validate_booking_id(self, value):
        """Validate booking exists"""
        try:
            Booking.objects.get(id=value)
        except Booking.DoesNotExist:
            raise serializers.ValidationError(f"Booking with id {value} does not exist")
        return value
    
    def validate_pax_id(self, value):
        """Validate pax exists"""
        try:
            BookingPersonDetail.objects.get(id=value)
        except BookingPersonDetail.DoesNotExist:
            raise serializers.ValidationError(f"Passenger with id {value} does not exist")
        return value
    
    def validate_vehicle_id(self, value):
        """Validate vehicle exists (if provided)"""
        if value is not None:
            try:
                VehicleType.objects.get(id=value)
            except VehicleType.DoesNotExist:
                raise serializers.ValidationError(f"Vehicle with id {value} does not exist")
        return value
    
    def validate(self, data):
        """
        Cross-field validation:
        - Ensure pax belongs to booking
        """
        booking_id = data.get('booking_id')
        pax_id = data.get('pax_id')
        
        if booking_id and pax_id:
            try:
                booking = Booking.objects.get(id=booking_id)
                pax = BookingPersonDetail.objects.get(id=pax_id)
                
                # Check if pax belongs to the booking
                if pax.booking_id != booking.id:
                    raise serializers.ValidationError(
                        f"Passenger {pax_id} does not belong to booking {booking.booking_number}"
                    )
            except (Booking.DoesNotExist, BookingPersonDetail.DoesNotExist):
                pass  # Already validated in field validators
        
        return data
    
    def create(self, validated_data):
        """
        Auto-populate denormalized fields from related objects
        """
        # Extract write_only fields
        booking_id = validated_data.pop('booking_id')
        pax_id = validated_data.pop('pax_id')
        vehicle_id = validated_data.pop('vehicle_id', None)
        
        # Get related objects
        booking = Booking.objects.get(id=booking_id)
        pax = BookingPersonDetail.objects.get(id=pax_id)
        vehicle = VehicleType.objects.get(id=vehicle_id) if vehicle_id else None
        
        # Validate pax has required data
        if not pax.first_name or not pax.last_name:
            raise serializers.ValidationError({
                'pax_id': f"Passenger {pax_id} must have first_name and last_name in the booking records"
            })
        
        # Set foreign keys
        validated_data['booking'] = booking
        validated_data['pax'] = pax
        validated_data['vehicle'] = vehicle
        
        # Auto-populate denormalized fields
        validated_data['booking_id_str'] = booking.booking_number
        validated_data['pax_id_str'] = str(pax.id)
        validated_data['pax_first_name'] = pax.first_name
        validated_data['pax_last_name'] = pax.last_name
        
        # Set contact number if available
        if hasattr(pax, 'contact_number') and pax.contact_number:
            validated_data['contact_no'] = pax.contact_number
        
        # Set vehicle name if vehicle is provided
        if vehicle:
            validated_data['vehicle_name'] = vehicle.vehicle_name
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """
        Update operation, handle ID fields if provided
        """
        # Extract write_only fields if present
        booking_id = validated_data.pop('booking_id', None)
        pax_id = validated_data.pop('pax_id', None)
        vehicle_id = validated_data.pop('vehicle_id', None)
        
        # Update foreign keys if provided
        if booking_id:
            booking = Booking.objects.get(id=booking_id)
            validated_data['booking'] = booking
            validated_data['booking_id_str'] = booking.booking_number
        
        if pax_id:
            pax = BookingPersonDetail.objects.get(id=pax_id)
            validated_data['pax'] = pax
            validated_data['pax_id_str'] = str(pax.id)
            validated_data['pax_first_name'] = pax.first_name
            validated_data['pax_last_name'] = pax.last_name
            if hasattr(pax, 'contact_number') and pax.contact_number:
                validated_data['contact_no'] = pax.contact_number
        
        if vehicle_id is not None:
            if vehicle_id:
                vehicle = VehicleType.objects.get(id=vehicle_id)
                validated_data['vehicle'] = vehicle
                validated_data['vehicle_name'] = vehicle.vehicle_name
            else:
                validated_data['vehicle'] = None
                validated_data['vehicle_name'] = None
        
        return super().update(instance, validated_data)


class TransportOperationListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing transport operations.
    """
    
    pax_full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = TransportOperation
        fields = [
            'id',
            'booking_id_str',
            'pax_id_str',
            'pax_full_name',
            'pickup_location',
            'drop_location',
            'vehicle_name',
            'driver_name',
            'date',
            'pickup_time',
            'status'
        ]
    
    def get_pax_full_name(self, obj):
        return f"{obj.pax_first_name} {obj.pax_last_name}"


class TransportStatusUpdateSerializer(serializers.Serializer):
    """
    Serializer for updating transport operation status.
    """
    
    operation_id = serializers.IntegerField(required=True)
    status = serializers.ChoiceField(
        choices=['pending', 'departed', 'arrived', 'canceled'],
        required=True
    )
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_operation_id(self, value):
        """Validate that operation exists"""
        if not TransportOperation.objects.filter(id=value).exists():
            raise serializers.ValidationError(f"Transport operation with id {value} does not exist")
        return value


class BulkTransportOperationCreateSerializer(serializers.Serializer):
    """
    Serializer for bulk creating transport operations from booking data.
    """
    
    booking_id = serializers.IntegerField(required=True)
    date = serializers.DateField(required=True)
    pickup_location = serializers.CharField(required=True)
    drop_location = serializers.CharField(required=True)
    vehicle_id = serializers.IntegerField(required=False, allow_null=True)
    driver_name = serializers.CharField(required=False, allow_blank=True)
    driver_contact = serializers.CharField(required=False, allow_blank=True)
    pickup_time = serializers.TimeField(required=False, allow_null=True)
    
    def validate_booking_id(self, value):
        """Validate booking exists"""
        if not Booking.objects.filter(id=value).exists():
            raise serializers.ValidationError(f"Booking with id {value} does not exist")
        return value
    
    def validate_vehicle_id(self, value):
        """Validate vehicle exists (if provided)"""
        if value and not VehicleType.objects.filter(id=value).exists():
            raise serializers.ValidationError(f"Vehicle with id {value} does not exist")
        return value


# ===============================================
# PAX DETAILS SERIALIZER
# ===============================================

class PaxDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for passenger (pax) information.
    Used when clicking on a pax name to get full details.
    """
    
    booking_number = serializers.CharField(source='booking.booking_number', read_only=True)
    booking_date = serializers.DateTimeField(source='booking.date', read_only=True)
    booking_status = serializers.CharField(source='booking.status', read_only=True)
    
    # Get all hotel operations for this pax
    hotel_operations = serializers.SerializerMethodField()
    
    # Get all transport operations for this pax
    transport_operations = serializers.SerializerMethodField()
    
    class Meta:
        model = BookingPersonDetail
        fields = [
            'id',
            'booking',
            'booking_number',
            'booking_date',
            'booking_status',
            'first_name',
            'last_name',
            'contact_number',
            'passport_number',
            'country',
            'date_of_birth',
            'hotel_operations',
            'transport_operations'
        ]
    
    def get_hotel_operations(self, obj):
        """Get all hotel operations for this pax"""
        from .models import HotelOperation
        operations = HotelOperation.objects.filter(pax=obj).select_related('hotel')
        
        return [{
            'id': op.id,
            'hotel_name': op.hotel_name,
            'city': op.city,
            'room_no': op.room_no,
            'bed_no': op.bed_no,
            'check_in_date': op.check_in_date,
            'check_out_date': op.check_out_date,
            'status': op.status,
            'date': op.date
        } for op in operations]
    
    def get_transport_operations(self, obj):
        """Get all transport operations for this pax"""
        from .models import TransportOperation
        operations = TransportOperation.objects.filter(pax=obj).select_related('vehicle')
        
        return [{
            'id': op.id,
            'pickup_location': op.pickup_location,
            'drop_location': op.drop_location,
            'vehicle_name': op.vehicle_name,
            'driver_name': op.driver_name,
            'date': op.date,
            'pickup_time': op.pickup_time,
            'status': op.status
        } for op in operations]


# ===============================================
# FOOD OPERATION SERIALIZERS
# ===============================================

class FoodOperationSerializer(serializers.ModelSerializer):
    """
    Serializer for FoodOperation model.
    Handles CRUD operations for daily meal operations.
    
    POST Request - You only need to provide:
    - booking_id (integer)
    - pax_id (integer)
    - meal_type (breakfast/lunch/dinner/snack)
    - location (restaurant/hotel name)
    - date
    
    The serializer auto-populates:
    - pax_id_str, pax_first_name, pax_last_name (from pax)
    - booking_id_str (from booking)
    - contact_no (from pax if available)
    """
    
    # Input fields (use these for POST/PUT)
    booking_id = serializers.IntegerField(write_only=True, required=True)
    pax_id = serializers.IntegerField(write_only=True, required=True)
    
    # Read-only display fields
    booking_number = serializers.CharField(source='booking.booking_number', read_only=True)
    pax_full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = FoodOperation
        fields = [
            'id',
            # Input fields for POST/PUT
            'booking_id',
            'pax_id',
            # Display fields (read-only)
            'booking',
            'booking_number',
            'pax',
            'pax_id_str',
            'pax_first_name',
            'pax_last_name',
            'pax_full_name',
            'booking_id_str',
            'contact_no',
            'meal_type',
            'location',
            'city',
            'date',
            'meal_time',
            'actual_serve_time',
            'special_requirements',
            'status',
            'notes',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by'
        ]
        read_only_fields = [
            'booking',
            'pax',
            'pax_id_str',
            'pax_first_name',
            'pax_last_name',
            'booking_id_str',
            'actual_serve_time',
            'created_at',
            'updated_at',
            'booking_number',
            'pax_full_name'
        ]
    
    def get_pax_full_name(self, obj):
        """Return full name of passenger"""
        return f"{obj.pax_first_name} {obj.pax_last_name}"
    
    def validate_booking_id(self, value):
        """Validate booking exists"""
        try:
            Booking.objects.get(id=value)
        except Booking.DoesNotExist:
            raise serializers.ValidationError(f"Booking with id {value} does not exist")
        return value
    
    def validate_pax_id(self, value):
        """Validate pax exists"""
        try:
            BookingPersonDetail.objects.get(id=value)
        except BookingPersonDetail.DoesNotExist:
            raise serializers.ValidationError(f"Passenger with id {value} does not exist")
        return value
    
    def validate(self, data):
        """
        Cross-field validation:
        - Ensure pax belongs to booking
        """
        booking_id = data.get('booking_id')
        pax_id = data.get('pax_id')
        
        if booking_id and pax_id:
            try:
                booking = Booking.objects.get(id=booking_id)
                pax = BookingPersonDetail.objects.get(id=pax_id)
                
                # Check if pax belongs to the booking
                if pax.booking_id != booking.id:
                    raise serializers.ValidationError(
                        f"Passenger {pax_id} does not belong to booking {booking.booking_number}"
                    )
            except (Booking.DoesNotExist, BookingPersonDetail.DoesNotExist):
                pass  # Already validated in field validators
        
        return data
    
    def create(self, validated_data):
        """
        Auto-populate denormalized fields from related objects
        """
        # Extract write_only fields
        booking_id = validated_data.pop('booking_id')
        pax_id = validated_data.pop('pax_id')
        
        # Get related objects
        booking = Booking.objects.get(id=booking_id)
        pax = BookingPersonDetail.objects.get(id=pax_id)
        
        # Validate pax has required data
        if not pax.first_name or not pax.last_name:
            raise serializers.ValidationError({
                'pax_id': f"Passenger {pax_id} must have first_name and last_name in the booking records"
            })
        
        # Set foreign keys
        validated_data['booking'] = booking
        validated_data['pax'] = pax
        
        # Auto-populate denormalized fields
        validated_data['booking_id_str'] = booking.booking_number
        validated_data['pax_id_str'] = str(pax.id)
        validated_data['pax_first_name'] = pax.first_name
        validated_data['pax_last_name'] = pax.last_name
        
        # Set contact number if available
        if hasattr(pax, 'contact_number') and pax.contact_number:
            validated_data['contact_no'] = pax.contact_number
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """
        Update operation, handle ID fields if provided
        """
        # Extract write_only fields if present
        booking_id = validated_data.pop('booking_id', None)
        pax_id = validated_data.pop('pax_id', None)
        
        # Update foreign keys if provided
        if booking_id:
            booking = Booking.objects.get(id=booking_id)
            validated_data['booking'] = booking
            validated_data['booking_id_str'] = booking.booking_number
        
        if pax_id:
            pax = BookingPersonDetail.objects.get(id=pax_id)
            validated_data['pax'] = pax
            validated_data['pax_id_str'] = str(pax.id)
            validated_data['pax_first_name'] = pax.first_name
            validated_data['pax_last_name'] = pax.last_name
            if hasattr(pax, 'contact_number') and pax.contact_number:
                validated_data['contact_no'] = pax.contact_number
        
        return super().update(instance, validated_data)


class FoodOperationListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing food operations.
    """
    
    pax_full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = FoodOperation
        fields = [
            'id',
            'booking_id_str',
            'pax_id_str',
            'pax_full_name',
            'meal_type',
            'location',
            'city',
            'date',
            'meal_time',
            'status'
        ]
    
    def get_pax_full_name(self, obj):
        return f"{obj.pax_first_name} {obj.pax_last_name}"


class FoodStatusUpdateSerializer(serializers.Serializer):
    """
    Serializer for updating food operation status.
    Request format:
    {
        "booking_id": "BKG-101",
        "pax_id": "PAX001",
        "meal_type": "breakfast",
        "status": "served",
        "updated_by": "EMP-12"
    }
    """
    
    booking_id = serializers.CharField(required=True)
    pax_id = serializers.CharField(required=True)
    meal_type = serializers.ChoiceField(
        choices=['breakfast', 'lunch', 'dinner', 'snack'],
        required=True
    )
    status = serializers.ChoiceField(
        choices=['pending', 'served', 'canceled'],
        required=True
    )
    updated_by = serializers.CharField(required=True)
    
    def validate(self, data):
        """Validate that operation exists for this booking, pax and meal_type"""
        booking_id = data.get('booking_id')
        pax_id = data.get('pax_id')
        meal_type = data.get('meal_type')
        
        # Find the operation
        from .models import FoodOperation
        operation = FoodOperation.objects.filter(
            booking_id_str=booking_id,
            pax_id_str=pax_id,
            meal_type=meal_type
        ).first()
        
        if not operation:
            raise serializers.ValidationError(
                f"Food operation not found for booking_id '{booking_id}', pax_id '{pax_id}', meal_type '{meal_type}'"
            )
        
        # Store operation for use in view
        data['operation'] = operation
        return data


class BulkFoodOperationCreateSerializer(serializers.Serializer):
    """
    Serializer for bulk creating food operations from booking data.
    Creates operations for all pax in a booking for a specific meal.
    """
    
    booking_id = serializers.IntegerField(required=True)
    meal_type = serializers.ChoiceField(
        choices=['breakfast', 'lunch', 'dinner', 'snack'],
        required=True
    )
    location = serializers.CharField(required=True)
    city = serializers.CharField(required=False, allow_blank=True)
    date = serializers.DateField(required=True)
    meal_time = serializers.TimeField(required=False, allow_null=True)
    special_requirements = serializers.CharField(required=False, allow_blank=True)
    
    def validate_booking_id(self, value):
        """Validate booking exists"""
        if not Booking.objects.filter(id=value).exists():
            raise serializers.ValidationError(f"Booking with id {value} does not exist")
        return value


# ===============================================
# AIRPORT OPERATION SERIALIZERS
# ===============================================

class AirportOperationSerializer(serializers.ModelSerializer):
    """
    Serializer for AirportOperation model.
    Handles CRUD operations for airport pickup/drop operations.
    
    POST Request - You only need to provide:
    - booking_id (integer)
    - pax_id (integer)
    - transfer_type (pickup/drop)
    - flight_number (string)
    - flight_time (HH:MM:SS)
    - date (YYYY-MM-DD)
    - pickup_point (string)
    - drop_point (string)
    
    The serializer auto-populates:
    - pax_id_str, pax_first_name, pax_last_name (from pax)
    - booking_id_str (from booking)
    - contact_no (from pax if available)
    """
    
    # Input fields (use these for POST/PUT)
    booking_id = serializers.IntegerField(write_only=True, required=True)
    pax_id = serializers.IntegerField(write_only=True, required=True)
    
    # Read-only display fields
    booking_number = serializers.CharField(source='booking.booking_number', read_only=True)
    pax_full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AirportOperation
        fields = [
            'id',
            # Input fields for POST/PUT
            'booking_id',
            'pax_id',
            # Display fields (read-only)
            'booking',
            'booking_number',
            'pax',
            'pax_id_str',
            'pax_first_name',
            'pax_last_name',
            'pax_full_name',
            'booking_id_str',
            'contact_no',
            'transfer_type',
            'flight_number',
            'flight_time',
            'date',
            'pickup_point',
            'drop_point',
            'status',
            'actual_pickup_time',
            'actual_arrival_time',
            'notes',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by'
        ]
        read_only_fields = [
            'booking',
            'pax',
            'pax_id_str',
            'pax_first_name',
            'pax_last_name',
            'booking_id_str',
            'actual_pickup_time',
            'actual_arrival_time',
            'created_at',
            'updated_at',
            'booking_number',
            'pax_full_name'
        ]
    
    def get_pax_full_name(self, obj):
        """Return full name of passenger"""
        return f"{obj.pax_first_name} {obj.pax_last_name}"
    
    def validate_booking_id(self, value):
        """Validate booking exists"""
        try:
            Booking.objects.get(id=value)
        except Booking.DoesNotExist:
            raise serializers.ValidationError(f"Booking with id {value} does not exist")
        return value
    
    def validate_pax_id(self, value):
        """Validate pax exists"""
        try:
            BookingPersonDetail.objects.get(id=value)
        except BookingPersonDetail.DoesNotExist:
            raise serializers.ValidationError(f"Passenger with id {value} does not exist")
        return value
    
    def validate(self, data):
        """
        Cross-field validation:
        - Ensure pax belongs to booking
        """
        booking_id = data.get('booking_id')
        pax_id = data.get('pax_id')
        
        if booking_id and pax_id:
            try:
                booking = Booking.objects.get(id=booking_id)
                pax = BookingPersonDetail.objects.get(id=pax_id)
                
                # Check if pax belongs to the booking
                if pax.booking_id != booking.id:
                    raise serializers.ValidationError(
                        f"Passenger {pax_id} does not belong to booking {booking.booking_number}"
                    )
            except (Booking.DoesNotExist, BookingPersonDetail.DoesNotExist):
                pass  # Already validated in field validators
        
        return data
    
    def create(self, validated_data):
        """
        Auto-populate denormalized fields from related objects
        """
        # Extract write_only fields
        booking_id = validated_data.pop('booking_id')
        pax_id = validated_data.pop('pax_id')
        
        # Get related objects
        booking = Booking.objects.get(id=booking_id)
        pax = BookingPersonDetail.objects.get(id=pax_id)
        
        # Validate pax has required data
        if not pax.first_name or not pax.last_name:
            raise serializers.ValidationError({
                'pax_id': f"Passenger {pax_id} must have first_name and last_name in the booking records"
            })
        
        # Set foreign keys
        validated_data['booking'] = booking
        validated_data['pax'] = pax
        
        # Auto-populate denormalized fields
        validated_data['booking_id_str'] = booking.booking_number
        validated_data['pax_id_str'] = str(pax.id)
        validated_data['pax_first_name'] = pax.first_name
        validated_data['pax_last_name'] = pax.last_name
        
        # Set contact number if available
        if hasattr(pax, 'contact_number') and pax.contact_number:
            validated_data['contact_no'] = pax.contact_number
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """
        Update operation, handle ID fields if provided
        """
        # Extract write_only fields if present
        booking_id = validated_data.pop('booking_id', None)
        pax_id = validated_data.pop('pax_id', None)
        
        # Update foreign keys if provided
        if booking_id:
            booking = Booking.objects.get(id=booking_id)
            validated_data['booking'] = booking
            validated_data['booking_id_str'] = booking.booking_number
        
        if pax_id:
            pax = BookingPersonDetail.objects.get(id=pax_id)
            validated_data['pax'] = pax
            validated_data['pax_id_str'] = str(pax.id)
            validated_data['pax_first_name'] = pax.first_name
            validated_data['pax_last_name'] = pax.last_name
            if hasattr(pax, 'contact_number') and pax.contact_number:
                validated_data['contact_no'] = pax.contact_number
        
        return super().update(instance, validated_data)


class AirportOperationListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing airport operations.
    """
    
    pax_full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AirportOperation
        fields = [
            'id',
            'booking_id_str',
            'pax_id_str',
            'pax_full_name',
            'transfer_type',
            'flight_number',
            'flight_time',
            'date',
            'pickup_point',
            'drop_point',
            'status'
        ]
    
    def get_pax_full_name(self, obj):
        return f"{obj.pax_first_name} {obj.pax_last_name}"


class AirportStatusUpdateSerializer(serializers.Serializer):
    """
    Serializer for updating airport operation status.
    Request format (YOUR EXACT FORMAT):
    {
        "booking_id": "BKG-101",
        "pax_id": "PAX001",
        "status": "departed",
        "updated_by": "EMP-12"
    }
    """
    
    booking_id = serializers.CharField(required=True)
    pax_id = serializers.CharField(required=True)
    status = serializers.ChoiceField(
        choices=['waiting', 'departed', 'arrived', 'not_picked'],
        required=True
    )
    updated_by = serializers.CharField(required=True)
    
    def validate(self, data):
        """Validate that operation exists for this booking and pax"""
        booking_id = data.get('booking_id')
        pax_id = data.get('pax_id')
        
        # Find the operation
        from .models import AirportOperation
        operation = AirportOperation.objects.filter(
            booking_id_str=booking_id,
            pax_id_str=pax_id
        ).first()
        
        if not operation:
            raise serializers.ValidationError(
                f"Airport operation not found for booking_id '{booking_id}', pax_id '{pax_id}'"
            )
        
        # Store operation for use in view
        data['operation'] = operation
        return data


class BulkAirportOperationCreateSerializer(serializers.Serializer):
    """
    Serializer for bulk creating airport operations from booking data.
    Creates operations for all pax in a booking.
    """
    
    booking_id = serializers.IntegerField(required=True)
    transfer_type = serializers.ChoiceField(
        choices=['pickup', 'drop'],
        required=True
    )
    flight_number = serializers.CharField(required=True)
    flight_time = serializers.TimeField(required=True)
    date = serializers.DateField(required=True)
    pickup_point = serializers.CharField(required=True)
    drop_point = serializers.CharField(required=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_booking_id(self, value):
        """Validate booking exists"""
        if not Booking.objects.filter(id=value).exists():
            raise serializers.ValidationError(f"Booking with id {value} does not exist")
        return value


# ============================================
# ZIYARAT OPERATION SERIALIZERS
# ============================================

class ZiyaratOperationSerializer(serializers.ModelSerializer):
    """
    Full serializer for Ziyarat Operation CRUD operations.
    booking_id and pax_id are write-only, denormalized fields are read-only.
    """
    booking_id = serializers.IntegerField(write_only=True, help_text="Booking ID")
    pax_id = serializers.IntegerField(write_only=True, help_text="Passenger ID")
    
    booking_number = serializers.CharField(source='booking_id_str', read_only=True)
    
    class Meta:
        model = ZiyaratOperation
        fields = [
            'id', 'booking_id', 'pax_id', 'booking_number', 'pax_id_str',
            'pax_first_name', 'pax_last_name', 'pax_full_name', 'contact_no',
            'location', 'date', 'pickup_time', 'guide_name',
            'status', 'actual_start_time', 'actual_completion_time',
            'notes', 'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = [
            'id', 'booking_number', 'pax_id_str', 'pax_first_name', 'pax_last_name',
            'pax_full_name', 'contact_no', 'actual_start_time', 'actual_completion_time',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
    
    def validate_booking_id(self, value):
        """Validate booking exists"""
        if not Booking.objects.filter(id=value).exists():
            raise serializers.ValidationError(f"Booking with id {value} does not exist")
        return value
    
    def validate_pax_id(self, value):
        """Validate passenger exists"""
        if not BookingPersonDetail.objects.filter(id=value).exists():
            raise serializers.ValidationError(f"Passenger with id {value} does not exist")
        return value
    
    def validate(self, attrs):
        """Validate pax belongs to booking"""
        if 'booking_id' in attrs and 'pax_id' in attrs:
            booking_id = attrs['booking_id']
            pax_id = attrs['pax_id']
            
            pax = BookingPersonDetail.objects.filter(id=pax_id, booking_id=booking_id).first()
            if not pax:
                raise serializers.ValidationError(
                    f"Passenger {pax_id} does not belong to booking {booking_id}"
                )
        return attrs
    
    def create(self, validated_data):
        """Create with FK assignments"""
        booking_id = validated_data.pop('booking_id')
        pax_id = validated_data.pop('pax_id')
        
        validated_data['booking_id'] = booking_id
        validated_data['pax_id'] = pax_id
        
        return super().create(validated_data)


class ZiyaratOperationListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for list views.
    """
    booking_number = serializers.CharField(source='booking_id_str', read_only=True)
    
    class Meta:
        model = ZiyaratOperation
        fields = [
            'id', 'booking_number', 'pax_id_str', 'pax_first_name', 'pax_last_name',
            'pax_full_name', 'contact_no', 'location', 'date', 'pickup_time',
            'guide_name', 'status'
        ]


class ZiyaratStatusUpdateSerializer(serializers.Serializer):
    """
    Serializer for updating ziyarat status.
    User's exact format: booking_id + pax_id + status + updated_by
    """
    booking_id = serializers.CharField(max_length=50, help_text="Booking number (e.g., BKG-101)")
    pax_id = serializers.CharField(max_length=20, help_text="Passenger ID (e.g., PAX001)")
    status = serializers.ChoiceField(
        choices=['pending', 'started', 'completed', 'canceled', 'not_picked'],
        help_text="New status"
    )
    updated_by = serializers.CharField(max_length=50, help_text="Employee ID (e.g., EMP-12)")
    
    def validate_booking_id(self, value):
        """Validate booking exists by booking_number"""
        if not Booking.objects.filter(booking_number=value).exists():
            raise serializers.ValidationError(f"Booking with number {value} does not exist")
        return value
    
    def validate(self, attrs):
        """Validate operation exists"""
        booking_id = attrs['booking_id']
        pax_id = attrs['pax_id']
        
        operation = ZiyaratOperation.objects.filter(
            booking_id_str=booking_id,
            pax_id_str=pax_id
        ).first()
        
        if not operation:
            raise serializers.ValidationError(
                f"No ziyarat operation found for booking {booking_id} and pax {pax_id}"
            )
        
        return attrs


class BulkZiyaratOperationCreateSerializer(serializers.Serializer):
    """
    Serializer for bulk creating ziyarat operations for all passengers in a booking.
    """
    booking_id = serializers.IntegerField(help_text="Booking ID")
    location = serializers.CharField(max_length=200, help_text="Ziyarat location")
    date = serializers.DateField(help_text="Date of ziyarat")
    pickup_time = serializers.TimeField(help_text="Pickup time")
    guide_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    created_by = serializers.IntegerField(required=False, help_text="User ID creating the operations")
    
    def validate_booking_id(self, value):
        """Validate booking exists"""
        if not Booking.objects.filter(id=value).exists():
            raise serializers.ValidationError(f"Booking with id {value} does not exist")
        return value

