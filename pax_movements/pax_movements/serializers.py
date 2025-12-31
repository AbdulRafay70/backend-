from rest_framework import serializers
from .models import (
    PaxMovement, AirportTransfer, AirportTransferPax,
    Transport, TransportPax, Ziyarat, ZiyaratPax,
    FoodService, FoodServicePax
)
from booking.models import BookingPersonDetail, Booking
from packages.models import City
from tickets.models import Hotels
from django.contrib.auth.models import User
from datetime import datetime, time


# ===== Helper Functions =====

def parse_time_field(value):
    """
    Parse time from various formats and return a time object.
    Accepts: HH:MM, HH:MM:SS, or time object
    """
    if isinstance(value, time):
        return value
    
    if isinstance(value, str):
        # Try different time formats
        for fmt in ['%H:%M:%S', '%H:%M', '%I:%M %p', '%I:%M:%S %p']:
            try:
                parsed = datetime.strptime(value, fmt).time()
                return parsed
            except ValueError:
                continue
        
        # If all formats fail, raise a friendly error
        raise serializers.ValidationError(
            "Please enter time in format HH:MM (e.g., 14:30) or HH:MM:SS (e.g., 14:30:00)"
        )
    
    return value


# ===== Passenger Information Serializers =====

class PersonDetailSerializer(serializers.ModelSerializer):
    """Basic passenger information"""
    contact_no = serializers.CharField(source='contact_number', read_only=True)
    
    class Meta:
        model = BookingPersonDetail
        fields = ['id', 'first_name', 'last_name', 'passport_number', 'contact_no', 'contact_number']


# ===== Pax Movement Serializers =====

class PaxMovementSerializer(serializers.ModelSerializer):
    person_details = PersonDetailSerializer(source='person', read_only=True)
    booking_number = serializers.CharField(source='booking.booking_number', read_only=True)
    current_city_name = serializers.CharField(source='current_city.name', read_only=True, allow_null=True)
    verified_by_name = serializers.CharField(source='verified_by.username', read_only=True, allow_null=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True, allow_null=True)
    agent_name = serializers.CharField(source='agent.username', read_only=True, allow_null=True)
    
    class Meta:
        model = PaxMovement
        fields = '__all__'
        read_only_fields = ['pax_id', 'created_at', 'updated_at', 'shirka_report_date']
    
    def validate_current_city(self, value):
        """Don't allow invalid city IDs"""
        if value and value.id == 0:
            return None
        return value
    
    def validate_updated_by(self, value):
        """Don't allow invalid user IDs"""
        if value and value.id == 0:
            return None
        return value


class PaxMovementUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating pax movement status and flight details"""
    
    class Meta:
        model = PaxMovement
        fields = [
            'status', 'current_city', 'entry_date', 'exit_date',
            'flight_number_to_ksa', 'flight_date_to_ksa',
            'flight_number_from_ksa', 'flight_date_from_ksa',
            'departure_airport', 'arrival_airport',
            'passport_number', 'passport_expiry',
            'reported_to_shirka', 'updated_by'
        ]
    
    def validate_current_city(self, value):
        """Don't allow invalid city IDs"""
        if value and value.id == 0:
            return None
        return value
    
    def validate_updated_by(self, value):
        """Don't allow invalid user IDs"""
        if value and value.id == 0:
            return None
        return value


class PaxMovementVerifyExitSerializer(serializers.Serializer):
    """Serializer for verifying passenger exit"""
    exit_verification = serializers.ChoiceField(choices=['verified', 'not_verified'])
    remarks = serializers.CharField(required=False, allow_blank=True)


class PaxMovementSummarySerializer(serializers.Serializer):
    """Summary statistics for pax movements"""
    total_pax = serializers.IntegerField()
    in_pakistan = serializers.IntegerField()
    entered_ksa = serializers.IntegerField()
    in_ksa = serializers.IntegerField()
    exited_ksa = serializers.IntegerField()
    verified_exits = serializers.IntegerField()
    not_verified_exits = serializers.IntegerField()
    by_city = serializers.DictField()


# ===== Airport Transfer Serializers =====

class AirportTransferPaxSerializer(serializers.ModelSerializer):
    pax_id = serializers.CharField(source='pax_movement.pax_id', read_only=True)
    first_name = serializers.CharField(source='person.first_name', read_only=True)
    last_name = serializers.CharField(source='person.last_name', read_only=True)
    contact_no = serializers.CharField(source='person.contact_number', read_only=True)
    
    class Meta:
        model = AirportTransferPax
        fields = ['id', 'pax_id', 'first_name', 'last_name', 'contact_no', 'status', 'updated_at']


