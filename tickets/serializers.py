
from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field, OpenApiTypes
from rest_framework.exceptions import PermissionDenied
from .models import (
    Ticket,
    TicketTripDetails,
    TickerStopoverDetails,
    HotelPrices,
    HotelContactDetails,
    Hotels,
    HotelRooms,
    RoomDetails,
)


class TickerStopoverDetailsSerializer(serializers.ModelSerializer):
    # Accept extra optional fields for API clients: flight_number, departure/arrival datetimes and cities, and nested airline
    airline = serializers.JSONField(required=False)
    flight_number = serializers.CharField(required=False, allow_blank=True)
    departure_date_time = serializers.DateTimeField(required=False)
    arrival_date_time = serializers.DateTimeField(required=False)
    departure_city = serializers.JSONField(required=False)
    arrival_city = serializers.JSONField(required=False)
    # (keep writable fields above so clients can POST these values)

    class Meta:
        model = TickerStopoverDetails
        # model fields are still used for persistence; extra fields are handled at TicketSerializer level
        fields = "__all__"
        extra_kwargs = {"ticket": {"required": False}}

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # remove trip_type from API responses for stopovers
        data.pop('trip_type', None)

        # Enrich stopover representation with related trip-detail fields when available.
        # Many stopover-related fields (flight_number, departure/arrival datetimes, arrival_city)
        # are stored on TicketTripDetails. Try to find a matching trip and include those
        # values in the stopover representation so POST responses contain the richer schema
        # consumers expect.
        def _find_matching_trip(obj):
            ticket = getattr(obj, 'ticket', None)
            if not ticket:
                return None
            qs = ticket.trip_details.all()
            if not qs.exists():
                return None
            # prefer trip where departure or arrival city equals the stopover city
            m = qs.filter(departure_city_id=getattr(obj, 'stopover_city_id')).first()
            if m:
                return m
            m = qs.filter(arrival_city_id=getattr(obj, 'stopover_city_id')).first()
            if m:
                return m
            return qs.first()

        try:
            trip = _find_matching_trip(instance)
            if trip:
                # flight number (per-trip) if available
                fn = getattr(trip, 'flight_number', None)
                if fn:
                    data['flight_number'] = fn

                # departure/arrival datetimes as ISO strings for JSON responses
                from django.utils import timezone
                dd = getattr(trip, 'departure_date_time', None)
                ad = getattr(trip, 'arrival_date_time', None)
                if dd:
                    try:
                        # normalize to UTC Z format when possible
                        dd_utc = dd.astimezone(timezone.utc) if getattr(dd, 'tzinfo', None) else dd
                        data['departure_date_time'] = dd_utc.isoformat().replace('+00:00', 'Z')
                    except Exception:
                        data['departure_date_time'] = str(dd)
                if ad:
                    try:
                        ad_utc = ad.astimezone(timezone.utc) if getattr(ad, 'tzinfo', None) else ad
                        data['arrival_date_time'] = ad_utc.isoformat().replace('+00:00', 'Z')
                    except Exception:
                        data['arrival_date_time'] = str(ad)

                # arrival city as object with id/name
                try:
                    data['arrival_city'] = {
                        'id': getattr(trip, 'arrival_city_id', None),
                        'name': getattr(trip.arrival_city, 'name', None),
                    }
                except Exception:
                    data['arrival_city'] = None
        except Exception:
            # be tolerant: if enrichment fails, return basic stopover data
            pass

        return data

    # Note: we intentionally keep the writable fields (`flight_number`, `departure_date_time`,
    # `arrival_date_time`, `arrival_city`) declared above so clients can send them in POST/PUT.
    # The `to_representation` method enriches returned data from related trip entries when available.


class TicketTripDetailsSerializer(serializers.ModelSerializer):
    departure_city_name = serializers.CharField(source='departure_city.name', read_only=True)
    arrival_city_name = serializers.CharField(source='arrival_city.name', read_only=True)
    
    class Meta:
        model = TicketTripDetails
        fields = "__all__"
        extra_kwargs = {"ticket": {"required": False}}

    def validate(self, data):
        from packages.models import City
        
        if 'departure_city' in data:
            try:
                City.objects.get(id=data['departure_city'].id if hasattr(data['departure_city'], 'id') else data['departure_city'])
            except City.DoesNotExist:
                raise serializers.ValidationError("Invalid departure city ID")
        
        if 'arrival_city' in data:
            try:
                City.objects.get(id=data['arrival_city'].id if hasattr(data['arrival_city'], 'id') else data['arrival_city'])
            except City.DoesNotExist:
                raise serializers.ValidationError("Invalid arrival city ID")
        
        return data


