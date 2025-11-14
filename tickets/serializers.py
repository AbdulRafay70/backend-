
from rest_framework import serializers
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
    class Meta:
        model = TickerStopoverDetails
        fields = "__all__"
        extra_kwargs = {"ticket": {"required": False}}


class TicketTripDetailsSerializer(serializers.ModelSerializer):
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
        fields = "__all__"

    def validate(self, data):
        # Validate that ForeignKey IDs exist
        from packages.models import Airlines, City
        from organization.models import Organization
        
        if 'airline' in data:
            try:
                Airlines.objects.get(id=data['airline'].id if hasattr(data['airline'], 'id') else data['airline'])
            except Airlines.DoesNotExist:
                raise serializers.ValidationError("Invalid airline ID")
        
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

        trip_details_data = validated_data.pop("trip_details", [])
        stopover_details_data = validated_data.pop("stopover_details", [])

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
        # If organization missing from payload, try query param (views often pass ?organization=)
        if not org_val and request:
            qorg = request.query_params.get('organization') if request else None
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
            TicketTripDetails.objects.create(ticket=ticket, **trip)

        # Create stopover details
        for stopover in stopover_details_data:
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
            instance.trip_details.all().delete()
            for trip in trip_details_data:
                TicketTripDetails.objects.create(ticket=instance, **trip)

        # Update stopover details only if provided
        if stopover_details_data is not None:
            instance.stopover_details.all().delete()
            for stopover in stopover_details_data:
                TickerStopoverDetails.objects.create(ticket=instance, **stopover)

        return instance


class HotelPricesSerializer(serializers.ModelSerializer):
    class Meta:
        model = HotelPrices
        exclude = ["hotel"]


class HotelContactDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = HotelContactDetails
        exclude = ["hotel"]


class HotelsSerializer(serializers.ModelSerializer):
    prices = HotelPricesSerializer(many=True)
    contact_details = HotelContactDetailsSerializer(many=True, required=False)
    photos = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    photos_data = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Hotels
        fields = "__all__"

    def create(self, validated_data):
        prices_data = validated_data.pop("prices", [])
        contact_details_data = validated_data.pop("contact_details", [])
        photos = validated_data.pop("photos", [])
        hotel = Hotels.objects.create(**validated_data)

        for price in prices_data:
            HotelPrices.objects.create(hotel=hotel, **price)
        for contact in contact_details_data:
            HotelContactDetails.objects.create(hotel=hotel, **contact)
        # create photo entries if provided (photos are expected as URLs or paths)
        for p in photos:
            # if photos are URLs, store them in caption or treat as external; here we create Photo with caption=URL
            from .models import HotelPhoto
            HotelPhoto.objects.create(hotel=hotel, caption=p)
        return hotel

    def update(self, instance, validated_data):
        prices_data = validated_data.pop("prices", None)
        contact_details_data = validated_data.pop("contact_details", None)
        photos = validated_data.pop("photos", None)

        # Update main Hotel fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update prices only if provided
        if prices_data is not None:
            # special rule: rates can only be changed by the owning organization
            request = self.context.get("request")
            org_id = None
            if request:
                org_id = request.query_params.get("organization")
            if org_id is None or str(instance.organization_id) != str(org_id):
                raise PermissionDenied("Rates can only be changed by the owning organization.")
            instance.prices.all().delete()
            for price in prices_data:
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
        return instance

    def get_photos_data(self, obj):
        photos_qs = obj.photos.all() if hasattr(obj, "photos") else []
        return [
            {"id": p.id, "caption": p.caption, "image": p.image.url if getattr(p, 'image', None) else None}
            for p in photos_qs
        ]


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
    class Meta:
        model = TicketTripDetails
        # only include the minimal fields for list responses (no datetimes)
        fields = ("departure_city", "arrival_city")


class TickerStopoverDetailsListSerializer(serializers.ModelSerializer):
    class Meta:
        model = TickerStopoverDetails
        fields = ("stopover_duration", "trip_type", "stopover_city")


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
            "airline",
        )

    def get_trip_details(self, obj):
        # obj is a Ticket instance; construct trip detail dicts including ticket.flight_number
        details = []
        # Always iterate the related manager queryset to avoid TypeError
        for td in obj.trip_details.all():
            details.append({
                'flight_number': getattr(obj, 'flight_number', None),
                'departure_date_time': getattr(td, 'departure_date_time', None),
                'arrival_date_time': getattr(td, 'arrival_date_time', None),
                'departure_city': getattr(td, 'departure_city_id', None),
                'arrival_city': getattr(td, 'arrival_city_id', None),
            })
        return details

    def get_adult_price(self, obj):
        # prefer explicit adult_price, then adult_fare, then adult_price purchase fallback
        return getattr(obj, 'adult_price', None) or getattr(obj, 'adult_fare', None) or getattr(obj, 'adult_purchase_price', None)