class AirportTransferSerializer(serializers.ModelSerializer):
    booking_id = serializers.CharField(source='booking.booking_number', read_only=True)
    pax_list = AirportTransferPaxSerializer(source='passengers', many=True, read_only=True)
    
    class Meta:
        model = AirportTransfer
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_booking(self, value):
        """Don't allow invalid booking IDs"""
        if value and value.id == 0:
            raise serializers.ValidationError("Please select a valid booking.")
        return value
    
    def validate_flight_time(self, value):
        """Parse time from various formats"""
        return parse_time_field(value)
    
    def validate_updated_by(self, value):
        """Don't allow invalid user IDs"""
        if value and value.id == 0:
            return None
        return value
    
    def to_internal_value(self, data):
        """Clean up invalid IDs before validation"""
        # Remove or convert invalid IDs
        if 'booking' in data and (data['booking'] == 0 or data['booking'] == '0'):
            data = data.copy()
            data.pop('booking', None)
        
        if 'updated_by' in data and (data['updated_by'] == 0 or data['updated_by'] == '0'):
            data = data.copy()
            data['updated_by'] = None
        
        return super().to_internal_value(data)


class AirportTransferUpdateSerializer(serializers.Serializer):
    """Update individual pax status in airport transfer"""
    booking_id = serializers.CharField()
    pax_id = serializers.CharField()
    status = serializers.ChoiceField(choices=['waiting', 'departed', 'arrived', 'not_picked'])
    updated_by = serializers.IntegerField()


# ===== Transport Serializers =====

class TransportPaxSerializer(serializers.ModelSerializer):
    pax_id = serializers.CharField(source='pax_movement.pax_id', read_only=True)
    first_name = serializers.CharField(source='person.first_name', read_only=True)
    last_name = serializers.CharField(source='person.last_name', read_only=True)
    contact_no = serializers.CharField(source='person.contact_number', read_only=True)
    
    class Meta:
        model = TransportPax
        fields = ['id', 'pax_id', 'first_name', 'last_name', 'contact_no', 'status', 'updated_at']


class TransportSerializer(serializers.ModelSerializer):
    booking_id = serializers.CharField(source='booking.booking_number', read_only=True)
    pax_list = TransportPaxSerializer(source='passengers', many=True, read_only=True)
    pickup = serializers.CharField(source='pickup_location', read_only=True)
    drop = serializers.CharField(source='drop_location', read_only=True)
    vehicle = serializers.CharField(source='vehicle_type', read_only=True)
    
    class Meta:
        model = Transport
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_booking(self, value):
        """Don't allow invalid booking IDs"""
        if value and value.id == 0:
            raise serializers.ValidationError("Please select a valid booking.")
        return value
    
    def validate_scheduled_time(self, value):
        """Parse time from various formats"""
        return parse_time_field(value)
    
    def validate_from_city(self, value):
        """Don't allow invalid from_city IDs"""
        if value and value.id == 0:
            return None
        return value
    
    def validate_to_city(self, value):
        """Don't allow invalid to_city IDs"""
        if value and value.id == 0:
            return None
        return value
    
    def validate_updated_by(self, value):
        """Don't allow invalid user IDs"""
        if value and value.id == 0:
            return None
        return value
    
    def to_internal_value(self, data):
        """Clean up invalid IDs before validation"""
        # Remove or convert invalid IDs
        if 'booking' in data and (data['booking'] == 0 or data['booking'] == '0'):
            data = data.copy()
            data.pop('booking', None)
        
        if 'from_city' in data and (data['from_city'] == 0 or data['from_city'] == '0'):
            data = data.copy()
            data['from_city'] = None
        
        if 'to_city' in data and (data['to_city'] == 0 or data['to_city'] == '0'):
            data = data.copy()
            data['to_city'] = None
        
        if 'updated_by' in data and (data['updated_by'] == 0 or data['updated_by'] == '0'):
            data = data.copy()
            data['updated_by'] = None
        
        return super().to_internal_value(data)


class TransportUpdateSerializer(serializers.Serializer):
    """Update individual pax status in transport"""
    booking_id = serializers.CharField()
    pax_id = serializers.CharField()
    status = serializers.ChoiceField(choices=['pending', 'departed', 'arrived', 'not_picked'])
    updated_by = serializers.IntegerField()


# ===== Ziyarat Serializers =====

class ZiyaratPaxSerializer(serializers.ModelSerializer):
    pax_id = serializers.CharField(source='pax_movement.pax_id', read_only=True)
    first_name = serializers.CharField(source='person.first_name', read_only=True)
    last_name = serializers.CharField(source='person.last_name', read_only=True)
    contact_no = serializers.CharField(source='person.contact_number', read_only=True)
    
    class Meta:
        model = ZiyaratPax
        fields = ['id', 'pax_id', 'first_name', 'last_name', 'contact_no', 'status', 'updated_at']