class TicketSerializer(serializers.ModelSerializer):
    trip_details = TicketTripDetailsSerializer(many=True)
    stopover_details = TickerStopoverDetailsSerializer(many=True, required=False)

    class Meta:
        model = Ticket
        # keep all model fields for write operations but hide top-level `airline` in responses
        fields = "__all__"

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # remove top-level airline from API responses; nested trip/stopover entries include airline info
        data.pop('airline', None)
        return data

    def validate(self, data):
        # Validate that ForeignKey IDs exist
        from packages.models import City
        from organization.models import Organization

        # Top-level `airline` should be provided via nested trip/stopover entries.
        # Validate organization if present.
        if 'organization' in data:
            try:
                Organization.objects.get(id=data['organization'].id if hasattr(data['organization'], 'id') else data['organization'])
            except Organization.DoesNotExist:
                raise serializers.ValidationError("Invalid organization ID")

        return data

    def create(self, validated_data):
        # map legacy incoming price keys to purchase fields so they are preserved
        for k_from, k_to in (
            ("adult_price", "adult_purchase_price"),
            ("child_price", "child_purchase_price"),
            ("infant_price", "infant_purchase_price"),
        ):
            if k_from in validated_data and k_to not in validated_data:
                validated_data[k_to] = validated_data.pop(k_from)

        # Extract trip details (departure/return legs)
        trip_details_data = validated_data.pop("trip_details", [])

        # Support frontend sending only numeric flight suffix (e.g. "123").
        # If provided as `flight_number_suffix` combine with the airline code
        # to form the stored `flight_number` (e.g. PIA-123).
        flight_suffix = validated_data.pop("flight_number_suffix", None)

        # If no explicit suffix provided, check trip_details for a per-leg flight_number
        # (frontend often sends numeric-only values inside trip_details.flight_number).
        if not flight_suffix and trip_details_data:
            first_trip_fn = None
            try:
                first_trip_fn = trip_details_data[0].get("flight_number")
            except Exception:
                first_trip_fn = None
            if first_trip_fn:
                # prefer the trip-level value as the suffix
                flight_suffix = first_trip_fn

        if flight_suffix:
            try:
                airline_obj = validated_data.get("airline")
                # airline may be an instance or a PK; handle both
                if hasattr(airline_obj, "code"):
                    code = airline_obj.code
                else:
                    from packages.models import Airlines
                    a = Airlines.objects.filter(id=int(airline_obj)).first()
                    code = a.code if a else str(airline_obj)

                # Keep only numeric chars from suffix
                import re
                suffix_clean = re.sub(r"\D", "", str(flight_suffix))
                if suffix_clean:
                    validated_data["flight_number"] = f"{code}-{suffix_clean}"
            except Exception:
                # If anything fails, fall back to leaving `flight_number` unset
                pass
        stopover_details_data = validated_data.pop("stopover_details", [])

        # If client provided an `airline` inside nested trip/stopover entries, prefer that
        # and set the ticket-level airline accordingly (model requires a ticket.airline FK).
        if 'airline' not in validated_data:
            # search trip details first
            found_airline = None
            for trip in trip_details_data:
                a = trip.get('airline') or (trip.get('airline') if trip.get('airline') else None)
                if a:
                    found_airline = a
                    break
            # fallback to stopover
            if not found_airline:
                for stop in stopover_details_data:
                    a = stop.get('airline') or (stop.get('airline') if stop.get('airline') else None)
                    if a:
                        found_airline = a
                        break

            if found_airline:
                # normalize to PK if object provided
                try:
                    if hasattr(found_airline, 'id'):
                        validated_data['airline'] = found_airline.id
                    else:
                        validated_data['airline'] = int(found_airline)
                except Exception:
                    # leave as-is; DB will validate
                    validated_data['airline'] = found_airline

        # Extract fields from trip_details if not provided
        if trip_details_data:
            departure_trip = next((t for t in trip_details_data if t.get('trip_type') == 'Departure'), None)
            if departure_trip:
                # Set departure and arrival dates/times from departure trip
                if 'departure_date' not in validated_data and 'departure_date_time' in departure_trip:
                    from django.utils import timezone
                    dt = departure_trip['departure_date_time']
                    if isinstance(dt, str):
                        dt = timezone.datetime.fromisoformat(dt.replace('Z', '+00:00'))
                    validated_data['departure_date'] = dt.date()
                    validated_data['departure_time'] = dt.time()
                
                if 'arrival_date' not in validated_data and 'arrival_date_time' in departure_trip:
                    from django.utils import timezone
                    dt = departure_trip['arrival_date_time']
                    if isinstance(dt, str):
                        dt = timezone.datetime.fromisoformat(dt.replace('Z', '+00:00'))
                    validated_data['arrival_date'] = dt.date()
                    validated_data['arrival_time'] = dt.time()

        # Ensure owner fields are set from the organization if not provided
        # organization may be provided as an object or an id; prefer explicit owner fields if present
        org_val = validated_data.get('organization')
        request = self.context.get('request')
        # If organization missing from payload, try query param (views often pass ?owner_organization=)
        if not org_val and request:
            qorg = request.query_params.get('owner_organization') if request else None
            if qorg:
                try:
                    validated_data['organization'] = int(qorg)
                    org_val = validated_data['organization']
                except Exception:
                    validated_data['organization'] = qorg
                    org_val = qorg

        if org_val is not None:
            try:
                org_id = org_val.id if hasattr(org_val, 'id') else int(org_val)
            except Exception:
                org_id = org_val

            if 'owner_organization_id' not in validated_data or validated_data.get('owner_organization_id') in (None, ''):
                validated_data['owner_organization_id'] = org_id
            if 'inventory_owner_organization_id' not in validated_data or validated_data.get('inventory_owner_organization_id') in (None, ''):
                validated_data['inventory_owner_organization_id'] = org_id

        ticket = Ticket.objects.create(**validated_data)

        # Create trip details
        for trip in trip_details_data:
            # remove any nested airline from per-leg payloads (not a field on TicketTripDetails)
            trip.pop('airline', None)
            # allow departure_city/arrival_city to be provided as object with `id`
            if isinstance(trip.get('departure_city'), dict) and 'id' in trip.get('departure_city'):
                trip['departure_city'] = trip['departure_city']['id']
            if isinstance(trip.get('arrival_city'), dict) and 'id' in trip.get('arrival_city'):
                trip['arrival_city'] = trip['arrival_city']['id']
            TicketTripDetails.objects.create(ticket=ticket, **trip)

        # Create stopover details
        for stopover in stopover_details_data:
            # capture nested airline if present (ticket-level airline already set earlier)
            stopover_airline = stopover.pop('airline', None)

            # If stopover includes full trip-leg fields, create a corresponding TicketTripDetails
            trip_for_stop = {}
            for k in ('flight_number', 'departure_date_time', 'arrival_date_time', 'departure_city', 'arrival_city', 'trip_type'):
                if k in stopover:
                    trip_for_stop[k] = stopover.pop(k)

            # normalize city objects to IDs for trip creation
            if 'departure_city' in trip_for_stop and isinstance(trip_for_stop.get('departure_city'), dict) and 'id' in trip_for_stop.get('departure_city'):
                trip_for_stop['departure_city'] = trip_for_stop['departure_city']['id']
            if 'arrival_city' in trip_for_stop and isinstance(trip_for_stop.get('arrival_city'), dict) and 'id' in trip_for_stop.get('arrival_city'):
                trip_for_stop['arrival_city'] = trip_for_stop['arrival_city']['id']

            if trip_for_stop:
                # ensure trip_type exists
                if 'trip_type' not in trip_for_stop:
                    trip_for_stop['trip_type'] = stopover.get('trip_type') or 'Stopover'
                try:
                    TicketTripDetails.objects.create(ticket=ticket, **trip_for_stop)
                except Exception:
                    # ignore trip creation errors; continue to save stopover
                    pass

            if isinstance(stopover.get('stopover_city'), dict) and 'id' in stopover.get('stopover_city'):
                stopover['stopover_city'] = stopover['stopover_city']['id']

            TickerStopoverDetails.objects.create(ticket=ticket, **stopover)

        return ticket

    def update(self, instance, validated_data):
        # map legacy incoming price keys to purchase fields so they are preserved
        for k_from, k_to in (
            ("adult_price", "adult_purchase_price"),
            ("child_price", "child_purchase_price"),
            ("infant_price", "infant_purchase_price"),
        ):
            if k_from in validated_data and k_to not in validated_data:
                validated_data[k_to] = validated_data.pop(k_from)

        trip_details_data = validated_data.pop("trip_details", None)
        stopover_details_data = validated_data.pop("stopover_details", None)

        # If frontend provided a numeric flight suffix at top-level or inside trip_details,
        # ensure the instance.flight_number is updated accordingly so list endpoints
        # return the expected airline-code + suffix string.
        flight_suffix = validated_data.pop("flight_number_suffix", None)
        if not flight_suffix and trip_details_data and len(trip_details_data) > 0:
            flight_suffix = trip_details_data[0].get("flight_number")

        if flight_suffix:
            try:
                airline_obj = validated_data.get("airline") or instance.airline_id
                if hasattr(airline_obj, "code"):
                    code = airline_obj.code
                else:
                    from packages.models import Airlines
                    a = Airlines.objects.filter(id=int(airline_obj)).first()
                    code = a.code if a else str(airline_obj)
                import re
                suffix_clean = re.sub(r"\D", "", str(flight_suffix))
                if suffix_clean:
                    validated_data["flight_number"] = f"{code}-{suffix_clean}"
            except Exception:
                pass

        # If organization is updated, ensure owner fields remain consistent when not explicitly provided
        if 'organization' in validated_data:
            org_val = validated_data.get('organization')
            try:
                org_id = org_val.id if hasattr(org_val, 'id') else int(org_val)
            except Exception:
                org_id = org_val

            if 'owner_organization_id' not in validated_data or validated_data.get('owner_organization_id') in (None, ''):
                validated_data['owner_organization_id'] = org_id
            if 'inventory_owner_organization_id' not in validated_data or validated_data.get('inventory_owner_organization_id') in (None, ''):
                validated_data['inventory_owner_organization_id'] = org_id

        # Update base Ticket fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update trip details only if provided
        if trip_details_data is not None:
            # if nested airline provided, update ticket-level airline
            found_airline = None
            for trip in trip_details_data:
                a = trip.get('airline')
                if a:
                    found_airline = a
                    break
            if not found_airline and stopover_details_data:
                for stop in stopover_details_data:
                    a = stop.get('airline')
                    if a:
                        found_airline = a
                        break
            if found_airline:
                try:
                    if hasattr(found_airline, 'id'):
                        instance.airline_id = found_airline.id
                    else:
                        instance.airline_id = int(found_airline)
                except Exception:
                    pass
                instance.save()

            instance.trip_details.all().delete()
            for trip in trip_details_data:
                trip.pop('airline', None)
                if isinstance(trip.get('departure_city'), dict) and 'id' in trip.get('departure_city'):
                    trip['departure_city'] = trip['departure_city']['id']
                if isinstance(trip.get('arrival_city'), dict) and 'id' in trip.get('arrival_city'):
                    trip['arrival_city'] = trip['arrival_city']['id']
                TicketTripDetails.objects.create(ticket=instance, **trip)

        # Update stopover details only if provided
        if stopover_details_data is not None:
            instance.stopover_details.all().delete()
            for stopover in stopover_details_data:
                stopover_airline = stopover.pop('airline', None)

                trip_for_stop = {}
                for k in ('flight_number', 'departure_date_time', 'arrival_date_time', 'departure_city', 'arrival_city', 'trip_type'):
                    if k in stopover:
                        trip_for_stop[k] = stopover.pop(k)

                if 'departure_city' in trip_for_stop and isinstance(trip_for_stop.get('departure_city'), dict) and 'id' in trip_for_stop.get('departure_city'):
                    trip_for_stop['departure_city'] = trip_for_stop['departure_city']['id']
                if 'arrival_city' in trip_for_stop and isinstance(trip_for_stop.get('arrival_city'), dict) and 'id' in trip_for_stop.get('arrival_city'):
                    trip_for_stop['arrival_city'] = trip_for_stop['arrival_city']['id']

                if trip_for_stop:
                    if 'trip_type' not in trip_for_stop:
                        trip_for_stop['trip_type'] = stopover.get('trip_type') or 'Stopover'
                    try:
                        TicketTripDetails.objects.create(ticket=instance, **trip_for_stop)
                    except Exception:
                        pass

                if isinstance(stopover.get('stopover_city'), dict) and 'id' in stopover.get('stopover_city'):
                    stopover['stopover_city'] = stopover['stopover_city']['id']
                TickerStopoverDetails.objects.create(ticket=instance, **stopover)

        return instance


