from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from rest_framework.views import APIView

from .models import Organization, Branch, Agency, OrganizationLink, AgencyProfile
from .serializers import (
    OrganizationSerializer,
    BranchSerializer,
    AgencySerializer,
    OrganizationLinkSerializer,
    AgencyProfileSerializer,
    ResellRequestSerializer,
)
from .models import ResellRequest
from .models import Rule
from .serializers import RuleSerializer
from rest_framework.permissions import IsAdminUser, AllowAny
from .permissions import IsOrgStaff
from rest_framework import generics
from django.shortcuts import get_object_or_404
from django.db.utils import NotSupportedError
from django.db import transaction
from django.db.models import Sum
from .serializers import WalkInBookingSerializer
from .models import WalkInBooking
from tickets.models import HotelRooms, Hotels
from decimal import Decimal
from datetime import datetime


def _user_belongs_to_org(user, org_id):
    try:
        org_id_int = int(org_id)
    except Exception:
        return False
    if user.is_superuser:
        return True
    return any(o.id == org_id_int for o in user.organizations.all())


class OrganizationLinkViewSet(viewsets.ModelViewSet):
    """
    Manage linking between organizations.
    - Only Super Admins can create link requests.
    - Both organizations must accept for request_status to become True.
    - Either side can reject.
    """
    serializer_class = OrganizationLinkSerializer
    queryset = OrganizationLink.objects.all().order_by("-created_at")
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Allow filtering links by organization_id"""
        from django.db import connection
        # Force database connection refresh to avoid transaction isolation issues
        connection.close()
        
        organization_id = self.request.query_params.get("organization_id")
        queryset = OrganizationLink.objects.all().order_by("-created_at")
        if organization_id:
            queryset = queryset.filter(
                Q(main_organization_id=organization_id) |
                Q(link_organization_id=organization_id)
            )
        return queryset

    def list(self, request, *args, **kwargs):
        """List organization links with debugging output"""
        from datetime import datetime
        current_time = datetime.now().strftime("%d/%b/%Y %H:%M:%S")
        
        print(f"[{current_time}] \"GET /api/organization-links/\" - User: {request.user.username if request.user.is_authenticated else 'Anonymous'}")
        print(f"[{current_time}] Query parameters: {dict(request.query_params)}")
        print(f"[{current_time}] Full request GET data: {dict(request.GET)}")
        
        # Get the queryset
        queryset = self.get_queryset()
        print(f"[{current_time}] Queryset SQL: {queryset.query}")
        print(f"[{current_time}] Found {queryset.count()} organization links in database")
        
        # Serialize the data
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        
        print(f"[{current_time}] Serialized data contains {len(data)} items:")
        for i, item in enumerate(data, 1):
            # Get the actual model instance to show more details
            link_obj = queryset[i-1] if i-1 < len(queryset) else None
            if link_obj:
                print(f"[{current_time}] Item {i}: DB_ID={link_obj.id}, Main={item['Main_organization_id']} ({link_obj.main_organization.name} - {link_obj.main_organization.org_code}), Link={item['Link_organization_id']} ({link_obj.link_organization.name} - {link_obj.link_organization.org_code}), Status={item['request_status']}")
            else:
                print(f"[{current_time}] Item {i}: Main={item['Main_organization_id']}, Link={item['Link_organization_id']}, Status={item['request_status']}")
        
        print(f"[{current_time}] Returning data: {data}")
        
        response = Response(data)
        # Add cache control headers to prevent browser caching
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response

    def create(self, request, *args, **kwargs):
        """Only Super Admin can create new organization link"""
        from datetime import datetime
        current_time = datetime.now().strftime("%d/%b/%Y %H:%M:%S")
        
        print(f"[{current_time}] \"POST /api/organization-links/\" - User: {request.user.username if request.user.is_authenticated else 'Anonymous'}")
        print(f"[{current_time}] Request data: {request.data}")
        
        if not request.user.is_superuser:
            print(f"[{current_time}] Access denied: User is not superuser")
            return Response(
                {"detail": "Only Super Admins can create organization links."},
                status=status.HTTP_403_FORBIDDEN,
            )

        main_org_id = request.data.get("Main_organization_id")
        link_org_id = request.data.get("Link_organization_id")

        if not (main_org_id and link_org_id):
            return Response(
                {"detail": "Both Main_organization_id and Link_organization_id are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            main_org = Organization.objects.get(id=main_org_id)
            link_org = Organization.objects.get(id=link_org_id)
        except Organization.DoesNotExist:
            return Response(
                {"detail": "One or both organizations not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check for existing link
        existing_link = OrganizationLink.objects.filter(
            main_organization=main_org,
            link_organization=link_org
        ).first()
        
        if existing_link:
            return Response(
                {"detail": f"Organization link already exists (ID: {existing_link.id})."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.db import transaction, connection
        
        with transaction.atomic():
            link = OrganizationLink.objects.create(
                main_organization=main_org,
                link_organization=link_org,
                link_organization_request=OrganizationLink.STATUS_PENDING,
                main_organization_request=OrganizationLink.STATUS_PENDING,
                request_status=False,
            )

        # Close connection to force refresh for subsequent requests
        connection.close()
        
        print(f"[{current_time}] Organization link created successfully: ID={link.id}, Main={main_org.name}, Link={link_org.name}")

        serializer = self.get_serializer(link)
        response = Response(serializer.data, status=status.HTTP_201_CREATED)
        # Add cache control headers to prevent browser caching
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response

    @action(detail=True, methods=["post"])
    def accept_link(self, request, pk=None):
        """Accept link request — either main or link organization can do this."""
        from datetime import datetime
        current_time = datetime.now().strftime("%d/%b/%Y %H:%M:%S")
        
        print(f"[{current_time}] \"POST /api/organization-links/{pk}/accept/\" - User: {request.user.username if request.user.is_authenticated else 'Anonymous'}")
        
        link = self.get_object()
        user = request.user
        
        # Users can only accept requests involving their organizations
        user_orgs = user.organizations.all()

        if link.main_organization in user_orgs:
            link.main_organization_request = OrganizationLink.STATUS_ACCEPTED
            print(f"[{current_time}] Main organization accepted the link")
        elif link.link_organization in user_orgs:
            link.link_organization_request = OrganizationLink.STATUS_ACCEPTED
            print(f"[{current_time}] Link organization accepted the link")
        else:
            print(f"[{current_time}] Access denied: User not member of linked organizations")
            return Response(
                {"detail": "You are not a member of either linked organization."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Auto-set request_status = True when both accepted
        if (
            link.main_organization_request == OrganizationLink.STATUS_ACCEPTED
            and link.link_organization_request == OrganizationLink.STATUS_ACCEPTED
        ):
            link.request_status = True
            print(f"[{current_time}] Both organizations accepted - link is now active")
        else:
            link.request_status = False
            print(f"[{current_time}] Link status updated but not yet active")

        link.save()
        print(f"[{current_time}] Accept operation completed successfully")
        response = Response(self.get_serializer(link).data, status=status.HTTP_200_OK)
        # Add cache control headers to prevent browser caching
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        """Reject link request — any side can reject, making request_status False."""
        from datetime import datetime
        current_time = datetime.now().strftime("%d/%b/%Y %H:%M:%S")
        
        print(f"[{current_time}] \"POST /api/organization-links/{pk}/reject/\" - User: {request.user.username if request.user.is_authenticated else 'Anonymous'}")
        
        link = self.get_object()
        user = request.user
        
        # Users can only reject requests involving their organizations
        user_orgs = user.organizations.all()

        if link.main_organization in user_orgs:
            link.main_organization_request = OrganizationLink.STATUS_REJECTED
            print(f"[{current_time}] Main organization rejected the link")
        elif link.link_organization in user_orgs:
            link.link_organization_request = OrganizationLink.STATUS_REJECTED
            print(f"[{current_time}] Link organization rejected the link")
        else:
            print(f"[{current_time}] Access denied: User not member of linked organizations")
            return Response(
                {"detail": "You are not a member of either linked organization."},
                status=status.HTTP_403_FORBIDDEN,
            )

        link.request_status = False
        link.save()
        print(f"[{current_time}] Reject operation completed successfully")
        response = Response(self.get_serializer(link).data, status=status.HTTP_200_OK)
        # Add cache control headers to prevent browser caching
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response

    def destroy(self, request, *args, **kwargs):
        """Delete organization link with debugging"""
        from datetime import datetime
        current_time = datetime.now().strftime("%d/%b/%Y %H:%M:%S")
        
        instance = self.get_object()
        print(f"[{current_time}] \"DELETE /api/organization-links/{instance.id}/\" - User: {request.user.username if request.user.is_authenticated else 'Anonymous'}")
        print(f"[{current_time}] Deleting link: Main={instance.main_organization.name}, Link={instance.link_organization.name}")
        
        self.perform_destroy(instance)
        print(f"[{current_time}] Organization link deleted successfully")
        
        response = Response(status=status.HTTP_204_NO_CONTENT)
        # Add cache control headers to prevent browser caching
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response


# -------------------------------------------------------------------
# Other APIs (Organization, Branch, Agency)
# -------------------------------------------------------------------

class OrganizationViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only API for Organizations.

    Creation/updating of organizations via public API endpoints is disabled.
    Organizations are automatically created when an auth.User is added via
    the Django admin (or other user-creation flows) — see organization.signals.
    """
    serializer_class = OrganizationSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user_id = self.request.query_params.get("user_id")
        query_filters = Q()
        if user_id:
            query_filters &= Q(user=user_id)
        return Organization.objects.filter(query_filters)


