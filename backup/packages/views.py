from rest_framework.viewsets import ModelViewSet
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema, OpenApiParameter, extend_schema_view
from drf_spectacular.types import OpenApiTypes
from .models import (
    Visa,
    PackageInclusion,
    PackageExclusion,
    RiyalRate,
    Shirka,
    UmrahVisaPrice,
    UmrahVisaPriceTwo,
    TransportSectorPrice,
    Airlines,
    City,
    BookingExpiry,
    UmrahPackage,
    CustomUmrahPackage,
    OnlyVisaPrice,
    SetVisaType,
    FoodPrice,
    ZiaratPrice,
)
from .serializers import (
    VisaSerializer,
    PackageInclusionSerializer,
    PackageExclusionSerializer,
    RiyalRateSerializer,
    ShirkaSerializer,
    UmrahVisaPriceSerializer,
    UmrahVisaPriceTwoSerializer,
    TransportSectorPriceSerializer,
    AirlinesSerializer,
    CitySerializer,
    BookingExpirySerializer,
    UmrahPackageSerializer,
    CustomUmrahPackageSerializer,
    OnlyVisaPriceSerializer,
    SetVisaTypeSerializer,
    FoodPriceSerializer,
    ZiaratPriceSerializer,
)
from tickets.models import Ticket, Hotels
from tickets.serializers import TicketSerializer, HotelsSerializer
from django.db.models import Q
from booking.models import AllowedReseller
from django.utils import timezone
from rest_framework import generics
from .serializers import PublicUmrahPackageListSerializer, PublicUmrahPackageDetailSerializer
from django.utils.text import slugify