class HotelPricesSerializer(serializers.ModelSerializer):
    # expose the stored `price` field as `selling_price` in the API schema
    selling_price = serializers.FloatField(source='price', required=False)
    # accept incoming legacy `price` key as write-only to support older clients
    price = serializers.FloatField(write_only=True, required=False)

    class Meta:
        model = HotelPrices
        # explicitly list fields so OpenAPI shows `selling_price` instead of `price`
        fields = ('id', 'start_date', 'end_date', 'room_type', 'selling_price', 'price', 'purchase_price', 'is_sharing_allowed')


class HotelCategorySerializer(serializers.ModelSerializer):
    # make slug optional at the serializer level so clients can POST just a name
    slug = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = None  # set below after import to avoid circular import during migrations
        fields = ['id', 'name', 'slug', 'organization', 'created_at']


# Resolve HotelCategory model reference for serializer Meta to avoid import-time issues
try:
    from .models import HotelCategory
    HotelCategorySerializer.Meta.model = HotelCategory
except Exception:
    # during migrations or import cycles HotelCategory may not be available yet
    pass


class BedTypeSerializer(serializers.ModelSerializer):
    """Serializer for BedType model"""
    slug = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = None  # set below after import
        fields = ['id', 'name', 'slug', 'capacity', 'organization', 'created_at']
        read_only_fields = ['id', 'organization', 'created_at']
    
    def validate_capacity(self, value):
        """Validate capacity is between 1 and 10"""
        if value < 1:
            raise serializers.ValidationError("Capacity must be at least 1")
        if value > 10:
            raise serializers.ValidationError("Maximum capacity is 10 beds")
        return value


