"""
Flight API Serializers
"""
from rest_framework import serializers


class FlightSearchSerializer(serializers.Serializer):
    """Serializer for flight search request"""
    origin = serializers.CharField(max_length=3, required=True, help_text="3-letter IATA airport code")
    destination = serializers.CharField(max_length=3, required=True, help_text="3-letter IATA airport code")
    departureDate = serializers.CharField(required=True, help_text="Format: DD-MM-YYYY")
    adults = serializers.IntegerField(default=1, min_value=1, max_value=9)
    children = serializers.IntegerField(default=0, min_value=0, max_value=8)
    infants = serializers.IntegerField(default=0, min_value=0, max_value=9)
    cabinClass = serializers.ChoiceField(
        choices=['Y', 'C', 'F', 'W', 'M'],
        default='Y',
        help_text="Y=Economy, C=Business, F=First, W=Premium Economy, M=Economy Premium"
    )
    nonStop = serializers.BooleanField(default=False)
    preferredAirlines = serializers.ListField(
        child=serializers.CharField(max_length=2),
        required=False,
        default=list,
        help_text="List of 2-letter airline codes"
    )
    maxResults = serializers.IntegerField(default=50, min_value=1, max_value=100)


class FareSerializer(serializers.Serializer):
    """Serializer for flight fare"""
    baseFare = serializers.FloatField()
    tax = serializers.FloatField()
    total = serializers.FloatField()
    currency = serializers.CharField()


class FlightSegmentSerializer(serializers.Serializer):
    """Serializer for flight segment"""
    departureDate = serializers.CharField()
    departureTime = serializers.CharField()
    arrivalDate = serializers.CharField()
    arrivalTime = serializers.CharField()
    origin = serializers.CharField()
    destination = serializers.CharField()
    airline = serializers.CharField()
    flightNumber = serializers.CharField()
    equipment = serializers.CharField(required=False)


class FlightSerializer(serializers.Serializer):
    """Serializer for flight result"""
    id = serializers.CharField()
    refundable = serializers.BooleanField()
    instantTicketing = serializers.BooleanField()
    bookOnHold = serializers.BooleanField()
    fare = FareSerializer()
    segments = serializers.ListField()
    supplierCode = serializers.IntegerField(required=False)
    brandedFareSupported = serializers.BooleanField()


class FlightSearchResponseSerializer(serializers.Serializer):
    """Serializer for flight search response"""
    flights = FlightSerializer(many=True)
    total_count = serializers.IntegerField()
    request_count = serializers.IntegerField()
