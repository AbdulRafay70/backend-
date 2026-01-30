from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
import json
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from users.permissions import PermissionByAction
from django.db.models import Q
from drf_spectacular.utils import extend_schema, OpenApiParameter, extend_schema_view, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from .models import Ticket, Hotels, HotelRooms, HotelCategory, BedType
from booking.models import AllowedReseller
from .serializers import (
    TicketSerializer,
    TicketListSerializer,
    HotelsSerializer,
    HotelRoomsSerializer,
    HotelCategorySerializer,
    BedTypeSerializer,
)
from django.utils import timezone
from users.models import GroupExtension
from users.permissions import PermissionByAction
from drf_spectacular.openapi import AutoSchema



@extend_schema_view(
    list=extend_schema(
        parameters=[
            OpenApiParameter(
                name='organization',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=False,
                description='Organization ID to filter tickets (required for non-superusers)'
            ),
            OpenApiParameter(
                name='include_past',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=False,
                description="Set to '1' or 'true' to include past/expired tickets in the list",
            ),
        ],
        responses=TicketListSerializer(many=True),
        description='List all available tickets. Superusers see all tickets, other users need to provide organization parameter.'
    ),
    retrieve=extend_schema(
        parameters=[
            OpenApiParameter(
                name='organization',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=False,
                description='Organization ID (required for non-superusers)'
            ),
        ],
        description='Get detailed information about a specific ticket'
    ),
    create=extend_schema(
        request=TicketSerializer,
        responses=TicketSerializer,
        description='Create a ticket and return the created ticket representation',
        examples=[
            OpenApiExample(
                'Ticket create example',
                value={
                    "trip_details": [
                        {
                            "airline": {"id": 100, "name": "Example Air"},
                            "flight_number": "string",
                            "departure_date_time": "2025-11-12T14:17:44.827Z",
                            "arrival_date_time": "2025-11-12T14:17:44.827Z",
                            "departure_city": {"id": 0, "name": "Departure City"},
                            "arrival_city": {"id": 0, "name": "Arrival City"}
                        }
                    ],
                    "stopover_details": [
                        {
                            "airline": {"id": 200, "name": "StopAir"},
                            "flight_number": "202",
                            "departure_date_time": "2025-12-11T19:21:00Z",
                            "arrival_date_time": "2025-12-11T19:21:00Z",
                            "arrival_city": {"id": 6, "name": "Lahore"},
                            "stopover_duration": "6d",
                            "trip_type": "Departure",
                            "stopover_city": {"id": 5, "name": "karachi"}
                        }
                    ],
                    "adult_fare": 0,
                    "child_fare": 0,
                    "infant_fare": 0,
                    "baggage_weight": 0,
                    "baggage_pieces": 2147483647,
                    "is_refundable": True,
                    "is_meal_included": True,
                    "pnr": "string",
                    "status": "available",
                    "total_seats": 2147483647,
                    "left_seats": 2147483647,
                    "booked_tickets": 2147483647,
                    "confirmed_tickets": 2147483647,
                    "adult_purchase_price": 0,
                    "child_purchase_price": 0,
                    "infant_purchase_price": 0,
                    "is_umrah_seat": True,
                    "trip_type": "string",
                    "owner_organization_id": 2147483647,
                    "reselling_allowed": True,
                    "branch": 0
                },
                request_only=True,
            )
        ]
    ),
    update=extend_schema(
        request=TicketSerializer,
        responses=TicketSerializer,
        description='Update a ticket and return the updated ticket representation'
    ),
    partial_update=extend_schema(
        request=TicketSerializer,
        responses=TicketSerializer,
        description='Partially update a ticket and return the updated ticket representation'
    ),
)
class TicketViewSet(ModelViewSet):
    schema = AutoSchema()
    # default serializer (used for create/retrieve/update)
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated, PermissionByAction]
    
    # RBAC Permission Map
    # Allow viewing tickets if user has ticket permissions OR package permissions
    # (since creating packages requires selecting tickets)
    # Also allow agents to view tickets
    permission_map = {
        'list': ['tickets.view_ticket_admin', 'packages.view_package_admin', 'packages.add_package_admin', 'tickets.view_ticket_agent'],
        'retrieve': ['tickets.view_ticket_admin', 'packages.view_package_admin', 'packages.add_package_admin', 'tickets.view_ticket_agent'],
        'create': 'tickets.add_ticket_admin',
        'update': 'tickets.edit_ticket_admin',
        'partial_update': 'tickets.edit_ticket_admin',
        'destroy': 'tickets.delete_ticket_admin',
    }

    def get_serializer_class(self):
        # Use a compact serializer for list responses to return the trimmed schema
        if self.action == 'list':
            return TicketListSerializer
        return super().get_serializer_class()

    def get_queryset(self):
        from organization.models import OrganizationLink
        
        # Always require organization parameter
        organization_id = self.request.query_params.get("organization")
        # Optional: allow callers to opt-in to include past tickets
        include_past = self.request.query_params.get("include_past")
        include_past_flag = str(include_past).lower() in ("1", "true", "yes", "on") if include_past is not None else False
        
        # Debug logging
        print(f"DEBUG TicketViewSet.get_queryset - organization: {organization_id}")
        print(f"DEBUG TicketViewSet.get_queryset - All query params: {dict(self.request.query_params)}")
        
        if not organization_id:
            raise PermissionDenied("Missing 'organization' query parameter.")
        
        # Check if user is superuser
        if self.request.user.is_superuser:
            # Superadmin can see tickets for the specified organization
            pass  # Continue with organization filtering
        else:
            # For regular users, check if they have access to this organization
            user_organizations = self.request.user.organizations.values_list('id', flat=True)
            if int(organization_id) not in user_organizations:
                raise PermissionDenied("You don't have access to this organization.")
        
        # Get linked organizations
        linked_org_ids = OrganizationLink.get_linked_organizations(int(organization_id))
        
        # Include own organization and linked organizations
        allowed_org_ids = {int(organization_id)} | linked_org_ids
        
        # Build allowed owner organization ids based on AllowedReseller entries
        # Query AllowedReseller for the calling organization only (what this org is allowed to resell)
        allowed_owner_org_ids = []
        allowed_ticket_ids = set()
        try:
            allowed_qs = AllowedReseller.objects.filter(
                reseller_company_id=int(organization_id),
                requested_status_by_reseller="ACCEPTED",
            )
            # filter by allowed_types containing GROUP_TICKETS
            for ar in allowed_qs:
                inv = getattr(ar, "inventory_owner_company", None)
                if inv is None:
                    continue
                org_id = getattr(inv, "organization_id", None) or getattr(inv, "main_organization_id", None) or None
                if org_id:
                    try:
                        items = getattr(ar, "allowed_items", None) or []
                    except Exception:
                        items = []

                    if items:
                        for it in items:
                            try:
                                if (it.get("type") == "ticket") and it.get("id"):
                                    allowed_ticket_ids.add(int(it.get("id")))
                            except Exception:
                                continue
                    else:
                        types = ar.allowed_types or []
                        if "GROUP_TICKETS" in types:
                            allowed_owner_org_ids.append(org_id)

        except Exception:
            allowed_owner_org_ids = []

        # Include own organization and any explicitly allowed owner organizations
        owner_ids = set(allowed_owner_org_ids) | {int(organization_id)}

        # Base queryset: tickets that belong to owner ids or are explicitly allowed by id
        queryset = Ticket.objects.filter(
            Q(organization_id__in=owner_ids) | Q(owner_organization_id__in=owner_ids) | Q(id__in=list(allowed_ticket_ids))
        )

        # Exclude inactive tickets (status == 'inactive')
        queryset = queryset.exclude(status="inactive")

        # Exclude tickets with no available seats - DISABLED: Show sold out tickets
        # queryset = queryset.filter(left_seats__gt=0)

        # Exclude tickets with passed departure dates by default. Accept tickets that either
        # have future trip_details departure datetimes or have a ticket-level
        # departure_date in the future (legacy data may use ticket fields).
        # If `include_past` is provided and truthy, skip this time-based filter.
        if not include_past_flag:
            now = timezone.now()
            time_filter = (
                Q(trip_details__departure_date_time__gte=now) |
                Q(departure_date__gte=now.date())
            )
            queryset = queryset.filter(time_filter)

        # Separate own organization from linked organizations
        own_org_id = int(organization_id)
        linked_org_ids_only = linked_org_ids - {own_org_id}

        # Base filters: always include tickets that belong to the calling org (own org)
        base_filter = Q(organization_id=own_org_id) | Q(owner_organization_id=own_org_id)

        # Allowed owners' tickets (when AllowedReseller grants org-level access)
        allowed_owners_filter = Q(organization_id__in=allowed_owner_org_ids) | Q(owner_organization_id__in=allowed_owner_org_ids)

        # For linked organizations, only include tickets if owner allows reselling.
        # Some tickets store the owner in `owner_organization_id` (legacy/alternate
        # schema), so check both `organization_id` and `owner_organization_id`.
        linked_filter = (
            (Q(organization_id__in=linked_org_ids_only) | Q(owner_organization_id__in=linked_org_ids_only))
            & Q(reselling_allowed=True)
        )

        # General resellable tickets from other orgs (exclude own org)
        resell_filter = Q(reselling_allowed=True) & ~Q(organization_id=own_org_id)

        # Final queryset: own tickets, tickets from allowed owner orgs, linked org tickets with reselling_allowed,
        # general resellable tickets, or explicit allowed ticket ids
        queryset = queryset.filter(
            base_filter | allowed_owners_filter | linked_filter | resell_filter | Q(id__in=list(allowed_ticket_ids))
        ).distinct()

        return queryset