# Resolve BedType model reference for serializer Meta to avoid import-time issues
try:
    from .models import BedType
    BedTypeSerializer.Meta.model = BedType
except Exception:
    # during migrations or import cycles BedType may not be available yet
    pass



class HotelContactDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = HotelContactDetails
        exclude = ["hotel"]


class HotelsSerializer(serializers.ModelSerializer):
    # Accept free-form category values (allow frontend to send slug/name/id)
    category = serializers.CharField(required=False, allow_blank=True)
    # Allow clients to supply `category_id` (write-only) so we can map it server-side
    category_id = serializers.IntegerField(required=False, write_only=True)
    prices = HotelPricesSerializer(many=True)
    contact_details = HotelContactDetailsSerializer(many=True, required=False)
    photos = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    photos_data = serializers.SerializerMethodField(read_only=True)
    walking_time = serializers.FloatField(required=False)

    class Meta:
        model = Hotels
        fields = "__all__"

    def create(self, validated_data):
        # Allow clients to send a category by id (category_id) or as an object/number
        # Map it to the string value expected by the Hotels.category field (slug or name)
        try:
            from .models import HotelCategory
            if 'category_id' in validated_data and validated_data.get('category_id'):
                try:
                    cid = int(validated_data.pop('category_id'))
                    hc = HotelCategory.objects.filter(id=cid).first()
                    if hc:
                        # prefer slug when present
                        validated_data['category'] = hc.slug or hc.name
                except Exception:
                    # ignore mapping errors and leave category as-is
                    validated_data.pop('category_id', None)
            # If category provided as numeric or object with id, map similarly
            if 'category' in validated_data:
                cat_val = validated_data.get('category')
                try:
                    # numeric string or int -> lookup by id
                    if isinstance(cat_val, (int,)) or (isinstance(cat_val, str) and cat_val.isdigit()):
                        hc = HotelCategory.objects.filter(id=int(cat_val)).first()
                        if hc:
                            validated_data['category'] = hc.slug or hc.name
                    # dict with id
                    elif isinstance(cat_val, dict) and cat_val.get('id'):
                        hc = HotelCategory.objects.filter(id=int(cat_val.get('id'))).first()
                        if hc:
                            validated_data['category'] = hc.slug or hc.name
                except Exception:
                    pass
        except Exception:
            # if models import fails for any reason, continue without mapping
            pass

        prices_data = validated_data.pop("prices", [])
        contact_details_data = validated_data.pop("contact_details", [])
        photos = validated_data.pop("photos", [])
        # walking_time is now stored directly, no conversion
        hotel = Hotels.objects.create(**validated_data)

        for price in prices_data:
            # accept incoming `selling_price` from clients and map to DB `price`
            if 'selling_price' in price and 'price' not in price:
                price['price'] = price.pop('selling_price')
            HotelPrices.objects.create(hotel=hotel, **price)
        for contact in contact_details_data:
            HotelContactDetails.objects.create(hotel=hotel, **contact)
        # create photo entries if provided (photos are expected as URLs or paths)
        for p in photos:
            # if photos are URLs, store them in caption or treat as external; here we create Photo with caption=URL
            from .models import HotelPhoto
            HotelPhoto.objects.create(hotel=hotel, caption=p)
        # Also accept uploaded image files under 'photo_files' (multipart/form-data uploads)
        try:
            request = self.context.get('request')
            if request and getattr(request, 'FILES', None):
                # Django's request.FILES is a MultiValueDict with getlist
                uploaded = request.FILES.getlist('photo_files') if hasattr(request.FILES, 'getlist') else []
                for f in uploaded:
                    try:
                        HotelPhoto.objects.create(hotel=hotel, image=f, caption=getattr(f, 'name', None))
                    except Exception:
                        # ignore individual file save errors
                        continue
                # If a video file was uploaded under 'video', attach it to the hotel video field
                if 'video' in request.FILES:
                    try:
                        hotel.video = request.FILES['video']
                        hotel.save()
                    except Exception:
                        pass
        except Exception:
            # be tolerant: do not fail hotel creation if file handling has issues
            pass
        # Only walking_time is saved; walking_distance is ignored
        if hasattr(hotel, 'walking_time') and 'walking_time' in validated_data:
            hotel.walking_time = validated_data.get('walking_time')
        hotel.save()
        return hotel

    def update(self, instance, validated_data):
        # Map incoming category/category_id values to the expected category string
        try:
            from .models import HotelCategory
            if 'category_id' in validated_data and validated_data.get('category_id'):
                try:
                    cid = int(validated_data.pop('category_id'))
                    hc = HotelCategory.objects.filter(id=cid).first()
                    if hc:
                        validated_data['category'] = hc.slug or hc.name
                except Exception:
                    validated_data.pop('category_id', None)
            if 'category' in validated_data:
                cat_val = validated_data.get('category')
                try:
                    if isinstance(cat_val, (int,)) or (isinstance(cat_val, str) and str(cat_val).isdigit()):
                        hc = HotelCategory.objects.filter(id=int(cat_val)).first()
                        if hc:
                            validated_data['category'] = hc.slug or hc.name
                    elif isinstance(cat_val, dict) and cat_val.get('id'):
                        hc = HotelCategory.objects.filter(id=int(cat_val.get('id'))).first()
                        if hc:
                            validated_data['category'] = hc.slug or hc.name
                except Exception:
                    pass
        except Exception:
            pass

        prices_data = validated_data.pop("prices", None)
        contact_details_data = validated_data.pop("contact_details", None)
        photos = validated_data.pop("photos", None)

        # walking_time is now stored directly, no conversion
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update prices only if provided
        if prices_data is not None:
            # special rule: rates can only be changed by the owning (owner_organization) organization
            # Accept either `owner_organization` (preferred) or legacy `organization` query param.
            request = self.context.get("request")
            org_id = None
            if request:
                org_id = request.query_params.get("owner_organization") or request.query_params.get("organization")
            if org_id is None or str(instance.organization_id) != str(org_id):
                raise PermissionDenied("Rates can only be changed by the owning organization (use owner_organization or organization query param).")
            instance.prices.all().delete()
            for price in prices_data:
                if 'selling_price' in price and 'price' not in price:
                    price['price'] = price.pop('selling_price')
                HotelPrices.objects.create(hotel=instance, **price)
        if contact_details_data is not None:
            instance.contact_details.all().delete()
            for contact in contact_details_data:
                HotelContactDetails.objects.create(hotel=instance, **contact)
        if photos is not None:
            # replace photos list
            instance.photos.all().delete()
            from .models import HotelPhoto
            for p in photos:
                HotelPhoto.objects.create(hotel=instance, caption=p)
        # Also accept uploaded image files under 'photo_files' (multipart/form-data uploads)
        try:
            request = self.context.get('request')
            if request and getattr(request, 'FILES', None):
                uploaded = request.FILES.getlist('photo_files') if hasattr(request.FILES, 'getlist') else []
                for f in uploaded:
                    try:
                        from .models import HotelPhoto
                        HotelPhoto.objects.create(hotel=instance, image=f, caption=getattr(f, 'name', None))
                    except Exception:
                        continue
                # If a video file was uploaded under 'video', attach it to the hotel video field
                if 'video' in request.FILES:
                    try:
                        instance.video = request.FILES['video']
                        instance.save()
                    except Exception:
                        pass
        except Exception:
            pass
        return instance

    def validate_category(self, value):
        # Allow dynamic category values created via HotelCategory API.
        # The model previously used static choices, but we accept arbitrary
        # category strings so admin can manage categories dynamically.
        return value

    def get_photos_data(self, obj):
        photos_qs = obj.photos.all() if hasattr(obj, "photos") else []
        return [
            {"id": p.id, "caption": p.caption, "image": p.image.url if getattr(p, 'image', None) else None}
            for p in photos_qs
        ]

    def to_representation(self, instance):
        """Return hotel representation but expose the owner organization id
        under the `organization` key in API responses for compatibility
        with legacy clients / Swagger UI expectations.
        If `owner_organization_id` is present, prefer it; otherwise fall
        back to the stored `organization_id`.
        """
        data = super().to_representation(instance)
        try:
            owner_id = getattr(instance, 'owner_organization_id', None)
            if owner_id is None:
                owner_id = getattr(instance, 'organization_id', None)
            # Ensure we expose owner_organization_id and remove the legacy
            # `organization` key from responses so clients only see the owner id.
            data['owner_organization_id'] = owner_id
            if 'organization' in data:
                try:
                    del data['organization']
                except Exception:
                    data.pop('organization', None)
        except Exception:
            pass
        return data


class HotelRoomDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomDetails
        exclude = ["room"]


class HotelRoomsSerializer(serializers.ModelSerializer):
    hotel_name = serializers.CharField(source='hotel.name', read_only=True)
    details = HotelRoomDetailsSerializer(many=True, required=False)

    class Meta:
        model = HotelRooms
        fields = "__all__"

    def create(self, validated_data):
        details_data = validated_data.pop("details", [])
        room = HotelRooms.objects.create(**validated_data)

        for detail in details_data:
            RoomDetails.objects.create(room=room, **detail)
        return room

    def update(self, instance, validated_data):
        details_data = validated_data.pop("details", None)

        # Update main HotelRoom fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update details only if provided
        if details_data is not None:
            instance.details.all().delete()
            for detail in details_data:
                RoomDetails.objects.create(room=instance, **detail)
        return instance


class TicketTripDetailsListSerializer(serializers.ModelSerializer):
    departure_city = serializers.SerializerMethodField()
    arrival_city = serializers.SerializerMethodField()
    airline = serializers.SerializerMethodField()

    class Meta:
        model = TicketTripDetails
        # include minimal fields for list responses and include nested objects
        fields = ("departure_city", "arrival_city", "airline")

    def get_departure_city(self, obj):
        return {"id": getattr(obj, 'departure_city_id', None), "name": getattr(obj.departure_city, 'name', None)}

    def get_arrival_city(self, obj):
        return {"id": getattr(obj, 'arrival_city_id', None), "name": getattr(obj.arrival_city, 'name', None)}

    def get_airline(self, obj):
        # parent ticket's airline
        t = getattr(obj, 'ticket', None)
        if not t:
            return None
        return {"id": getattr(t, 'airline_id', None), "name": getattr(t.airline, 'name', None)}