class VisaViewSet(ModelViewSet):
    """
    ViewSet for Visa CRUD operations.
    
    Endpoints:
    - GET /api/visa/ - List all visas for user's organization
    - POST /api/visa/ - Create new visa
    - GET /api/visa/{id}/ - Get visa details
    - PUT /api/visa/{id}/ - Update visa
    - PATCH /api/visa/{id}/ - Partial update visa
    - DELETE /api/visa/{id}/ - Delete visa
    
    Supports filtering by query params:
    - status (pending, processing, issued, cancelled, used, expired)
    - visa_type (umrah, tourist, work, business, transit)
    - country
    - issue_date_from, issue_date_to, expiry_date_from, expiry_date_to
    
    Supports search by:
    - visa_id, service_provider, notes
    
    Supports ordering by:
    - created_at, issue_date, expiry_date, price
    """
    serializer_class = VisaSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['visa_id', 'service_provider', 'notes']
    ordering_fields = ['created_at', 'issue_date', 'expiry_date', 'price']
    ordering = ['-created_at']

    def get_queryset(self):
        """Filter visas by user's organization and query params"""
        organization_id = self.request.query_params.get("organization")
        if not organization_id:
            raise PermissionDenied("Missing 'organization' query parameter.")
        
        queryset = Visa.objects.filter(organization_id=organization_id)
        
        # Filter by status
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by visa_type
        visa_type = self.request.query_params.get('visa_type')
        if visa_type:
            queryset = queryset.filter(visa_type=visa_type)
        
        # Filter by country
        country = self.request.query_params.get('country')
        if country:
            queryset = queryset.filter(country=country)
        
        # Date range filters
        issue_date_from = self.request.query_params.get('issue_date_from')
        issue_date_to = self.request.query_params.get('issue_date_to')
        expiry_date_from = self.request.query_params.get('expiry_date_from')
        expiry_date_to = self.request.query_params.get('expiry_date_to')
        
        if issue_date_from:
            queryset = queryset.filter(issue_date__gte=issue_date_from)
        if issue_date_to:
            queryset = queryset.filter(issue_date__lte=issue_date_to)
        if expiry_date_from:
            queryset = queryset.filter(expiry_date__gte=expiry_date_from)
        if expiry_date_to:
            queryset = queryset.filter(expiry_date__lte=expiry_date_to)
        
        return queryset
    
    def perform_create(self, serializer):
        """Set created_by to current user"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Bulk update visa status"""
        visa = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(Visa.STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status value'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        visa.status = new_status
        visa.save()
        
        return Response(
            VisaSerializer(visa).data,
            status=status.HTTP_200_OK
        )


@extend_schema_view(
    list=extend_schema(
        parameters=[
            OpenApiParameter(
                name='organization',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=True,
                description='Organization ID to filter packages'
            ),
            OpenApiParameter(
                name='status',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=False,
                description='Filter by package status (active, inactive, archived, sold_out)'
            ),
            OpenApiParameter(
                name='package_type',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=False,
                description='Filter by package type (umrah, visa, package, hotel, transport)'
            ),
            OpenApiParameter(
                name='is_public',
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                required=False,
                description='Filter by public visibility (true/false)'
            ),
            OpenApiParameter(
                name='available_only',
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                required=False,
                description='Show only available packages with seats (true/false)'
            ),
        ],
        description='List all Umrah packages for the specified organization'
    ),
    retrieve=extend_schema(
        parameters=[
            OpenApiParameter(
                name='organization',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=True,
                description='Organization ID'
            ),
        ],
        description='Get detailed information about a specific Umrah package'
    ),
)
class PackageViewSet(ModelViewSet):
    """
    Enhanced ViewSet for UmrahPackage with complete package details.
    
    Endpoints:
    - GET /api/packages/ - List all packages for user's organization
    - POST /api/packages/ - Create new package
    - GET /api/packages/{id}/ - Get complete package details
    - GET /api/packages/{id}/details/ - Get detailed breakdown
    - PUT /api/packages/{id}/ - Update package
    - PATCH /api/packages/{id}/ - Partial update package
    - DELETE /api/packages/{id}/ or archive
    
    Supports filtering by query params:
    - status (active, inactive, archived, sold_out)
    - package_type (umrah, visa, package, hotel, transport)
    - is_public (true/false)
    - start_date_from, start_date_to, end_date_from, end_date_to
    - available_only (true/false) - only show packages with available slots
    
    Supports search by:
    - package_code, title, description
    
    Supports ordering by:
    - created_at, price_per_person, max_capacity
    """
    serializer_class = UmrahPackageSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['package_code', 'title', 'description']
    ordering_fields = ['created_at', 'price_per_person', 'max_capacity']
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Filter packages by organization.
        Also includes packages where reselling_allowed=True and user's org is an allowed reseller.
        Includes packages from linked organizations.
        """
        from organization.models import OrganizationLink
        
        organization_id = self.request.query_params.get("organization")
        if not organization_id:
            raise PermissionDenied("Missing 'organization' query parameter.")
        
        # Get linked organizations
        linked_org_ids = OrganizationLink.get_linked_organizations(int(organization_id))
        
        # Include packages from the user's organization and linked organizations
        allowed_org_ids = {int(organization_id)} | linked_org_ids

        # Build allowed owner organization ids based on AllowedReseller entries
        # Query AllowedReseller for the calling organization only (what this org is allowed to resell)
        allowed_owner_org_ids = []
        # collect specific allowed package ids from AllowedReseller.allowed_items
        allowed_package_ids = set()
        try:
            allowed_qs = AllowedReseller.objects.filter(
                reseller_company_id=int(organization_id),
                requested_status_by_reseller="ACCEPTED",
            )
            # filter by allowed_types containing GROUP_PACKAGES
            for ar in allowed_qs:
                inv = getattr(ar, "inventory_owner_company", None)
                if inv is None:
                    continue
                org_id = getattr(inv, "organization_id", None) or getattr(inv, "main_organization_id", None) or None
                if org_id:
                    # If AllowedReseller specifies allowed_items, treat those as specific allowed package ids
                    try:
                        items = getattr(ar, "allowed_items", None) or []
                    except Exception:
                        items = []

                    if items:
                        for it in items:
                            try:
                                if (it.get("type") == "package") and it.get("id"):
                                    allowed_package_ids.add(int(it.get("id")))
                            except Exception:
                                continue
                    else:
                        types = ar.allowed_types or []
                        if "GROUP_PACKAGES" in types:
                            allowed_owner_org_ids.append(org_id)

        except Exception:
            allowed_owner_org_ids = []

        # Include own organization and any explicitly allowed owner organizations
        owner_ids = set(allowed_owner_org_ids) | {int(organization_id)}

        # Base filters: always include packages that belong to the calling org (own org)
        own_org_id = int(organization_id)
        linked_org_ids_only = linked_org_ids - {own_org_id}

        base_filter = Q(organization_id=own_org_id)

        # Allowed owners' packages (when AllowedReseller grants org-level access)
        allowed_owners_filter = Q(organization_id__in=allowed_owner_org_ids)

        # For linked organizations, only include packages if reselling is allowed by owner
        linked_filter = Q(organization_id__in=linked_org_ids_only) & Q(reselling_allowed=True)

        # For reseller callers (third parties), ensure items can be resold (and are not from own org)
        resell_filter = Q(reselling_allowed=True) & ~Q(organization_id=own_org_id)

        # Final queryset: own packages, packages from allowed owner orgs, explicit allowed package ids,
        # linked org packages with reselling_allowed, or general resellable packages from other orgs
        queryset = UmrahPackage.objects.filter(
            base_filter | allowed_owners_filter | linked_filter | resell_filter | Q(id__in=list(allowed_package_ids))
        ).distinct()
        
        # Filter by status
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by package_type
        package_type = self.request.query_params.get('package_type')
        if package_type:
            queryset = queryset.filter(package_type=package_type)
        
        # Filter by is_public
        is_public = self.request.query_params.get('is_public')
        if is_public == 'true':
            queryset = queryset.filter(is_public=True)
        elif is_public == 'false':
            queryset = queryset.filter(is_public=False)
        
        # Date range filters
        start_date_from = self.request.query_params.get('start_date_from')
        start_date_to = self.request.query_params.get('start_date_to')
        end_date_from = self.request.query_params.get('end_date_from')
        end_date_to = self.request.query_params.get('end_date_to')
        
        if start_date_from:
            queryset = queryset.filter(start_date__gte=start_date_from)
        if start_date_to:
            queryset = queryset.filter(start_date__lte=start_date_to)
        if end_date_from:
            queryset = queryset.filter(end_date__gte=end_date_from)
        if end_date_to:
            queryset = queryset.filter(end_date__lte=end_date_to)
        
        # Filter by availability
        available_only = self.request.query_params.get('available_only')
        if available_only == 'true':
            queryset = queryset.filter(
                status='active',
                left_seats__gt=0
            )
        
        return queryset
    
    def perform_create(self, serializer):
        """Set created_by to current user"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def details(self, request, pk=None):
        """
        Get complete package breakdown including all components.
        Returns: {hotels, transport, flights, visa, inclusions, exclusions, pricing}
        """
        package = self.get_object()
        serializer = UmrahPackageSerializer(package)
        
        # Add additional calculated data
        data = serializer.data
        data['pricing_examples'] = {
            '1_adult': package.calculate_total_price(1, 0, 0),
            '2_adults': package.calculate_total_price(2, 0, 0),
            '2_adults_1_child': package.calculate_total_price(2, 1, 0),
            '2_adults_1_child_1_infant': package.calculate_total_price(2, 1, 1),
            '4_adults': package.calculate_total_price(4, 0, 0),
        }
        data['is_available'] = package.get_available_slots() > 0
        
        return Response(data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update package status (active, inactive, archived, sold_out)"""
        package = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(UmrahPackage.STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status value'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        package.status = new_status
        package.save()
        
        return Response(
            UmrahPackageSerializer(package).data,
            status=status.HTTP_200_OK
        )


class RiyalRateViewSet(ModelViewSet):
    serializer_class = RiyalRateSerializer

    def get_queryset(self):
        organization_id = self.request.query_params.get("organization")
        if not organization_id:
            raise PermissionDenied("Missing 'organization' query parameter.")
        return RiyalRate.objects.filter(organization_id=organization_id)


class ShirkaViewSet(ModelViewSet):
    serializer_class = ShirkaSerializer

    def get_queryset(self):
        organization_id = self.request.query_params.get("organization")
        if not organization_id:
            raise PermissionDenied("Missing 'organization' query parameter.")
        return Shirka.objects.filter(organization_id=organization_id)


class UmrahVisaPriceViewSet(ModelViewSet):
    serializer_class = UmrahVisaPriceSerializer

    def get_queryset(self):
        organization_id = self.request.query_params.get("organization")
        if not organization_id:
            raise PermissionDenied("Missing 'organization' query parameter.")
        return UmrahVisaPrice.objects.filter(organization_id=organization_id)


class UmrahVisaPriceTwoViewSet(ModelViewSet):
    serializer_class = UmrahVisaPriceTwoSerializer

    def get_queryset(self):
        organization_id = self.request.query_params.get("organization")
        if not organization_id:
            raise PermissionDenied("Missing 'organization' query parameter.")
        return UmrahVisaPriceTwo.objects.filter(organization_id=organization_id)


class OnlyVisaPriceViewSet(ModelViewSet):
    serializer_class = OnlyVisaPriceSerializer

    def get_queryset(self):
        organization_id = self.request.query_params.get("organization")
        if not organization_id:
            raise PermissionDenied("Missing 'organization' query parameter.")
        return OnlyVisaPrice.objects.filter(organization_id=organization_id)

class TransportSectorPriceViewSet(ModelViewSet):
    serializer_class = TransportSectorPriceSerializer

    def get_queryset(self):
        # Check if user is superuser
        if self.request.user.is_superuser:
            # Superadmin can see all transport sectors
            return TransportSectorPrice.objects.all()
        
        organization_id = self.request.query_params.get("organization")
        if not organization_id:
            raise PermissionDenied("Missing 'organization' query parameter.")
        return TransportSectorPrice.objects.filter(organization_id=organization_id)


class AirlinesViewSet(ModelViewSet):
    serializer_class = AirlinesSerializer

    def get_queryset(self):
        from organization.models import OrganizationLink
        
        # Check if user is superuser
        if self.request.user.is_superuser:
            # Superadmin can see all airlines
            return Airlines.objects.all()
        
        organization_id = self.request.query_params.get("organization")
        
        # Debug logging
        print(f"DEBUG AirlinesViewSet.get_queryset - organization: {organization_id}")
        print(f"DEBUG AirlinesViewSet.get_queryset - All query params: {dict(self.request.query_params)}")
        
        if not organization_id:
            raise PermissionDenied("Missing 'organization' query parameter.")
        
        # Check if user has access to this organization
        user_organizations = self.request.user.organizations.values_list('id', flat=True)
        if int(organization_id) not in user_organizations:
            raise PermissionDenied("You don't have access to this organization.")
        
        # Get linked organizations
        linked_org_ids = OrganizationLink.get_linked_organizations(int(organization_id))
        
        # Include airlines from the user's organization and linked organizations
        allowed_org_ids = {int(organization_id)} | linked_org_ids
        
        return Airlines.objects.filter(organization_id__in=allowed_org_ids)


class CityViewSet(ModelViewSet):
    serializer_class = CitySerializer

    def get_queryset(self):
        # Allow listing cities for a specific organization when `organization` query
        # param is provided. If omitted, return all cities so the frontend can
        # show a global list (and client can still filter by organization).
        organization_id = self.request.query_params.get("organization")
        
        # Debug logging
        print(f"DEBUG CityViewSet.get_queryset - organization: {organization_id}")
        print(f"DEBUG CityViewSet.get_queryset - All query params: {dict(self.request.query_params)}")
        
        if organization_id:
            return City.objects.filter(organization_id=organization_id)
        return City.objects.all().order_by('name')

class FoodPriceViewSet(ModelViewSet):
    serializer_class = FoodPriceSerializer

    def get_queryset(self):
        organization_id = self.request.query_params.get("organization")
        if not organization_id:
            raise PermissionDenied("Missing 'organization' query parameter.")
        return FoodPrice.objects.filter(organization_id=organization_id)
class ZiaratPriceViewSet(ModelViewSet):
    serializer_class = ZiaratPriceSerializer

    def get_queryset(self):
        organization_id = self.request.query_params.get("organization")
        if not organization_id:
            raise PermissionDenied("Missing 'organization' query parameter.")
        return ZiaratPrice.objects.filter(organization_id=organization_id)

class BookingExpiryViewSet(ModelViewSet):
    serializer_class = BookingExpirySerializer

    def get_queryset(self):
        organization_id = self.request.query_params.get("organization")
        if not organization_id:
            raise PermissionDenied("Missing 'organization' query parameter.")
        return BookingExpiry.objects.filter(organization_id=organization_id)


@extend_schema_view(
    list=extend_schema(
        parameters=[
            OpenApiParameter(
                name='organization',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=True,
                description='Organization ID to filter Umrah packages'
            ),
            OpenApiParameter(
                name='is_active',
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                required=False,
                description='Filter by active status (true/false)'
            ),
        ],
        description='List all Umrah packages for the specified organization. Includes packages owned by the organization and packages they are allowed to resell.'
    ),
    retrieve=extend_schema(
        parameters=[
            OpenApiParameter(
                name='organization',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=True,
                description='Organization ID'
            ),
        ],
        description='Get detailed information about a specific Umrah package'
    ),
    create=extend_schema(
        description='Create a new Umrah package'
    ),
    update=extend_schema(
        description='Update an existing Umrah package'
    ),
    partial_update=extend_schema(
        description='Partially update an existing Umrah package'
    ),
    destroy=extend_schema(
        description='Delete an Umrah package'
    ),
)
class UmrahPackageViewSet(ModelViewSet):
    serializer_class = UmrahPackageSerializer

    def perform_create(self, serializer):
        """Set organization from query param (or request data) and set created_by."""
        org_id = self.request.query_params.get("organization") or self.request.data.get("organization")
        if not org_id:
            raise PermissionDenied("Missing 'organization' query parameter.")
        try:
            from organization.models import Organization
            org = Organization.objects.get(pk=int(org_id))
        except Exception:
            raise PermissionDenied("Invalid 'organization' query parameter.")

        serializer.save(created_by=self.request.user, organization=org)

    def create(self, request, *args, **kwargs):
        """Allow organization via query param when frontend omits it from JSON body."""
        org_id = request.query_params.get("organization")

        # Prepare data: copy request.data and inject organization if missing
        try:
            data = request.data.copy()
        except Exception:
            data = dict(request.data)

        if org_id and not data.get("organization"):
            data["organization"] = org_id

        # sanitize nested relations sent by frontend: remove entries with invalid fk (0 or empty)
        def _clean_list(lst, key_names):
            if not isinstance(lst, (list, tuple)):
                return []
            out = []
            for item in lst:
                if not isinstance(item, dict):
                    continue
                valid = False
                for k in key_names:
                    v = item.get(k)
                    try:
                        if v is None:
                            continue
                        if isinstance(v, str) and v.strip() == "":
                            continue
                        if int(v) > 0:
                            valid = True
                            break
                    except Exception:
                        # if not int-convertible, treat non-empty as valid
                        if v:
                            valid = True
                            break
                if valid:
                    out.append(item)
            return out

        # hotel_details expect 'hotel' pk
        if data.get("hotel_details"):
            data["hotel_details"] = _clean_list(data.get("hotel_details"), ["hotel"])
        # transport_details expect 'transport_sector'
        if data.get("transport_details"):
            data["transport_details"] = _clean_list(data.get("transport_details"), ["transport_sector"])
        # ticket_details expect 'ticket'
        if data.get("ticket_details"):
            data["ticket_details"] = _clean_list(data.get("ticket_details"), ["ticket"])
        # discount_details may expect numeric ranges, keep only entries with max_discount or adault_from
        if data.get("discount_details"):
            cleaned = []
            for d in data.get("discount_details"):
                try:
                    if (d.get("max_discount") is not None and float(d.get("max_discount", 0)) > 0) or (int(d.get("adault_from", 0)) > 0 and int(d.get("adault_to", 0)) > 0):
                        cleaned.append(d)
                except Exception:
                    # keep if any field present
                    if d:
                        cleaned.append(d)
            data["discount_details"] = cleaned

        serializer = self.get_serializer(data=data)
        # Debug: log incoming hotel_details and top-level selling/purchase fields server-side to help trace
        try:
            try:
                print("UmrahPackage.create incoming hotel_details:", data.get("hotel_details"))
                # top-level extras and visa selling/purchase fields
                keys = [
                    'food_selling_price','food_purchase_price',
                    'makkah_ziyarat_selling_price','makkah_ziyarat_purchase_price',
                    'madinah_ziyarat_selling_price','madinah_ziyarat_purchase_price',
                    'transport_selling_price','transport_purchase_price',
                    'adault_visa_selling_price','adault_visa_purchase_price',
                    'child_visa_selling_price','child_visa_purchase_price',
                    'infant_visa_selling_price','infant_visa_purchase_price',
                ]
                top_vals = {k: data.get(k) for k in keys}
                print("UmrahPackage.create incoming top-level prices:", top_vals)
            except Exception:
                pass
            serializer.is_valid(raise_exception=True)
        except Exception:
            # log serializer errors to server console for easier debugging
            try:
                print("UmrahPackage.create validation errors:", serializer.errors)
            except Exception:
                print("UmrahPackage.create validation failed (could not read serializer.errors)")
            raise
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        """Update an existing package while accepting organization via query param
        and sanitizing nested lists coming from the frontend (same rules as create).
        """
        partial = kwargs.pop('partial', False)
        try:
            data = request.data.copy()
        except Exception:
            data = dict(request.data)

        org_id = request.query_params.get("organization") or data.get("organization")
        if org_id and not data.get("organization"):
            data["organization"] = org_id

        def _clean_list(lst, key_names):
            if not isinstance(lst, (list, tuple)):
                return []
            out = []
            for item in lst:
                if not isinstance(item, dict):
                    continue
                valid = False
                for k in key_names:
                    v = item.get(k)
                    try:
                        if v is None:
                            continue
                        if isinstance(v, str) and v.strip() == "":
                            continue
                        if int(v) > 0:
                            valid = True
                            break
                    except Exception:
                        if v:
                            valid = True
                            break
                if valid:
                    out.append(item)
            return out

        if data.get("hotel_details"):
            data["hotel_details"] = _clean_list(data.get("hotel_details"), ["hotel"])
        if data.get("transport_details"):
            data["transport_details"] = _clean_list(data.get("transport_details"), ["transport_sector"])
        if data.get("ticket_details"):
            data["ticket_details"] = _clean_list(data.get("ticket_details"), ["ticket"])
        if data.get("discount_details"):
            cleaned = []
            for d in data.get("discount_details"):
                try:
                    if (d.get("max_discount") is not None and float(d.get("max_discount", 0)) > 0) or (int(d.get("adault_from", 0)) > 0 and int(d.get("adault_to", 0)) > 0):
                        cleaned.append(d)
                except Exception:
                    if d:
                        cleaned.append(d)
            data["discount_details"] = cleaned

        instance = self.get_object()
        serializer = self.get_serializer(instance, data=data, partial=partial)
        # Debug: log incoming hotel_details and top-level selling/purchase fields on update
        try:
            try:
                print("UmrahPackage.update incoming hotel_details:", data.get("hotel_details"))
                keys = [
                    'food_selling_price','food_purchase_price',
                    'makkah_ziyarat_selling_price','makkah_ziyarat_purchase_price',
                    'madinah_ziyarat_selling_price','madinah_ziyarat_purchase_price',
                    'transport_selling_price','transport_purchase_price',
                    'adault_visa_selling_price','adault_visa_purchase_price',
                    'child_visa_selling_price','child_visa_purchase_price',
                    'infant_visa_selling_price','infant_visa_purchase_price',
                ]
                top_vals = {k: data.get(k) for k in keys}
                print("UmrahPackage.update incoming top-level prices:", top_vals)
            except Exception:
                pass
            serializer.is_valid(raise_exception=True)
        except Exception:
            try:
                print("UmrahPackage.update validation errors:", serializer.errors)
            except Exception:
                print("UmrahPackage.update validation failed (could not read serializer.errors)")
            raise

        self.perform_update(serializer)
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def get_queryset(self):
        from organization.models import OrganizationLink
        
        organization_id = self.request.query_params.get("organization")
        if not organization_id:
            raise PermissionDenied("Missing 'organization' query parameter.")
        is_active = self.request.query_params.get("is_active")

        # Get linked organizations
        linked_org_ids = OrganizationLink.get_linked_organizations(int(organization_id))
        
        # Include own organization and linked organizations
        allowed_org_ids = {int(organization_id)} | linked_org_ids

        # Build allowed owner organization ids based on AllowedReseller entries
        allowed_owner_org_ids = []
        try:
            # Query AllowedReseller for the calling organization only
            allowed_qs = AllowedReseller.objects.filter(
                reseller_company_id=int(organization_id),
                requested_status_by_reseller="ACCEPTED",
            )
            for ar in allowed_qs:
                inv = getattr(ar, "inventory_owner_company", None)
                if inv is None:
                    continue
                org_id = getattr(inv, "organization_id", None) or getattr(inv, "main_organization_id", None) or None
                if org_id:
                    types = ar.allowed_types or []
                    if "UMRAH_PACKAGES" in types:
                        allowed_owner_org_ids.append(org_id)
        except Exception:
            allowed_owner_org_ids = []

        owner_ids = set(allowed_owner_org_ids) | {int(organization_id)}

        own_org_id = int(organization_id)

        query_filter = Q()
        # include packages published by owner_ids or whose inventory_owner_organization_id is in owner_ids
        query_filter &= (Q(organization_id__in=owner_ids) | Q(inventory_owner_organization_id__in=owner_ids))
        if is_active is not None:
            # accept 'true'/'false' strings
            if isinstance(is_active, str):
                is_active_val = is_active.lower() in ("1", "true", "yes")
            else:
                is_active_val = bool(is_active)
            query_filter &= Q(is_active=is_active_val)

        queryset = UmrahPackage.objects.filter(query_filter).prefetch_related(
            "hotel_details__hotel",
            "transport_details__transport_sector",
            "ticket_details__ticket",
            "discount_details",
        )

        # Exclude packages whose ticket departures have already passed by default.
        # If a package has no tickets, the passed-date rule should NOT apply (keep such packages).
        # Frontend can opt out by passing ?include_past=true
        include_past = self.request.query_params.get("include_past")
        if not (isinstance(include_past, str) and include_past.lower() in ("1", "true", "yes")):
            now = timezone.now()
            # exclude packages where any ticket's trip details show a departure < now
            queryset = queryset.exclude(ticket_details__ticket__trip_details__departure_date_time__lt=now)

        # Separate own organization from linked organizations
        own_org_id = int(organization_id)
        linked_org_ids_only = linked_org_ids - {own_org_id}
        
        # Base filter: always show packages from own organization
        base_filter = Q(organization_id=own_org_id)
        
        # For linked organizations, only show if reselling_allowed=True
        linked_filter = Q(organization_id__in=linked_org_ids_only) & Q(reselling_allowed=True)
        
        # For reseller callers (third parties), ensure items can be resold
        resell_filter = Q(reselling_allowed=True)
        # If inventory_owner_organization_id is set, only allow resale to different organizations
        resell_filter &= ~Q(inventory_owner_organization_id=own_org_id)
        
        queryset = queryset.filter(
            base_filter | linked_filter | resell_filter
        ).distinct()
        return queryset
    @action(detail=False, methods=["get"])
    def get_by_id(self, request):
        package_id = request.query_params.get("id")
        if not package_id:
            return Response(
                {"error": "Missing 'id' query parameter"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            package = UmrahPackage.objects.prefetch_related(
                "hotel_details__hotel",
                "transport_details__transport_sector",
                "ticket_details__ticket",
                "discount_details",
            ).get(id=package_id)
        except UmrahPackage.DoesNotExist:
            return Response({"error": "Package not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(package)
        return Response(serializer.data)


class CustomUmrahPackageViewSet(ModelViewSet):
    serializer_class = CustomUmrahPackageSerializer

    def get_queryset(self):
        organization_id = self.request.query_params.get("organization")
        
        query_filter = Q()
        if not organization_id:
            raise PermissionDenied("Missing 'organization' query parameter.")
        
        queryset = CustomUmrahPackage.objects.filter(query_filter).select_related("agency").prefetch_related(
            "hotel_details__hotel",
            "transport_details__transport_sector",
            "ticket_details__ticket",
        )
        return queryset

class SetVisaTypeViewSet(ModelViewSet):
    serializer_class = SetVisaTypeSerializer

    def get_queryset(self):
        organization_id = self.request.query_params.get("organization")
        if not organization_id:
            raise PermissionDenied("Missing 'organization' query parameter.")
        return SetVisaType.objects.filter(organization_id=organization_id)



class AllPricesAPIView(APIView):
    def get(self, request):
        organization_id = request.query_params.get("organization_id")
        if not organization_id:
            return Response({"error": "organization_id is required"}, status=400)

        # apply filter on all models
        data = {
            "riyal_rates": RiyalRate.objects.filter(organization_id=organization_id).values(),
            "shirkas": Shirka.objects.filter(organization_id=organization_id).values(),
            "umrah_visa_prices": UmrahVisaPrice.objects.filter(organization_id=organization_id).values(),
            "umrah_visa_type_two": UmrahVisaPriceTwo.objects.filter(organization_id=organization_id).values(),
            "only_visa_prices": OnlyVisaPrice.objects.filter(organization_id=organization_id).values(),
            # "transport_sector_prices": TransportSectorPrice.objects.filter(organization_id=organization_id).values(),
            "airlines": Airlines.objects.filter(organization_id=organization_id).values(),
            "cities": City.objects.filter(organization_id=organization_id).values(),
            "set_visa_type": SetVisaType.objects.filter(organization_id=organization_id).values(),
            "food_prices": FoodPrice.objects.filter(organization_id=organization_id, active=True).values(),
            "ziarat_prices": ZiaratPrice.objects.filter(organization_id=organization_id).values(),
            "tickets": TicketSerializer(
                Ticket.objects.filter(organization_id=organization_id), many=True
            ).data,
            "hotels": HotelsSerializer(
                Hotels.objects.filter(organization_id=organization_id), many=True
            ).data,
        }

        return Response(data)


class PublicUmrahPackageListAPIView(generics.ListAPIView):
    """Public list of Umrah packages (read-only)."""
    serializer_class = PublicUmrahPackageListSerializer

    def get_queryset(self):
        today = timezone.now().date()
        qs = UmrahPackage.objects.filter(
            is_active=True, is_public=True
        )
        # apply date window if fields present
        qs = qs.filter(
            Q(available_start_date__isnull=True) | Q(available_start_date__lte=today),
            Q(available_end_date__isnull=True) | Q(available_end_date__gte=today),
        )

        # filters
        city = self.request.query_params.get("city")
        if city:
            qs = qs.filter(hotel_details__hotel__city_id=city)

        duration = self.request.query_params.get("duration")
        if duration:
            try:
                dur = int(duration)
                qs = qs.filter(hotel_details__number_of_nights=dur)
            except Exception:
                pass

        price_min = self.request.query_params.get("price_min")
        price_max = self.request.query_params.get("price_max")
        if price_min:
            try:
                qs = qs.filter(Q(price_per_person__gte=price_min) | Q(adault_visa_price__gte=price_min))
            except Exception:
                pass
        if price_max:
            try:
                qs = qs.filter(Q(price_per_person__lte=price_max) | Q(adault_visa_price__lte=price_max))
            except Exception:
                pass

        hotel_star = self.request.query_params.get("hotel_star")
        if hotel_star:
            qs = qs.filter(hotel_details__hotel__star_rating=hotel_star)

        availability = self.request.query_params.get("availability")
        if availability and availability.lower() in ("1", "true", "yes"):
            qs = qs.filter(left_seats__gt=0)

        return qs.distinct()


class PublicUmrahPackageDetailAPIView(APIView):
    """Public package detail view. Lookup by id or slug (slugified title)."""

    def get(self, request, identifier):
        # try id
        pkg = None
        try:
            if identifier.isdigit():
                pkg = UmrahPackage.objects.get(id=int(identifier), is_active=True, is_public=True)
        except UmrahPackage.DoesNotExist:
            pkg = None

        if pkg is None:
            # try slug match on title
            sl = identifier
            qs = UmrahPackage.objects.filter(is_active=True, is_public=True)
            for p in qs:
                if slugify(p.title) == sl:
                    pkg = p
                    break

        if not pkg:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = PublicUmrahPackageDetailSerializer(pkg)
        return Response(serializer.data)