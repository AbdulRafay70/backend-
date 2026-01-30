"""
Flight API Serializers
"""
from rest_framework import serializers
from .models import FlightBooking


class FlightSearchSerializer(serializers.Serializer):
    """Serializer for flight search request"""
    origin = serializers.CharField(max_length=3, required=False, allow_blank=True, help_text="3-letter IATA airport code")
    destination = serializers.CharField(max_length=3, required=False, allow_blank=True, help_text="3-letter IATA airport code")
    departureDate = serializers.CharField(required=False, allow_blank=True, help_text="Format: DD-MM-YYYY")
    returnDate = serializers.CharField(required=False, allow_blank=True, help_text="Format: DD-MM-YYYY (required for round-trip)")
    tripType = serializers.ChoiceField(
        choices=['oneway', 'return', 'multicity'],
        default='oneway',
        help_text="Trip type: oneway, return, or multicity"
    )
    # For multicity searches, the frontend can supply a `segments` array
    # each item must include `origin`, `destination` and `departureDate`.
    # This field is optional for oneway/return searches to maintain
    # backward compatibility with existing single-leg payloads.
    segments = None

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

    def validate(self, attrs):
        trip = attrs.get('tripType') or attrs.get('trip_type') or 'oneway'
        # For non-multicity searches, ensure top-level origin/destination/departureDate exist
        if trip != 'multicity':
            origin = attrs.get('origin') or self.initial_data.get('origin')
            destination = attrs.get('destination') or self.initial_data.get('destination')
            departure = attrs.get('departureDate') or self.initial_data.get('departureDate')

            missing = {}
            if not origin:
                missing['origin'] = 'This field is required for oneway/return searches.'
            if not destination:
                missing['destination'] = 'This field is required for oneway/return searches.'
            if not departure:
                missing['departureDate'] = 'This field is required for oneway/return searches.'

            if missing:
                raise serializers.ValidationError(missing)
        # If multicity, require segments list in the raw input (not top-level origin/destination)
        if trip == 'multicity':
            # The serializer may not have parsed a `segments` field yet if not declared
            # so try to read it from initial_data to preserve backward compatibility.
            segments = self.initial_data.get('segments') or self.initial_data.get('multiCitySegments')
            if not segments or not isinstance(segments, list) or len(segments) == 0:
                raise serializers.ValidationError({'segments': 'This field is required for multicity searches and must be a non-empty list.'})

            # Validate each segment structure
            for idx, seg in enumerate(segments):
                if not isinstance(seg, dict):
                    raise serializers.ValidationError({f'segments[{idx}]': 'Each segment must be an object with origin, destination and departureDate.'})
                if not seg.get('origin') or not seg.get('destination') or not seg.get('departureDate'):
                    raise serializers.ValidationError({f'segments[{idx}]': 'origin, destination and departureDate are required for each segment.'})

            # Inject normalized segments into validated attrs for downstream usage
            attrs['segments'] = segments
            # Also provide `multiCitySegments` to match frontend/back-end service expectation
            attrs['multiCitySegments'] = segments

        return attrs


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


class PassengerSerializer(serializers.Serializer):
    """Serializer for passenger information"""
    paxType = serializers.ChoiceField(choices=['ADT', 'CHD', 'INF'], default='ADT')
    salutation = serializers.ChoiceField(choices=['Mr', 'Ms', 'Mrs', 'Master', 'Miss'], required=True)
    gender = serializers.ChoiceField(choices=['Male', 'Female'], required=True)
    givenName = serializers.CharField(max_length=100, required=True)
    surName = serializers.CharField(max_length=100, required=True)
    birthDate = serializers.CharField(required=True, help_text="Format: DD-MM-YYYY")
    docType = serializers.CharField(default='1', help_text="1=Passport")
    docID = serializers.CharField(max_length=50, required=True, help_text="Passport number")
    docIssueCountry = serializers.CharField(max_length=2, required=True, help_text="2-letter country code")
    expiryDate = serializers.CharField(required=True, help_text="Format: DD-MM-YYYY")
    nationality = serializers.CharField(max_length=2, required=True, help_text="2-letter country code")
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(max_length=20, required=True)
    phoneCode = serializers.CharField(max_length=5, default='971', help_text="Country phone code")
    countryCode = serializers.CharField(max_length=2, default='AE', help_text="2-letter country code")


class ValidateFareSerializer(serializers.Serializer):
    """Serializer for fare validation request"""
    flightData = serializers.JSONField(help_text="Complete flight data from search response")


class CreateBookingSerializer(serializers.Serializer):
    """Serializer for creating a flight booking"""
    flightData = serializers.JSONField(help_text="Complete validated flight data")
    passengers = serializers.ListField(
        child=PassengerSerializer(),
        min_length=1,
        help_text="List of passenger information"
    )
    sealed = serializers.CharField(help_text="Sealed token from validate API")


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


class FlightBookingSerializer(serializers.ModelSerializer):
    """Serializer for FlightBooking model"""
    
    class Meta:
        model = FlightBooking
        fields = [
            'id', 'pnr', 'booking_ref_id', 'status', 'airline_locator', 'airline_code',
            'passenger_name', 'passenger_email', 'passenger_phone', 'nationality',
            'passport_number', 'passport_override', 'date_of_birth', 'origin', 'destination', 'origin_city',
            'destination_city', 'departure_date', 'arrival_date', 'flight_number',
            'cabin_class', 'base_fare', 'tax', 'total_fare', 'currency', 'segments',
            'supplier_code', 'booking_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'booking_date', 'created_at', 'updated_at']


class SaveBookingSerializer(serializers.Serializer):
    """Serializer for saving booking data from frontend"""
    pnr = serializers.CharField(max_length=20)
    bookingRefId = serializers.CharField(max_length=100)
    status = serializers.CharField(max_length=10, default='HK')
    airlineLocator = serializers.CharField(max_length=50, required=False, allow_blank=True)
    airline = serializers.CharField(max_length=10, required=False, allow_blank=True)
    passengerName = serializers.CharField(max_length=200)
    passengerEmail = serializers.EmailField()
    passengerPhone = serializers.CharField(max_length=50)
    nationality = serializers.CharField(max_length=10, required=False, allow_blank=True)
    passportNumber = serializers.CharField(max_length=50, required=False, allow_blank=True)
    dateOfBirth = serializers.CharField(max_length=20, required=False, allow_blank=True)
    origin = serializers.CharField(max_length=10)
    destination = serializers.CharField(max_length=10)
    originCity = serializers.CharField(max_length=100, required=False, allow_blank=True)
    destinationCity = serializers.CharField(max_length=100, required=False, allow_blank=True)
    departureDate = serializers.CharField(max_length=50, required=False, allow_blank=True)
    arrivalDate = serializers.CharField(max_length=50, required=False, allow_blank=True)
    flightNumber = serializers.CharField(max_length=20, required=False, allow_blank=True)
    cabin = serializers.CharField(max_length=50, default='Economy')
    baseFare = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    totalFare = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField(max_length=10, default='PKR')
    segments = serializers.JSONField(required=False)
    supplierCode = serializers.IntegerField(required=False)