class TickerStopoverDetailsListSerializer(serializers.ModelSerializer):
    # Return a richer stopover object including possible associated trip-detail fields
    stopover_city = serializers.SerializerMethodField()
    airline = serializers.SerializerMethodField()
    flight_number = serializers.SerializerMethodField()
    departure_date_time = serializers.SerializerMethodField()
    arrival_date_time = serializers.SerializerMethodField()
    arrival_city = serializers.SerializerMethodField()

    class Meta:
        model = TickerStopoverDetails
        # exclude `trip_type` from list responses
        fields = ("flight_number", "departure_date_time", "arrival_date_time", "arrival_city", "stopover_duration", "stopover_city", "airline")

    def get_stopover_city(self, obj):
        return {"id": getattr(obj, 'stopover_city_id', None), "name": getattr(obj.stopover_city, 'name', None)}

    def _find_matching_trip(self, obj):
        # try to find a TicketTripDetails that corresponds to this stopover. Prefer trip where
        # departure_city or arrival_city matches the stopover_city, otherwise return first related trip
        ticket = getattr(obj, 'ticket', None)
        if not ticket:
            return None
        qs = ticket.trip_details.all()
        if not qs.exists():
            return None
        # prefer departure_city match
        m = qs.filter(departure_city_id=getattr(obj, 'stopover_city_id')).first()
        if m:
            return m
        m = qs.filter(arrival_city_id=getattr(obj, 'stopover_city_id')).first()
        if m:
            return m
        # fallback to any trip_details entry
        return qs.first()

    def get_airline(self, obj):
        t = getattr(obj, 'ticket', None)
        if not t:
            return None
        return {"id": getattr(t, 'airline_id', None), "name": getattr(t.airline, 'name', None)}

    def get_flight_number(self, obj):
        td = self._find_matching_trip(obj)
        return getattr(td, 'flight_number', None) if td else None

    def get_departure_date_time(self, obj):
        td = self._find_matching_trip(obj)
        return getattr(td, 'departure_date_time', None) if td else None

    def get_arrival_date_time(self, obj):
        td = self._find_matching_trip(obj)
        return getattr(td, 'arrival_date_time', None) if td else None

    

    def get_arrival_city(self, obj):
        td = self._find_matching_trip(obj)
        if not td:
            return None
        return {"id": getattr(td, 'arrival_city_id', None), "name": getattr(td.arrival_city, 'name', None)}


