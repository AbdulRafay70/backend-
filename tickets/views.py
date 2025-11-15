from rest_framework.viewsets import ModelViewSet
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from drf_spectacular.utils import extend_schema, OpenApiParameter, extend_schema_view
from drf_spectacular.types import OpenApiTypes

from .models import Ticket, Hotels,HotelRooms
from booking.models import AllowedReseller
from .serializers import TicketSerializer, TicketListSerializer, HotelsSerializer, HotelRoomsSerializer
from django.utils import timezone
from users.models import GroupExtension
from django.db.models.deletion import ProtectedError
from rest_framework.response import Response
from rest_framework import status


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
)
class TicketViewSet(ModelViewSet):
    # default serializer (used for create/retrieve/update)
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        # Use a compact serializer for list responses to return the trimmed schema
        if self.action == 'list':
            return TicketListSerializer
        return super().get_serializer_class()

    def get_queryset(self):
        from organization.models import OrganizationLink
        
        # Always require organization parameter
        organization_id = self.request.query_params.get("organization")
        
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

        # Exclude tickets with no available seats
        queryset = queryset.filter(left_seats__gt=0)

        # Exclude tickets with passed departure dates. Accept tickets that either
        # have future trip_details departure datetimes or have a ticket-level
        # departure_date in the future (legacy data may use ticket fields).
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
    serializer_class = HotelsSerializer
    permission_classes = [IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        # Override destroy to provide a friendly error when deletion is blocked
        # by protected related objects (e.g., HotelRooms with on_delete=PROTECT)
        try:
            # Debug: print requesting user and kwargs for diagnosis
            try:
                print(f"DEBUG HotelsViewSet.destroy called by user id={getattr(request.user, 'id', None)} username={getattr(request.user, 'username', None)} kwargs={kwargs}")
            except Exception:
                pass

            return super().destroy(request, *args, **kwargs)
        except ProtectedError as pe:
            # Return 409 Conflict with a helpful message instead of 500
            print("DEBUG HotelsViewSet.destroy ProtectedError:", pe)
            return Response(
                {
                    "detail": (
                        "Cannot delete hotel because related objects exist (rooms, bookings, etc.). "
                        "Remove or reassign those objects before deleting the hotel."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )
        except Exception as exc:
            # Log unexpected exception server-side and return 500 with generic message + error (for debugging)
            try:
                import traceback

                traceback.print_exc()
            except Exception:
                pass
            # Include exception string in response for debugging; remove in production
            try:
                err_msg = str(exc)
            except Exception:
                err_msg = "<unrepresentable error>"
            print(f"DEBUG HotelsViewSet.destroy unexpected exception: {err_msg}")
            return Response(
                {"detail": "Internal server error while deleting hotel.", "error": err_msg},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def get_queryset(self):
        from organization.models import OrganizationLink
        
        # Check if user is superuser
        if self.request.user.is_superuser:
            # Superadmin can see all hotels
            return Hotels.objects.filter(is_active=True).prefetch_related(
                'prices', 'contact_details', 'photos'
            )
        
        # Always require organization parameter
        organization_id = self.request.query_params.get("organization")
        if not organization_id:
            raise PermissionDenied("Missing 'organization' query parameter.")
        
        # Check if user has access to this organization
        user_organizations = self.request.user.organizations.values_list('id', flat=True)
        if int(organization_id) not in user_organizations:
            raise PermissionDenied("You don't have access to this organization.")

        # Get linked organizations
        linked_org_ids = OrganizationLink.get_linked_organizations(int(organization_id))
        
        # Include hotels from the user's organization and linked organizations
        allowed_org_ids = {int(organization_id)} | linked_org_ids
        
        # Build allowed owner organization ids based on AllowedReseller entries
        allowed_owner_org_ids = []
        allowed_hotel_ids = set()
        try:
            # Query AllowedReseller for the calling organization only
            allowed_qs = AllowedReseller.objects.filter(
                reseller_company_id=int(organization_id),
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
        owner_ids = set(allowed_owner_org_ids) | {int(organization_id)}

        # Start from all active hotels (we'll apply OR-filters below).
        # Using a broad base queryset ensures the OR-combined filters below can
        # include hotels owned by other organizations (e.g., linked orgs)
        # when those owners have `reselling_allowed=True`.
        queryset = Hotels.objects.filter(is_active=True)

        # Separate own organization
        own_org_id = int(organization_id)

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
    serializer_class = HotelRoomsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from organization.models import OrganizationLink
        # We should return HotelRooms objects (not Hotels) and allow filtering by `hotel` or `organization`.
        qs = HotelRooms.objects.select_related('hotel').all()

        # Superuser sees all rooms
        if self.request.user.is_superuser:
            return qs

        # If a specific hotel is requested, return rooms for that hotel
        hotel_id = self.request.query_params.get('hotel')
        organization_id = self.request.query_params.get('organization')

        if hotel_id:
            try:
                return qs.filter(hotel_id=int(hotel_id))
            except Exception:
                return HotelRooms.objects.none()

        # Require organization parameter for non-superusers
        if not organization_id:
            raise PermissionDenied("Missing 'organization' query parameter.")

        # Ensure the requesting user has access to the organization
        user_organizations = self.request.user.organizations.values_list('id', flat=True)
        if int(organization_id) not in user_organizations:
            raise PermissionDenied("You don't have access to this organization.")

        # Return rooms for hotels owned by the organization
        return qs.filter(hotel__organization_id=int(organization_id))