class BranchViewSet(viewsets.ModelViewSet):
    """API for managing Branches"""
    serializer_class = BranchSerializer
    def get_queryset(self):
        organization_id = self.request.query_params.get("organization_id")
        user_id = self.request.query_params.get("user_id")
        query_filters = Q()
        if organization_id:
            query_filters &= Q(organization_id=organization_id)
        if user_id:
            query_filters &= Q(user=user_id)
        return Branch.objects.filter(query_filters).select_related("organization")
class ResellRequestViewSet(viewsets.ModelViewSet):
    """Manage resell requests between linked organizations.

    - Main organization creates a request (item_type + optional reseller flag).
    - Link organization can approve (status -> APPROVED) or reject (request is deleted).
    """
    serializer_class = ResellRequestSerializer
    queryset = ResellRequest.objects.all().order_by("-created_at")
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        organization_id = self.request.query_params.get("organization_id")
        qs = ResellRequest.objects.all().order_by("-created_at")
        if organization_id:
            qs = qs.filter(
                Q(main_organization_id=organization_id) | Q(link_organization_id=organization_id)
            )
        return qs

    def create(self, request, *args, **kwargs):
        main_org_id = request.data.get("Main_organization_id")
        link_org_id = request.data.get("Link_organization_id")
        item_type = request.data.get("Item_type")
        reseller_flag = request.data.get("reseller", False)

        if not (main_org_id and link_org_id and item_type):
            return Response({"detail": "Main_organization_id, Link_organization_id and Item_type are required."}, status=status.HTTP_400_BAD_REQUEST)

        # ensure user belongs to main organization
        if not _user_belongs_to_org(request.user, main_org_id):
            return Response({"detail": "You must be a member of the main organization to create a resell request."}, status=status.HTTP_403_FORBIDDEN)

        try:
            main_org = Organization.objects.get(id=main_org_id)
            link_org = Organization.objects.get(id=link_org_id)
        except Organization.DoesNotExist:
            return Response({"detail": "Organization(s) not found."}, status=status.HTTP_404_NOT_FOUND)

        # require an active organization link between the two orgs
        active_link_exists = OrganizationLink.objects.filter(
            (Q(main_organization=main_org) & Q(link_organization=link_org) | Q(main_organization=link_org) & Q(link_organization=main_org)),
            request_status=True,
        ).exists()

        if not active_link_exists:
            return Response({"detail": "Organizations are not linked or link is not active."}, status=status.HTTP_400_BAD_REQUEST)

        # avoid duplicate pending request for same main/link/item_type
        existing = ResellRequest.objects.filter(
            main_organization=main_org,
            link_organization=link_org,
            item_type=item_type,
            status=ResellRequest.STATUS_PENDING,
        ).first()
        if existing:
            return Response({"detail": f"A pending resell request already exists (id={existing.id})."}, status=status.HTTP_400_BAD_REQUEST)

        rr = ResellRequest.objects.create(
            main_organization=main_org,
            link_organization=link_org,
            item_type=item_type,
            items=request.data.get("Items", request.data.get("items", [])) or [],
            reseller=bool(reseller_flag),
            status=ResellRequest.STATUS_PENDING,
        )

        serializer = self.get_serializer(rr)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        rr = self.get_object()
        # only link organization members can approve
        if not _user_belongs_to_org(request.user, rr.link_organization_id):
            return Response({"detail": "Only members of the link organization can approve."}, status=status.HTTP_403_FORBIDDEN)

        rr.approve()

        # Ensure AllowedReseller record exists/updated so inventory endpoints honor the approval
        try:
            from booking.models import AllowedReseller
        except Exception:
            AllowedReseller = None

        if AllowedReseller is not None:
            # Find the active OrganizationLink representing the relationship
            org_link = OrganizationLink.objects.filter(
                (Q(main_organization=rr.main_organization) & Q(link_organization=rr.link_organization)) |
                (Q(main_organization=rr.link_organization) & Q(link_organization=rr.main_organization)),
                request_status=True,
            ).first()

            if org_link:
                # Map resell request item types to AllowedReseller.allowed_types tokens
                mapping = {
                    "hotel": ["HOTELS"],
                    "ticket": ["GROUP_TICKETS"],
                    "package": ["UMRAH_PACKAGES"],
                }
                allowed_types = mapping.get(rr.item_type, [str(rr.item_type).upper()])
                # Build per-item list from the resell request if present
                allowed_items = []
                try:
                    # rr.items expected to be a list of {"type":"hotel"|"ticket"|"package", "id": <int>}
                    for it in (rr.items or []):
                        t = it.get("type") if isinstance(it, dict) else None
                        iid = it.get("id") if isinstance(it, dict) else None
                        if t and iid:
                            allowed_items.append({"type": t, "id": int(iid)})
                except Exception:
                    allowed_items = []

                # booking.AllowedReseller.inventory_owner_company expects the Booking app's OrganizationLink
                # Attempt to find a matching booking.OrganizationLink; if not found, create a minimal one.
                try:
                    from booking.models import OrganizationLink as BookingOrgLink
                except Exception:
                    BookingOrgLink = None

                booking_org_link = None
                if BookingOrgLink is not None:
                    # Try to find a booking-side link for either organization that is accepted
                    booking_org_link = BookingOrgLink.objects.filter(
                        organization_id=rr.main_organization_id,
                        request_status=OrganizationLink.STATUS_ACCEPTED,
                    ).first()
                    if not booking_org_link:
                        booking_org_link = BookingOrgLink.objects.filter(
                            organization_id=rr.link_organization_id,
                            request_status=OrganizationLink.STATUS_ACCEPTED,
                        ).first()
                    # If still not found, create a minimal booking OrganizationLink record so FK type matches
                    if not booking_org_link:
                        try:
                            booking_org_link = BookingOrgLink.objects.create(
                                organization_id=rr.main_organization_id,
                                this_organization_request=BookingOrgLink.this_organization_request.field.default if hasattr(BookingOrgLink, 'this_organization_request') else 'ACCEPTED',
                                main_organization_request=BookingOrgLink.main_organization_request.field.default if hasattr(BookingOrgLink, 'main_organization_request') else 'ACCEPTED',
                                request_status=OrganizationLink.STATUS_ACCEPTED,
                            )
                        except Exception:
                            booking_org_link = None

                if booking_org_link is not None:
                    # Some databases still have a legacy 'allowed' column at the DB level
                    # which is not represented in the current model. If that column
                    # exists and is NOT NULL without a default, MySQL will reject
                    # inserts. Detect that situation and set a safe default on the
                    # column so the subsequent create() will succeed.
                    try:
                        from django.db import connection
                        with connection.cursor() as cursor:
                            cursor.execute(
                                """
                                SELECT IS_NULLABLE, COLUMN_DEFAULT, DATA_TYPE
                                FROM information_schema.COLUMNS
                                WHERE TABLE_SCHEMA = DATABASE()
                                  AND TABLE_NAME = %s
                                  AND COLUMN_NAME = 'allowed'
                                """,
                                ["booking_allowedreseller"],
                            )
                            row = cursor.fetchone()
                            if row:
                                is_nullable, col_default, data_type = row
                                if is_nullable == 'NO' and col_default is None:
                                    try:
                                        # If column is JSON, use JSON default; otherwise TEXT
                                        if (data_type or '').lower() == 'json':
                                            cursor.execute("ALTER TABLE booking_allowedreseller MODIFY COLUMN `allowed` JSON NOT NULL DEFAULT '[]'")
                                        else:
                                            # Some MySQL versions don't allow defaults on TEXT/BLOB;
                                            # try to set a default, otherwise make the column nullable.
                                            try:
                                                cursor.execute("ALTER TABLE booking_allowedreseller MODIFY COLUMN `allowed` TEXT NOT NULL DEFAULT '[]'")
                                            except Exception:
                                                cursor.execute("ALTER TABLE booking_allowedreseller MODIFY COLUMN `allowed` LONGTEXT NULL")
                                    except Exception:
                                        # best-effort only — if this fails, we'll handle errors below
                                        pass
                    except Exception:
                        # ignore DB-introspection errors; proceed to normal flow
                        pass
                    # Build defaults for get_or_create. Only include legacy
                    # 'allowed' key if the AllowedReseller model actually defines it.
                    defaults = {
                        "allowed_types": allowed_types,
                        "allowed_items": allowed_items,
                        "requested_status_by_reseller": "ACCEPTED",
                    }

                    try:
                        # Check whether model has a legacy 'allowed' field
                        AllowedReseller._meta.get_field("allowed")
                    except Exception:
                        pass
                    else:
                        defaults["allowed"] = allowed_types

                    # Try normal get_or_create first; if DB rejects the insert due to
                    # a legacy 'allowed' column without default, attempt a best-effort
                    # ALTER TABLE to add a default and retry once.
                    from django.db import utils as db_utils

                    tried_alter = False
                    try:
                        ar, created = AllowedReseller.objects.get_or_create(
                            inventory_owner_company=booking_org_link,
                            reseller_company=rr.link_organization,
                            defaults=defaults,
                        )
                    except db_utils.OperationalError as oe:
                        msg = str(oe)
                        if ("1364" in msg) or ("Field 'allowed'" in msg):
                            # Attempt ALTER to set a safe default on the legacy column
                            try:
                                from django.db import connection
                                with connection.cursor() as cursor:
                                    # determine column type first
                                    cursor.execute(
                                        "SELECT DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=%s AND COLUMN_NAME='allowed'",
                                        ["booking_allowedreseller"],
                                    )
                                    r = cursor.fetchone()
                                    data_type = (r[0] if r else None) or "text"
                                    if data_type.lower() == 'json':
                                        cursor.execute("ALTER TABLE booking_allowedreseller MODIFY COLUMN `allowed` JSON NOT NULL DEFAULT '[]'")
                                    else:
                                        try:
                                            cursor.execute("ALTER TABLE booking_allowedreseller MODIFY COLUMN `allowed` TEXT NOT NULL DEFAULT '[]'")
                                        except Exception:
                                            cursor.execute("ALTER TABLE booking_allowedreseller MODIFY COLUMN `allowed` LONGTEXT NULL")
                                    tried_alter = True
                            except Exception:
                                tried_alter = False

                        if tried_alter:
                            # retry once
                            ar, created = AllowedReseller.objects.get_or_create(
                                inventory_owner_company=booking_org_link,
                                reseller_company=rr.link_organization,
                                defaults=defaults,
                            )
                        else:
                            # re-raise original exception for visibility
                            raise

                    # Normalize/merge allowed types regardless of which fields exist
                    if not created:
                        # prefer the canonical 'allowed_types' if present, otherwise fall back to legacy 'allowed'
                        existing_values = []
                        if hasattr(ar, "allowed_types") and getattr(ar, "allowed_types") is not None:
                            existing_values = list(getattr(ar, "allowed_types") or [])
                        elif hasattr(ar, "allowed") and getattr(ar, "allowed") is not None:
                            existing_values = list(getattr(ar, "allowed") or [])

                        existing = set(existing_values)
                        existing.update(allowed_types)

                        # write back to both fields where available
                        if hasattr(ar, "allowed_types"):
                            ar.allowed_types = list(existing)
                        if hasattr(ar, "allowed"):
                            ar.allowed = list(existing)

                        ar.requested_status_by_reseller = "ACCEPTED"
                        ar.save()

        serializer = self.get_serializer(rr)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        rr = self.get_object()
        # only link organization members can reject
        if not _user_belongs_to_org(request.user, rr.link_organization_id):
            return Response({"detail": "Only members of the link organization can reject."}, status=status.HTTP_403_FORBIDDEN)

        # Remove any AllowedReseller entries tied to this resell request (if present)
        try:
            from booking.models import AllowedReseller
        except Exception:
            AllowedReseller = None

        if AllowedReseller is not None:
            # Find corresponding booking.OrganizationLink (if present) and delete AllowedReseller entries
            try:
                from booking.models import OrganizationLink as BookingOrgLink
            except Exception:
                BookingOrgLink = None

            booking_org_link = None
            if BookingOrgLink is not None:
                booking_org_link = BookingOrgLink.objects.filter(
                    organization_id=rr.main_organization_id,
                    request_status=OrganizationLink.STATUS_ACCEPTED,
                ).first()
                if not booking_org_link:
                    booking_org_link = BookingOrgLink.objects.filter(
                        organization_id=rr.link_organization_id,
                        request_status=OrganizationLink.STATUS_ACCEPTED,
                    ).first()

            if booking_org_link:
                AllowedReseller.objects.filter(
                    inventory_owner_company=booking_org_link,
                    reseller_company=rr.link_organization,
                ).delete()

        # Per requirement: rejection deletes the request
        rr.reject_and_delete()
        return Response({"detail": "Resell request rejected and deleted."}, status=status.HTTP_200_OK)
    