class TicketListSerializer(serializers.ModelSerializer):
    # build trip_details entries including parent ticket's flight_number
    trip_details = serializers.SerializerMethodField()
    stopover_details = TickerStopoverDetailsListSerializer(many=True, read_only=True)
    # expose adult_price for compatibility with frontend which expects ticket.adult_price
    adult_price = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        # explicit list of fields the user requested (trimmed)
        fields = (
            "id",
            "flight_number",
            "trip_details",
            "stopover_details",
            "adult_fare",
            "adult_price",
            "child_fare",
            "infant_fare",
            "baggage_weight",
            "baggage_pieces",
            "is_refundable",
            "is_meal_included",
            "pnr",
            "status",
            "total_seats",
            "left_seats",
            "booked_tickets",
            "confirmed_tickets",
            "adult_purchase_price",
            "child_purchase_price",
            "infant_purchase_price",
            "is_umrah_seat",
            "trip_type",
            "owner_organization_id",
            "reselling_allowed",
            "branch",
        )

    def get_trip_details(self, obj):
        # obj is a Ticket instance; construct trip detail dicts including ticket.flight_number
        details = []
        # Always iterate the related manager queryset to avoid TypeError
        for td in obj.trip_details.all():
            # prefer the per-trip flight_number stored on the TicketTripDetails record
            # (if the frontend provided a numeric suffix and it was stored there)
            fn = getattr(td, 'flight_number', None) or getattr(obj, 'flight_number', None)
            details.append({
                'airline': {"id": getattr(obj, 'airline_id', None), "name": getattr(obj.airline, 'name', None)},
                'flight_number': fn,
                'departure_date_time': getattr(td, 'departure_date_time', None),
                'arrival_date_time': getattr(td, 'arrival_date_time', None),
                'departure_city': {"id": getattr(td, 'departure_city_id', None), "name": getattr(td.departure_city, 'name', None)},
                'arrival_city': {"id": getattr(td, 'arrival_city_id', None), "name": getattr(td.arrival_city, 'name', None)},
            })
        return details

    def get_adult_price(self, obj):
        # prefer explicit adult_price, then adult_fare, then adult_price purchase fallback
        return getattr(obj, 'adult_price', None) or getattr(obj, 'adult_fare', None) or getattr(obj, 'adult_purchase_price', None)