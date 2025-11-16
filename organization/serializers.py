from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Organization, Branch, Agency, AgencyFiles, AgencyContact
from .models import OrganizationLink, AgencyProfile, ResellRequest
from .models import Rule
from .models import WalkInBooking
from tickets.models import Hotels, HotelRooms

class BranchSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(
        source="organization.name", read_only=True
    )

    commission_id = serializers.CharField(read_only=False, required=False)

    class Meta:
        model = Branch
        # expose commission_id explicitly while keeping backward compatibility
        exclude = ["user"]
        extra_kwargs = {
            "commission_id": {"required": False, "allow_null": True},
        }


class OrganizationSerializer(serializers.ModelSerializer):
    branches = BranchSerializer(many=True, read_only=True)

    class Meta:
        model = Organization
        exclude = ["user"]


class AgencyFilesSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgencyFiles
        exclude = ["agency"]

    def to_internal_value(self, data):
        validated_data = super().to_internal_value(data)
        validated_data["id"] = data.get("id")
        return validated_data


class AgencyContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgencyContact
        exclude = ["agency"]

    def to_internal_value(self, data):
        validated_data = super().to_internal_value(data)
        validated_data["id"] = data.get("id")
        return validated_data


class AgencySerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    files = AgencyFilesSerializer(many=True, required=False)
    contacts = AgencyContactSerializer(many=True, required=False)
    # Make the M2M `user` field optional so clients can omit it on create/update
    # (keep many=True so DRF will serialize M2M relations correctly).
    user = serializers.PrimaryKeyRelatedField(
        queryset=get_user_model().objects.all(), many=True, required=False, allow_empty=True
    )
    assign_to = serializers.PrimaryKeyRelatedField(
        queryset=get_user_model().objects.all(), required=False, allow_null=True
    )
    commission_id = serializers.CharField(read_only=False, required=False)
    

    class Meta:
        model = Agency
        fields = "__all__"
        extra_kwargs = {"commission_id": {"required": False, "allow_null": True}}

    def create(self, validated_data):
        files_data = validated_data.pop("files", [])
        contacts_data = validated_data.pop("contacts", [])
        # handle many-to-many 'user' field: pop before create and set after
        users_data = validated_data.pop("user", None) or validated_data.pop("users", None)
        agency = Agency.objects.create(**validated_data)

        # assign M2M users if provided (expecting list of user IDs)
        if users_data is not None:
            User = get_user_model()
            try:
                user_qs = User.objects.filter(pk__in=users_data)
                agency.user.set(user_qs)
            except Exception:
                # If users_data is already a queryset or instances, try to set directly
                try:
                    agency.user.set(users_data)
                except Exception:
                    pass

        for file_data in files_data:
            AgencyFiles.objects.create(agency=agency, **file_data)
        for contact_data in contacts_data:
            AgencyContact.objects.create(agency=agency, **contact_data)

        return agency

    def validate_user(self, value):
        """Normalize incoming `user` payloads.

        Accepts:
        - None/empty/0 -> returns None (no users to set)
        - single PK as str/int -> returns [int(pk)]
        - list/QueryDict list -> returns cleaned list of ints (or None if empty)

        This makes the endpoint tolerant to form-posted values (QueryDict lists),
        clients that omit `user`, or clients that send '0' or empty strings.
        """
        # treat falsy/null/zero values as no users provided
        if value is None:
            return None
        # handle common string representations
        if isinstance(value, str):
            v = value.strip()
            if v == "" or v.lower() == "null" or v == "0":
                return None
            try:
                return [int(v)]
            except Exception:
                return [v]

        # if single int
        if isinstance(value, int):
            if value == 0:
                return None
            return [value]

        # if it's a list-like (QueryDict yields lists)
        if isinstance(value, (list, tuple)):
            cleaned = []
            for v in value:
                if v is None:
                    continue
                if isinstance(v, str):
                    s = v.strip()
                    if s == "" or s.lower() == "null" or s == "0":
                        continue
                    try:
                        cleaned.append(int(s))
                    except Exception:
                        cleaned.append(s)
                elif isinstance(v, int):
                    if v == 0:
                        continue
                    cleaned.append(v)
                else:
                    cleaned.append(v)
            return cleaned if cleaned else None

        # fallback - return as-is
        return value

    def update(self, instance, validated_data):
        files_data = validated_data.pop("files", [])
        contacts_data = validated_data.pop("contacts", [])
        users_data = validated_data.pop("user", None) or validated_data.pop("users", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # update M2M users if provided
        if users_data is not None:
            User = get_user_model()
            try:
                user_qs = User.objects.filter(pk__in=users_data)
                instance.user.set(user_qs)
            except Exception:
                try:
                    instance.user.set(users_data)
                except Exception:
                    pass

        # Handle files
        existing_file_ids = [file["id"] for file in files_data if "id" in file]
        current_files = instance.files.all()

        # Delete files not included
        for file in current_files:
            if file.id not in existing_file_ids:
                file.delete()

        # Update or create
        for file_data in files_data:
            file_id = file_data.pop("id", None)
            if file_id:
                try:
                    file_instance = AgencyFiles.objects.get(id=file_id, agency=instance)
                    for attr, value in file_data.items():
                        setattr(file_instance, attr, value)
                    file_instance.save()
                except AgencyFiles.DoesNotExist:
                    continue  # or raise error
            else:
                AgencyFiles.objects.create(agency=instance, **file_data)
        # Handle contacts
        instance.contacts.all().exclude(
            id__in=[c.get("id") for c in contacts_data if "id" in c]
        ).delete()
        for contact_data in contacts_data:
            contact_id = contact_data.pop("id", None)
            if contact_id:
                AgencyContact.objects.filter(id=contact_id, agency=instance).update(
                    **contact_data
                )
            else:
                AgencyContact.objects.create(agency=instance, **contact_data)
        return instance


class OrganizationLinkSerializer(serializers.ModelSerializer):
    Main_organization_id = serializers.IntegerField(source="main_organization.id")
    Link_organization_id = serializers.IntegerField(source="link_organization.id")
    Link_organization_request = serializers.CharField(source="link_organization_request")
    main_organization_request = serializers.CharField()
    request_status = serializers.BooleanField()

    class Meta:
        model = OrganizationLink
        fields = [
            "id",
            "Main_organization_id",
            "Link_organization_id",
            "Link_organization_request",
            "main_organization_request",
            "request_status",
        ]


class ResellRequestSerializer(serializers.ModelSerializer):
    Main_organization_id = serializers.IntegerField(source="main_organization.id")
    Link_organization_id = serializers.IntegerField(source="link_organization.id")
    Item_type = serializers.CharField(source="item_type")
    Items = serializers.ListField(source="items", child=serializers.DictField(), required=False)
    reseller = serializers.BooleanField()
    status = serializers.CharField()

    class Meta:
        model = ResellRequest
        fields = [
            "id",
            "Main_organization_id",
            "Link_organization_id",
            "Item_type",
            "Items",
            "reseller",
            "status",
            "created_at",
            "updated_at",
        ]


class AgencyProfileSerializer(serializers.ModelSerializer):
    VALID_STATUSES = ("active", "inactive", "risky", "dispute")

    def validate_relationship_status(self, value):
        if value not in self.VALID_STATUSES:
            raise serializers.ValidationError(f"relationship_status must be one of {self.VALID_STATUSES}")
        return value

    def _validate_date_string(self, date_str, field_name):
        from datetime import datetime

        try:
            # allow YYYY-MM-DD or full ISO dates, but validate basic form
            datetime.strptime(date_str, "%Y-%m-%d")
        except Exception:
            raise serializers.ValidationError({field_name: f"Invalid date format, expected YYYY-MM-DD: {date_str}"})

    def validate_relation_history(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("relation_history must be a list")
        for idx, item in enumerate(value):
            if not isinstance(item, dict):
                raise serializers.ValidationError(f"relation_history[{idx}] must be an object")
            if "date" not in item or "type" not in item:
                raise serializers.ValidationError(f"relation_history[{idx}] missing required keys: date,type")
            self._validate_date_string(item.get("date"), f"relation_history[{idx}].date")
        return value

    def validate_recent_communication(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("recent_communication must be a list")
        for idx, item in enumerate(value):
            if not isinstance(item, dict):
                raise serializers.ValidationError(f"recent_communication[{idx}] must be an object")
            if "date" not in item or "type" not in item:
                raise serializers.ValidationError(f"recent_communication[{idx}] missing required keys: date,type")
            self._validate_date_string(item.get("date"), f"recent_communication[{idx}].date")
        return value

    def validate_working_with_companies(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("working_with_companies must be a list")
        for idx, item in enumerate(value):
            if not isinstance(item, dict):
                raise serializers.ValidationError(f"working_with_companies[{idx}] must be an object")
            if "organization_id" not in item or "organization_name" not in item:
                raise serializers.ValidationError(f"working_with_companies[{idx}] missing required keys: organization_id, organization_name")
        return value

    def validate_performance_summary(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("performance_summary must be an object")
        required = ["total_bookings", "on_time_payments", "late_payments"]
        for k in required:
            if k not in value:
                raise serializers.ValidationError({k: "required in performance_summary"})
        return value

    def validate_conflict_history(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("conflict_history must be a list")
        for idx, item in enumerate(value):
            if not isinstance(item, dict):
                raise serializers.ValidationError(f"conflict_history[{idx}] must be an object")
            if "date" not in item or "reason" not in item or "resolved" not in item:
                raise serializers.ValidationError(f"conflict_history[{idx}] missing required keys: date,reason,resolved")
            self._validate_date_string(item.get("date"), f"conflict_history[{idx}].date")
        return value

    def create(self, validated_data, created_by=None, updated_by=None, **kwargs):
        # set audit fields if provided
        if created_by is not None:
            validated_data["created_by"] = created_by
        if updated_by is not None:
            validated_data["updated_by"] = updated_by
        return super().create(validated_data)

    def update(self, instance, validated_data, updated_by=None, **kwargs):
        if updated_by is not None:
            validated_data["updated_by"] = updated_by
        return super().update(instance, validated_data)

    class Meta:
        model = AgencyProfile
        fields = [
            "id",
            "agency",
            "relationship_status",
            "relation_history",
            "working_with_companies",
            "performance_summary",
            "recent_communication",
            "conflict_history",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class RuleSerializer(serializers.ModelSerializer):
    ALLOWED_RULE_TYPES = [choice[0] for choice in getattr(Rule, 'RULE_TYPE_CHOICES')]
    ALLOWED_PAGES = [
        "booking_page",
        "agent_portal",
        "hotel_page",
        "transport_page",
        "visa_page",
        "payment_page",
        "dashboard",
    ]
    SUPPORTED_LANGS = [choice[0] for choice in getattr(Rule, 'SUPPORTED_LANGUAGES')]

    class Meta:
        model = Rule
        fields = [
            "id",
            "title",
            "description",
            "rule_type",
            "pages_to_display",
            "is_active",
            "language",
            "version",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "version", "created_by", "updated_by", "created_at", "updated_at"]

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("title is required")
        return value

    def validate_description(self, value):
        if not value or len(value.strip()) < 10:
            raise serializers.ValidationError("description must be at least 10 characters")
        return value

    def validate_rule_type(self, value):
        if value not in self.ALLOWED_RULE_TYPES:
            raise serializers.ValidationError(f"rule_type must be one of {self.ALLOWED_RULE_TYPES}")
        return value

    def validate_pages_to_display(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("pages_to_display must be a list")
        for p in value:
            if p not in self.ALLOWED_PAGES:
                raise serializers.ValidationError(f"Invalid page identifier: {p}")
        return value

    def validate_language(self, value):
        if value not in self.SUPPORTED_LANGS:
            raise serializers.ValidationError(f"language must be one of {self.SUPPORTED_LANGS}")
        return value

    def create(self, validated_data):
        # created_by/updated_by should be set by view
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # increment version on update
        instance.version = instance.version + 1 if instance.version is not None else 1
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        return instance


class WalkInBookingSerializer(serializers.ModelSerializer):
    ALLOWED_PAYMENT_MODES = ["cash", "bank", "card"]

    class Meta:
        model = WalkInBooking
        fields = [
            "id",
            "booking_no",
            "hotel",
            "organization",
            "booking_type",
            "customer",
            "room_details",
            "status",
            "advance_paid",
            "total_amount",
            "payment_mode",
            "remarks",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "booking_no", "total_amount", "created_at", "updated_at"]

    def validate_hotel(self, value):
        # ensure hotel exists
        if not Hotels.objects.filter(id=value.id).exists():
            raise serializers.ValidationError("hotel not found")
        return value

    def validate_organization(self, value):
        # basic existence check
        if not Organization.objects.filter(id=value.id).exists():
            raise serializers.ValidationError("organization not found")
        return value

    def validate_booking_type(self, value):
        if value != "walk_in":
            raise serializers.ValidationError("booking_type must be 'walk_in'")
        return value

    def validate_advance_paid(self, value):
        if value is None:
            return 0
        if value < 0:
            raise serializers.ValidationError("advance_paid must be >= 0")
        return value

    def validate_payment_mode(self, value):
        if value and value not in self.ALLOWED_PAYMENT_MODES:
            raise serializers.ValidationError(f"payment_mode must be one of {self.ALLOWED_PAYMENT_MODES}")
        return value

    def validate_room_details(self, value):
        if not isinstance(value, list) or len(value) == 0:
            raise serializers.ValidationError("room_details must be a non-empty list")
        from datetime import datetime

        for idx, item in enumerate(value):
            if not isinstance(item, dict):
                raise serializers.ValidationError(f"room_details[{idx}] must be an object")
            required = ["room_id", "price_per_night", "check_in", "check_out"]
            for r in required:
                if r not in item:
                    raise serializers.ValidationError({f"room_details[{idx}].{r}": "required"})
            # validate dates
            try:
                ci = datetime.strptime(item.get("check_in"), "%Y-%m-%d")
                co = datetime.strptime(item.get("check_out"), "%Y-%m-%d")
            except Exception:
                raise serializers.ValidationError({f"room_details[{idx}].date": "invalid date format, use YYYY-MM-DD"})
            if co <= ci:
                raise serializers.ValidationError({f"room_details[{idx}]": "check_out must be after check_in"})
            # optional: verify room exists
            if not HotelRooms.objects.filter(id=item.get("room_id")).exists():
                raise serializers.ValidationError({f"room_details[{idx}].room_id": "room not found"})

        return value

    def create(self, validated_data):
        # compute total_amount from room_details
        from datetime import datetime

        total = 0
        for item in validated_data.get("room_details", []):
            ci = datetime.strptime(item.get("check_in"), "%Y-%m-%d")
            co = datetime.strptime(item.get("check_out"), "%Y-%m-%d")
            nights = (co - ci).days
            price = float(item.get("price_per_night", 0))
            discount = float(item.get("discount", 0) or 0)
            total += max(0, (price - discount) * nights)

        validated_data["total_amount"] = total

        # created_by / updated_by should be passed in context (request.user.id) by the view
        user_id = None
        request = self.context.get("request")
        if request and getattr(request, "user", None) and request.user.is_authenticated:
            user_id = request.user.id
        if user_id:
            validated_data["created_by"] = user_id
            validated_data["updated_by"] = user_id

        instance = super().create(validated_data)

        # placeholder: mark rooms occupied, create ledger entries in view/service layer
        return instance