class AgencyViewSet(viewsets.ModelViewSet):
    """API for managing Agencies"""
    serializer_class = AgencySerializer

    def get_queryset(self):
        organization_id = self.request.query_params.get("organization_id")
        organization = self.request.query_params.get("organization")
        branch_id = self.request.query_params.get("branch_id")
        user_id = self.request.query_params.get("user_id")
        
        # Debug logging
        print(f"DEBUG AgencyViewSet.get_queryset - organization_id: {organization_id}, organization: {organization}, branch_id: {branch_id}, user_id: {user_id}")
        print(f"DEBUG AgencyViewSet.get_queryset - All query params: {dict(self.request.query_params)}")
        
        query_filters = Q()
        if organization_id:
            query_filters &= Q(branch__organization_id=organization_id)
        if branch_id:
            query_filters &= Q(branch_id=branch_id)
        if user_id:
            query_filters &= Q(user=user_id)
        return Agency.objects.filter(query_filters).select_related("branch").prefetch_related("files")

    def create(self, request, *args, **kwargs):
        # Add temporary debug logging to inspect incoming data and validation errors
        print("DEBUG AgencyViewSet.create - incoming request.data type:", type(request.data))
        try:
            print("DEBUG AgencyViewSet.create - request.data:", request.data)
        except Exception:
            print("DEBUG AgencyViewSet.create - request.data (unprintable)")

        # Normalize request.data (QueryDict) into a plain dict and sanitize 'user'
        raw = request.data
        try:
            data = raw.copy()
        except Exception:
            # fallback: if not copyable, convert to dict
            try:
                data = dict(raw)
            except Exception:
                data = raw

        # If it's a QueryDict or has getlist, coerce 'user' into a flat list of ints
        if hasattr(raw, "getlist"):
            try:
                vals = raw.getlist("user")
            except Exception:
                vals = None
            # Only set `user` in data when the request actually provided values
            # (QueryDict.getlist returns [] when key missing; avoid injecting empty list)
            if vals:
                # build list of valid ints > 0
                users_flat = []
                for u in vals:
                    if u is None:
                        continue
                    try:
                        uid = int(u)
                    except Exception:
                        # keep non-int values as-is for DRF to validate (e.g., UUIDs)
                        users_flat.append(u)
                        continue
                    if uid and uid > 0:
                        users_flat.append(uid)
                data = data.copy() if hasattr(data, 'copy') else dict(data)
                data["user"] = users_flat

        # Also handle scalar 'user' values (e.g., JSON clients sending user: 0)
        if isinstance(data, dict) and "user" in data and not isinstance(data["user"], (list, tuple)):
            val = data.get("user")
            try:
                if val is None:
                    data["user"] = []
                else:
                    uid = int(val)
                    data["user"] = [uid] if uid and uid > 0 else []
            except Exception:
                # keep as-is (could be UUID or other type)
                data["user"] = [val]

        serializer = self.get_serializer(data=data)
        if not serializer.is_valid():
            print("DEBUG AgencyViewSet.create - serializer.errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class AgencyProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        agency_id = request.query_params.get("agency_id")
        if not agency_id:
            return Response({"success": False, "message": "agency_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            profile = AgencyProfile.objects.get(agency_id=agency_id)
        except AgencyProfile.DoesNotExist:
            return Response({"success": False, "message": "Agency profile not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = AgencyProfileSerializer(profile)
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()
        agency_id = data.get("agency") or data.get("agency_id")
        if not agency_id:
            return Response({"success": False, "message": "agency is required."}, status=status.HTTP_400_BAD_REQUEST)
        data["agency"] = agency_id
        user = request.user if request.user.is_authenticated else None
        try:
            profile = AgencyProfile.objects.get(agency_id=agency_id)
            serializer = AgencyProfileSerializer(profile, data=data, partial=True)
            if serializer.is_valid():
                serializer.save(updated_by=user)
                return Response({
                    "success": True,
                    "message": "Agency profile updated successfully",
                    "updated_profile": serializer.data
                })
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except AgencyProfile.DoesNotExist:
            serializer = AgencyProfileSerializer(data=data)
            if serializer.is_valid():
                serializer.save(created_by=user, updated_by=user)
                return Response({
                    "success": True,
                    "message": "Agency profile created successfully",
                    "updated_profile": serializer.data
                })
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RuleCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        data = request.data.copy()
        rule_id = data.get("id")
        user = request.user
        # set defaults
        if "is_active" not in data:
            data["is_active"] = True

        if rule_id:
            rule = get_object_or_404(Rule, id=rule_id)
            serializer = RuleSerializer(rule, data=data, partial=True)
            if serializer.is_valid():
                # ensure updated_by stored as id
                serializer.save(updated_by=user.id if user and user.is_authenticated else None)
                return Response({"success": True, "message": "Rule updated successfully", "rule_id": rule.id})
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # create new
        serializer = RuleSerializer(data=data)
        if serializer.is_valid():
            instance = serializer.save(created_by=user.id if user and user.is_authenticated else None,
                                       updated_by=user.id if user and user.is_authenticated else None)
            return Response({"success": True, "message": "Rule created successfully", "rule_id": instance.id})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RuleListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        rule_type = request.GET.get("type")
        page = request.GET.get("page")
        language = request.GET.get("language")

        qs = Rule.objects.filter(is_active=True)
        if rule_type:
            qs = qs.filter(rule_type=rule_type)
        if language:
            qs = qs.filter(language=language)
        if page:
            # Simple string contains for now - can be improved later
            qs = qs.filter(pages_to_display__icontains=page)

        qs = qs.order_by("-updated_at")
        serializer = RuleSerializer(qs, many=True)
        return Response({"rules": serializer.data})


class RuleUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def put(self, request, id=None):
        rule = get_object_or_404(Rule, id=id)
        serializer = RuleSerializer(rule, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(updated_by=request.user.id if request.user and request.user.is_authenticated else None)
            return Response({"success": True, "message": "Rule updated successfully", "rule_id": rule.id})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RuleDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def delete(self, request, id=None):
        rule = get_object_or_404(Rule, id=id)
        rule.is_active = False
        rule.updated_by = request.user.id if request.user and request.user.is_authenticated else None
        rule.save()
        return Response({"success": True, "message": "Rule deleted successfully"})


# -------------------------
# Walk-in booking APIs
# -------------------------


class WalkInCreateView(APIView):
    permission_classes = [IsAuthenticated, IsOrgStaff]

    def post(self, request):
        data = request.data.copy()

        # basic required fields
        hotel_id = data.get("hotel_id") or data.get("hotel")
        org_id = data.get("organization_id") or data.get("organization")
        if not hotel_id or not org_id:
            return Response({"detail": "hotel_id and organization_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        # ensure user belongs to organization (explicit ownership check)
        if not _user_belongs_to_org(request.user, org_id):
            return Response({"detail": "You don't have permission to create bookings for this organization."}, status=status.HTTP_403_FORBIDDEN)

        # normalize hotel & org to pk fields expected by serializer
        data["hotel"] = hotel_id
        data["organization"] = org_id
        serializer = WalkInBookingSerializer(data=data, context={"request": request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            instance = serializer.save()
            # mark rooms occupied (will raise ValueError if no free bed exists)
            try:
                instance.mark_rooms_occupied()
            except ValueError as e:
                # rollback the transaction and return conflict
                transaction.set_rollback(True)
                return Response({"detail": str(e)}, status=status.HTTP_409_CONFLICT)
            except Exception:
                # preserve previous behavior for unexpected errors
                pass

            # Create ledger entries for advance payment (if any) using centralized helper
            try:
                from .ledger_utils import find_account, create_entry_with_lines
            except Exception:
                find_account = create_entry_with_lines = None

            try:
                advance = Decimal(str(instance.advance_paid or 0))
            except Exception:
                advance = Decimal("0")

            if create_entry_with_lines and advance > 0:
                # Prefer CASH or BANK for received money
                cash_acc = find_account(instance.organization_id, ["CASH", "BANK"]) or find_account(None, ["CASH"]) 
                # Use SUSPENSE account to record advance as liability
                suspense_acc = find_account(instance.organization_id, ["SUSPENSE"]) or find_account(None, ["SUSPENSE"]) 

                if cash_acc and suspense_acc:
                    audit_note = f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Advance recorded for booking {instance.booking_no} by user {request.user.id if request.user and request.user.is_authenticated else 'unknown'}"
                    create_entry_with_lines(
                        booking_no=instance.booking_no,
                        service_type="hotel",
                        narration=f"Advance payment for walk-in booking {instance.booking_no}",
                        metadata={"booking_id": instance.id, "hotel_id": instance.hotel_id},
                        internal_notes=[audit_note],
                        created_by=request.user if request.user and request.user.is_authenticated else None,
                        lines=[
                            {"account": cash_acc, "debit": advance, "credit": Decimal("0.00")},
                            {"account": suspense_acc, "debit": Decimal("0.00"), "credit": advance},
                        ],
                    )

        return Response({"success": True, "booking_no": instance.booking_no, "booking_id": instance.id}, status=status.HTTP_201_CREATED)


class WalkInListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        status_q = request.query_params.get("status")
        date = request.query_params.get("date")
        hotel_id = request.query_params.get("hotel_id")
        org_id = request.query_params.get("organization_id")

        qs = WalkInBooking.objects.all()
        if status_q:
            qs = qs.filter(status=status_q)
        if hotel_id:
            qs = qs.filter(hotel_id=hotel_id)
        if org_id:
            qs = qs.filter(organization_id=org_id)
        if date:
            # filter bookings with check_in or check_out matching the date in any room_details
            qs = qs.filter(room_details__icontains=date)

        serializer = WalkInBookingSerializer(qs, many=True)
        return Response({"bookings": serializer.data, "total_walkin_bookings": qs.count()})


class WalkInUpdateStatusView(APIView):
    permission_classes = [IsAuthenticated, IsOrgStaff]

    def put(self, request, booking_id=None):
        instance = get_object_or_404(WalkInBooking, id=booking_id)

        # permission: user must belong to organization or be superuser
        if not _user_belongs_to_org(request.user, instance.organization_id):
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        status_val = request.data.get("status")
        if not status_val:
            return Response({"detail": "status is required"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # handle transitions
            if status_val == WalkInBooking.STATUS_CHECKED_OUT:
                final_amount = request.data.get("final_amount")
                if final_amount is None:
                    return Response({"detail": "final_amount required for checkout"}, status=status.HTTP_400_BAD_REQUEST)
                try:
                    final_amount_dec = Decimal(str(final_amount))
                except Exception:
                    return Response({"detail": "invalid final_amount"}, status=status.HTTP_400_BAD_REQUEST)

                instance.total_amount = final_amount_dec
                instance.status = WalkInBooking.STATUS_CHECKED_OUT
                instance.updated_by = request.user.id if request.user.is_authenticated else None
                instance.save()
                try:
                    instance.mark_rooms_cleaning_pending()
                except Exception:
                    pass
                # Ledger: recognize remaining revenue (final_amount - advance_paid)
                try:
                    advance = Decimal(str(instance.advance_paid or 0))
                except Exception:
                    advance = Decimal("0")

                remaining = final_amount_dec - advance
                # Lazy import ledger models to avoid circular import problems during app registry
                try:
                    from ledger.models import LedgerEntry, LedgerLine, Account
                    from datetime import datetime as _dt
                except Exception:
                    LedgerEntry = LedgerLine = Account = None
                    _dt = None

                if LedgerEntry:
                    # amount recognized from advance (move from SUSPENSE -> SALES)
                    amount_from_advance = min(advance, final_amount_dec)
                    # remaining to be collected at checkout (cash)
                    remaining = final_amount_dec - amount_from_advance

                    # Lazy import again (we're inside function)
                    try:
                        from ledger.models import LedgerEntry, LedgerLine, Account
                        from datetime import datetime as _dt
                    except Exception:
                        LedgerEntry = LedgerLine = Account = None
                        _dt = None

                    if amount_from_advance > 0:
                        try:
                            from .ledger_utils import find_account, create_entry_with_lines
                        except Exception:
                            find_account = create_entry_with_lines = None

                        if create_entry_with_lines:
                            suspense_acc = find_account(instance.organization_id, ["SUSPENSE"]) or find_account(None, ["SUSPENSE"]) 
                            sales_acc = find_account(instance.organization_id, ["SALES"]) or find_account(None, ["SALES"]) 

                            if suspense_acc and sales_acc:
                                audit_note = f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Recognize revenue from advance for booking {instance.booking_no} by user {request.user.id if request.user and request.user.is_authenticated else 'unknown'}"
                                create_entry_with_lines(
                                    booking_no=instance.booking_no,
                                    service_type="hotel",
                                    narration=f"Recognize revenue from advance for booking {instance.booking_no}",
                                    metadata={"booking_id": instance.id, "hotel_id": instance.hotel_id},
                                    internal_notes=[audit_note],
                                    created_by=request.user if request.user and request.user.is_authenticated else None,
                                    lines=[
                                        {"account": suspense_acc, "debit": amount_from_advance, "credit": Decimal("0.00")},
                                        {"account": sales_acc, "debit": Decimal("0.00"), "credit": amount_from_advance},
                                    ],
                                )

                    # If there's remaining amount (customer paid at checkout), record cash->sales
                    if remaining > 0:
                        try:
                            from .ledger_utils import find_account, create_entry_with_lines
                        except Exception:
                            find_account = create_entry_with_lines = None

                        if create_entry_with_lines:
                            cash_acc = find_account(instance.organization_id, ["CASH", "BANK"]) or find_account(None, ["CASH"]) 
                            sales_acc = find_account(instance.organization_id, ["SALES"]) or find_account(None, ["SALES"]) 

                            if cash_acc and sales_acc:
                                audit_note = f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Checkout payment recorded for booking {instance.booking_no} by user {request.user.id if request.user and request.user.is_authenticated else 'unknown'}"
                                create_entry_with_lines(
                                    booking_no=instance.booking_no,
                                    service_type="hotel",
                                    narration=f"Checkout payment for walk-in booking {instance.booking_no}",
                                    metadata={"booking_id": instance.id, "hotel_id": instance.hotel_id},
                                    internal_notes=[audit_note],
                                    created_by=request.user if request.user and request.user.is_authenticated else None,
                                    lines=[
                                        {"account": cash_acc, "debit": remaining, "credit": Decimal("0.00")},
                                        {"account": sales_acc, "debit": Decimal("0.00"), "credit": remaining},
                                    ],
                                )
                    # No additional global checkout entry here — remaining amount is already
                    # recorded above (cash->sales) when applicable. Avoid duplicating entries.

            elif status_val == WalkInBooking.STATUS_AVAILABLE:
                instance.status = WalkInBooking.STATUS_AVAILABLE
                instance.updated_by = request.user.id if request.user.is_authenticated else None
                instance.save()
                try:
                    instance.mark_rooms_available()
                except Exception:
                    pass

            else:
                # other statuses (e.g., checked_in, cleaning_pending)
                if status_val not in dict(WalkInBooking.STATUS_CHOICES):
                    return Response({"detail": "invalid status"}, status=status.HTTP_400_BAD_REQUEST)
                instance.status = status_val
                instance.updated_by = request.user.id if request.user.is_authenticated else None
                instance.save()

        return Response({"success": True, "message": "Status updated", "status": instance.status})


class WalkInSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsOrgStaff]

    def get(self, request):
        hotel_id = request.query_params.get("hotel_id")
        date = request.query_params.get("date")
        if not hotel_id or not date:
            return Response({"detail": "hotel_id and date are required"}, status=status.HTTP_400_BAD_REQUEST)

        total_rooms = HotelRooms.objects.filter(hotel_id=hotel_id).count()
        occupied_rooms = WalkInBooking.objects.filter(hotel_id=hotel_id, status=WalkInBooking.STATUS_CHECKED_IN).count()
        cleaning_pending = WalkInBooking.objects.filter(hotel_id=hotel_id, status=WalkInBooking.STATUS_CLEANING_PENDING).count()
        available_rooms = max(0, total_rooms - occupied_rooms - cleaning_pending)

        # total sales: sum of total_amount for checked_out bookings on that date (simple filter)
        total_sales = WalkInBooking.objects.filter(hotel_id=hotel_id, status=WalkInBooking.STATUS_CHECKED_OUT, updated_at__date=date).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        total_expense = 0
        profit = total_sales - total_expense

        return Response({
            "hotel_id": int(hotel_id),
            "date": date,
            "total_rooms": total_rooms,
            "occupied_rooms": occupied_rooms,
            "available_rooms": available_rooms,
            "total_sales": total_sales,
            "total_expense": total_expense,
            "profit": profit,
        })