class ZiyaratSerializer(serializers.ModelSerializer):
    booking_id = serializers.CharField(source='booking.booking_number', read_only=True)
    pax_list = ZiyaratPaxSerializer(source='passengers', many=True, read_only=True)
    
    class Meta:
        model = Ziyarat
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_booking(self, value):
        """Don't allow invalid booking IDs"""
        if value and value.id == 0:
            raise serializers.ValidationError("Please select a valid booking.")
        return value
    
    def validate_pickup_time(self, value):
        """Parse time from various formats"""
        return parse_time_field(value)
    
    def validate_expected_return_time(self, value):
        """Parse time from various formats"""
        if value:  # This field is optional
            return parse_time_field(value)
        return value
    
    def validate_city(self, value):
        """Don't allow invalid city IDs"""
        if value and value.id == 0:
            return None
        return value
    
    def validate_updated_by(self, value):
        """Don't allow invalid user IDs"""
        if value and value.id == 0:
            return None
        return value
    
    def to_internal_value(self, data):
        """Clean up invalid IDs before validation"""
        # Remove or convert invalid IDs
        if 'booking' in data and (data['booking'] == 0 or data['booking'] == '0'):
            data = data.copy()
            data.pop('booking', None)
        
        if 'city' in data and (data['city'] == 0 or data['city'] == '0'):
            data = data.copy()
            data['city'] = None
        
        if 'updated_by' in data and (data['updated_by'] == 0 or data['updated_by'] == '0'):
            data = data.copy()
            data['updated_by'] = None
        
        return super().to_internal_value(data)


class ZiyaratUpdateSerializer(serializers.Serializer):
    """Update individual pax status in ziyarat"""
    booking_id = serializers.CharField()
    pax_id = serializers.CharField()
    status = serializers.ChoiceField(choices=['pending', 'started', 'completed', 'cancelled', 'not_picked'])
    updated_by = serializers.IntegerField()


# ===== Food Service Serializers =====

class FoodServicePaxSerializer(serializers.ModelSerializer):
    pax_id = serializers.CharField(source='pax_movement.pax_id', read_only=True)
    first_name = serializers.CharField(source='person.first_name', read_only=True)
    last_name = serializers.CharField(source='person.last_name', read_only=True)
    contact_no = serializers.CharField(source='person.contact_number', read_only=True)
    
    class Meta:
        model = FoodServicePax
        fields = ['id', 'pax_id', 'first_name', 'last_name', 'contact_no', 'status', 'updated_at']


class FoodServiceSerializer(serializers.ModelSerializer):
    booking_id = serializers.CharField(source='booking.booking_number', read_only=True)
    pax_list = FoodServicePaxSerializer(source='passengers', many=True, read_only=True)
    time = serializers.TimeField(source='service_time', read_only=True)
    
    class Meta:
        model = FoodService
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_booking(self, value):
        """Don't allow invalid booking IDs"""
        if value and value.id == 0:
            raise serializers.ValidationError("Please select a valid booking.")
        return value
    
    def validate_service_time(self, value):
        """Parse time from various formats"""
        return parse_time_field(value)
    
    def validate_city(self, value):
        """Don't allow invalid city IDs"""
        if value and value.id == 0:
            return None
        return value
    
    def validate_hotel(self, value):
        """Don't allow invalid hotel IDs"""
        if value and value.id == 0:
            return None
        return value
    
    def validate_updated_by(self, value):
        """Don't allow invalid user IDs"""
        if value and value.id == 0:
            return None
        return value
    
    def to_internal_value(self, data):
        """Clean up invalid IDs before validation"""
        # Remove or convert invalid IDs
        if 'booking' in data and (data['booking'] == 0 or data['booking'] == '0'):
            data = data.copy()
            data.pop('booking', None)
        
        if 'city' in data and (data['city'] == 0 or data['city'] == '0'):
            data = data.copy()
            data['city'] = None
        
        if 'hotel' in data and (data['hotel'] == 0 or data['hotel'] == '0'):
            data = data.copy()
            data['hotel'] = None
        
        if 'updated_by' in data and (data['updated_by'] == 0 or data['updated_by'] == '0'):
            data = data.copy()
            data['updated_by'] = None
        
        return super().to_internal_value(data)


class FoodServiceUpdateSerializer(serializers.Serializer):
    """Update individual pax status in food service"""
    booking_id = serializers.CharField()
    pax_id = serializers.CharField()
    status = serializers.ChoiceField(choices=['pending', 'served', 'cancelled'])
    updated_by = serializers.IntegerField()


# ===== Pax Full Details Serializer =====

class PaxFullDetailsSerializer(serializers.Serializer):
    """Comprehensive passenger details across all modules"""
    pax_id = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    passport_no = serializers.CharField()
    booking_id = serializers.CharField()
    flight = serializers.DictField()
    hotel = serializers.ListField()
    transport = serializers.ListField()
    ziyarats = serializers.ListField()
    food = serializers.ListField()