class HotelsViewSet(ModelViewSet):
    schema = AutoSchema()
    serializer_class = HotelsSerializer
    permission_classes = [IsAuthenticated]  # Remove PermissionByAction - allow all authenticated users
    
    # Accept multipart/form-data for file uploads in create/update
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        """Filter hotels based on user's organization access"""
        user = self.request.user
        
        # Superusers see all hotels
        if user.is_superuser:
            return Hotels.objects.all()
        
        # Get user's accessible organizations
        from organization.models import Organization, Branch, Agency
        
        # 1. Direct organization membership
        user_orgs = user.organizations.all()
        
        # 2. Through branches
        user_branches = Branch.objects.filter(user=user)
        branch_orgs = Organization.objects.filter(branches__in=user_branches)
        
        # 3. Through agencies
        user_agencies = Agency.objects.filter(user=user)
        agency_orgs = Organization.objects.filter(branches__agencies__in=user_agencies)
        
        # Combine all accessible organizations
        accessible_orgs = user_orgs | branch_orgs | agency_orgs
        accessible_org_ids = accessible_orgs.values_list('id', flat=True)
        
        # Return hotels belonging to accessible organizations
        return Hotels.objects.filter(organization_id__in=accessible_org_ids)

    def _parse_json_fields(self, data):
        """Helper to parse JSON-encoded strings in multipart form data into Python structures."""
        # Convert Django QueryDict (from multipart/form-data) into a plain dict
        simple = {}
        try:
            if hasattr(data, 'getlist'):
                for k in data.keys():
                    vals = data.getlist(k)
                    if len(vals) > 1:
                        simple[k] = vals
                    else:
                        simple[k] = vals[0]
            else:
                # standard dict-like
                simple = dict(data)
        except Exception:
            # fallback: shallow copy
            try:
                simple = dict(data.copy())
            except Exception:
                simple = {}

        # Parse JSON-encoded nested fields which are commonly sent as strings in multipart forms
        for key in ('prices', 'contact_details', 'photos'):
            if key in simple and isinstance(simple.get(key), str):
                try:
                    simple[key] = json.loads(simple.get(key))
                except Exception:
                    # leave as-is; serializer will raise a validation error if malformed
                    pass

        return simple

    def create(self, request, *args, **kwargs):
        # Preprocess multipart fields so nested lists are parsed from JSON strings
        data = self._parse_json_fields(request.data)
        # Debug: log incoming request metadata to help diagnose multipart issues
        try:
            print('DEBUG HotelsViewSet.create - Content-Type:', request.content_type)
            print('DEBUG HotelsViewSet.create - FILES keys:', list(request.FILES.keys()))
            print('DEBUG HotelsViewSet.create - raw prices field type:', type(request.data.get('prices')),
                  'value:', request.data.get('prices'))
        except Exception:
            pass

        serializer = self.get_serializer(data=data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            # Log serializer errors for easier debugging
            try:
                print('DEBUG HotelsViewSet.create - serializer errors:', getattr(serializer, 'errors', str(e)))
            except Exception:
                pass
            raise
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = self._parse_json_fields(request.data)
        # Debug: log incoming request metadata to help diagnose multipart issues
        try:
            print('DEBUG HotelsViewSet.update - Content-Type:', request.content_type)
            print('DEBUG HotelsViewSet.update - FILES keys:', list(request.FILES.keys()))
            print('DEBUG HotelsViewSet.update - raw prices field type:', type(request.data.get('prices')),
                  'value:', request.data.get('prices'))
        except Exception:
            pass

        # Support a convenience single-photo delete via multipart/form-data or JSON payload
        # Clients may send { "remove_photo_id": 7 } to remove that HotelPhoto for this hotel.
        try:
            if 'remove_photo_id' in data and data.get('remove_photo_id'):
                from .models import HotelPhoto
                try:
                    pid = int(data.get('remove_photo_id'))
                    HotelPhoto.objects.filter(id=pid, hotel=instance).delete()
                except Exception:
                    # ignore errors and continue to normal update flow
                    pass
                # return the updated representation
                serializer = self.get_serializer(instance)
                return Response(serializer.data)
        except Exception:
            # swallow and continue
            pass

        serializer = self.get_serializer(instance, data=data, partial=partial)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            try:
                print('DEBUG HotelsViewSet.update - serializer errors:', getattr(serializer, 'errors', str(e)))
            except Exception:
                pass
            raise
        self.perform_update(serializer)
        return Response(serializer.data)

    def get_queryset(self):
        from organization.models import Organization, OrganizationLink, Branch, Agency
        
        # Debugging previously added here was removed.
        # If further investigation is needed, enable structured logging instead of prints.

        # Check if user is superuser
        if self.request.user.is_superuser:
            # Superadmin can see all hotels
            return Hotels.objects.filter(is_active=True).prefetch_related(
                'prices', 'contact_details', 'photos'
            )
        
        # Accept either `owner_organization` (preferred) or legacy `organization` query param
        owner_org_id = self.request.query_params.get("owner_organization") or self.request.query_params.get("organization")

        # Check if user has access to this organization (including branch/agency linkage)
        user_orgs = self.request.user.organizations.all()
        user_branches = Branch.objects.filter(user=self.request.user)
        branch_orgs = Organization.objects.filter(branches__in=user_branches)
        user_agencies = Agency.objects.filter(user=self.request.user)
        agency_orgs = Organization.objects.filter(branches__agencies__in=user_agencies)
        accessible_orgs = user_orgs | branch_orgs | agency_orgs
        accessible_org_ids = list(accessible_orgs.values_list('id', flat=True))

        if not owner_org_id:
             # If no specific organization context is provided, return hotels from ALL accessible organizations
             return Hotels.objects.filter(is_active=True, organization_id__in=accessible_org_ids).prefetch_related('prices', 'contact_details', 'photos')
        
        # If the provided ID is an agency ID instead of org ID, resolve it to org ID
        
        # If the provided ID is an agency ID instead of org ID, resolve it to org ID
        # Check if it's an agency the user has access to
        try:
            agency = Agency.objects.filter(id=int(owner_org_id), user=self.request.user).first()
            if agency and agency.branch and agency.branch.organization:
                actual_org_id = agency.branch.organization.id
                print(f"DEBUG HotelsViewSet - Resolved agency {owner_org_id} to organization {actual_org_id}")
                owner_org_id = actual_org_id
        except (ValueError, AttributeError):
            pass
        
        if int(owner_org_id) not in accessible_org_ids:
            raise PermissionDenied("You don't have access to this organization.")

        # Get linked organizations
        linked_org_ids = OrganizationLink.get_linked_organizations(int(owner_org_id))
        
        # Include hotels from the user's organization and linked organizations
        allowed_org_ids = {int(owner_org_id)} | linked_org_ids
        
        # Build allowed owner organization ids based on AllowedReseller entries
        allowed_owner_org_ids = []
        allowed_hotel_ids = set()
        try:
            # Query AllowedReseller for the calling organization only
            allowed_qs = AllowedReseller.objects.filter(
                reseller_company_id=int(owner_org_id),
                requested_status_by_reseller="ACCEPTED",
            )
            # filter by allowed_types containing GROUP_HOTELS
            for ar in allowed_qs:
                inv = getattr(ar, "inventory_owner_company", None)
                if inv is None:
                    continue
                org_id = getattr(inv, "organization_id", None) or getattr(inv, "main_organization_id", None) or None
                if org_id:
                    try:
                        items = getattr(ar, "allowed_items", None) or []
                    except Exception:
                        items = []

                    if items:
                        for it in items:
                            try:
                                if (it.get("type") == "hotel") and it.get("id"):
                                    allowed_hotel_ids.add(int(it.get("id")))
                            except Exception:
                                continue
                    else:
                        types = ar.allowed_types or []
                        # The approval flow uses tokens like 'HOTELS' for hotel approvals
                        # (see organization.views.approve mapping). Accept either the
                        # legacy 'GROUP_HOTELS' token or the 'HOTELS' token here.
                        if "GROUP_HOTELS" in types or "HOTELS" in types:
                            allowed_owner_org_ids.append(org_id)

        except Exception:
            allowed_owner_org_ids = []

        # Include own organization and any explicitly allowed owner organizations
        owner_ids = set(allowed_owner_org_ids) | {int(owner_org_id)}

        # Start from all active hotels (we'll apply OR-filters below).
        # Using a broad base queryset ensures the OR-combined filters below can
        # include hotels owned by other organizations (e.g., linked orgs)
        # when those owners have `reselling_allowed=True`.
        queryset = Hotels.objects.filter(is_active=True)

        # Separate own organization
        own_org_id = int(owner_org_id)

        # Base filter: always show hotels from own organization
        base_filter = Q(organization_id=own_org_id)

        # Allowed owners' hotels (when AllowedReseller grants org-level access)
        # Some models may not have `owner_organization_id`; guard dynamically.
        hotel_field_names = [f.name for f in Hotels._meta.get_fields()]
        has_owner_field = 'owner_organization_id' in hotel_field_names

        allowed_owners_filter = Q(organization_id__in=allowed_owner_org_ids)
        if has_owner_field:
            allowed_owners_filter = allowed_owners_filter | Q(owner_organization_id__in=allowed_owner_org_ids)

        # For linked organizations, include hotels owned by linked orgs that have
        # set `reselling_allowed=True`. Build the ownership check conditionally
        # depending on whether `owner_organization_id` exists on the model.
        linked_org_ids_only = linked_org_ids - {own_org_id}
        org_check = Q(organization_id__in=linked_org_ids_only)
        if has_owner_field:
            org_check = org_check | Q(owner_organization_id__in=linked_org_ids_only)

        linked_filter = org_check & Q(reselling_allowed=True)

        # Final filter: own hotels, explicitly allowed owner hotels, linked orgs' resellable hotels,
        # or explicitly allowed hotel ids.
        final_filter = (
            base_filter |
            allowed_owners_filter |
            linked_filter |
            Q(id__in=list(allowed_hotel_ids))
        )

        # DEBUG: print internal state to help diagnose empty responses
        try:
            print("DEBUG HotelsViewSet - organization:", own_org_id)
            print("DEBUG HotelsViewSet - linked_org_ids:", list(linked_org_ids))
            print("DEBUG HotelsViewSet - linked_org_ids_only:", list(linked_org_ids_only))
            print("DEBUG HotelsViewSet - allowed_owner_org_ids:", allowed_owner_org_ids)
            print("DEBUG HotelsViewSet - allowed_hotel_ids:", list(allowed_hotel_ids))
            print("DEBUG HotelsViewSet - final_filter:", final_filter)
        except Exception:
            pass

        result_qs = queryset.filter(final_filter).distinct().prefetch_related('prices', 'contact_details', 'photos')
        try:
            print("DEBUG HotelsViewSet - result_count:", result_qs.count())
        except Exception:
            pass

        return result_qs


class HotelRoomsViewSet(ModelViewSet):
    schema = AutoSchema()
    serializer_class = HotelRoomsSerializer
    permission_classes = [IsAuthenticated, PermissionByAction]
    
    # RBAC Permission Map
    permission_map = {
        'list': 'auth.view_hotel_rooms_admin',
        'retrieve': 'auth.view_hotel_rooms_admin',
        'create': 'auth.add_hotel_rooms_admin',
        'update': 'auth.edit_hotel_rooms_admin',
        'partial_update': 'auth.edit_hotel_rooms_admin',
        'destroy': 'auth.delete_hotel_rooms_admin',
    }

    def get_queryset(self):
        from organization.models import OrganizationLink
        # We should return HotelRooms objects (not Hotels) and allow filtering by `hotel` or `owner_organization`.
        qs = HotelRooms.objects.select_related('hotel').all()

        # Superuser sees all rooms
        if self.request.user.is_superuser:
            return qs

        # If a specific hotel is requested, return rooms for that hotel
        hotel_id = self.request.query_params.get('hotel')
        owner_org_id = self.request.query_params.get('owner_organization')

        if hotel_id:
            try:
                return qs.filter(hotel_id=int(hotel_id))
            except Exception:
                return HotelRooms.objects.none()

        # Require owner_organization parameter for non-superusers
        if not owner_org_id:
            raise PermissionDenied("Missing 'owner_organization' query parameter.")

        # Ensure the requesting user has access to the organization
        user_organizations = self.request.user.organizations.values_list('id', flat=True)
        if int(owner_org_id) not in user_organizations:
            raise PermissionDenied("You don't have access to this organization.")

        # Return rooms for hotels owned by the owner organization
        return qs.filter(hotel__organization_id=int(owner_org_id))


class HotelCategoryViewSet(ModelViewSet):
    schema = AutoSchema()
    """API to manage hotel categories (CRUD). Supports optional `owner_organization` query param to scope categories."""
    serializer_class = HotelCategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = HotelCategory.objects.all().order_by('name')
        org = self.request.query_params.get('owner_organization')
        if org:
            try:
                qs = qs.filter(organization_id=int(org))
            except Exception:
                pass
        return qs

    def perform_create(self, serializer):
        # allow creating org-scoped categories by passing ?owner_organization= on the request
        org = self.request.query_params.get('owner_organization')
        from django.utils.text import slugify
        data = serializer.validated_data if hasattr(serializer, 'validated_data') else {}
        slug_val = data.get('slug') or None
        if not slug_val and data.get('name'):
            slug_val = slugify(data.get('name'))

        if org:
            try:
                return serializer.save(organization_id=int(org), slug=slug_val)
            except Exception:
                pass
        return serializer.save(slug=slug_val)


class BedTypeViewSet(ModelViewSet):
    schema = AutoSchema()
    """API to manage bed types (CRUD). Supports optional `organization` query param to scope bed types."""
    serializer_class = BedTypeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = BedType.objects.all().order_by('name')
        org = self.request.query_params.get('organization')
        if org:
            try:
                # Return both organization-specific and global (null organization) bed types
                qs = qs.filter(Q(organization_id=int(org)) | Q(organization__isnull=True))
            except Exception:
                pass
        return qs

    def perform_create(self, serializer):
        # Allow creating org-scoped bed types by passing ?organization= on the request
        org = self.request.query_params.get('organization')
        from django.utils.text import slugify
        data = serializer.validated_data if hasattr(serializer, 'validated_data') else {}
        slug_val = data.get('slug') or None
        if not slug_val and data.get('name'):
            slug_val = slugify(data.get('name'))

        if org:
            try:
                return serializer.save(organization_id=int(org), slug=slug_val)
            except Exception:
                pass
        return serializer.save(slug=slug_val)
