from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from .models import Customer, Lead, FollowUpHistory, LoanCommitment
from .serializers import (
    CustomerSerializer,
    LeadSerializer,
    FollowUpHistorySerializer,
    LoanCommitmentSerializer,
)
from booking.models import Booking
from django.db import transaction
from django.utils import timezone


@extend_schema_view(
    list=extend_schema(
        summary="List all active customers",
        description="Get all customers with is_active=True, ordered by most recently updated.",
        tags=["Customers - Auto Collection"]
    ),
    retrieve=extend_schema(
        summary="Get customer details",
        description="Retrieve full details of a specific customer including contact info, source, and activity.",
        tags=["Customers - Auto Collection"]
    ),
    create=extend_schema(
        summary="Create new customer",
        description="Create a new customer record (typically used by manual-add endpoint).",
        tags=["Customers - Auto Collection"]
    ),
    update=extend_schema(
        summary="Update customer",
        description="Update customer information.",
        tags=["Customers - Auto Collection"]
    ),
    partial_update=extend_schema(
        summary="Partially update customer",
        description="Update specific fields of a customer.",
        tags=["Customers - Auto Collection"]
    ),
    destroy=extend_schema(
        summary="Delete customer (soft delete)",
        description="Soft-delete a customer by setting is_active=False. Does not remove from database.",
        tags=["Customers - Auto Collection"]
    ),
)
class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.filter(is_active=True).order_by("-updated_at")
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Auto-collect customers from all sources",
        description="""
        **GET**: Return merged customer list (de-duplicated by phone/email) from all sources:
        - Bookings
        - Passport Leads  
        - Area Branch customers
        
        **POST**: Trigger on-demand scan of recent bookings to auto-create/update customer records.
        """,
        tags=["Customers - Auto Collection"],
        parameters=[
            OpenApiParameter(
                name="cutoff_days",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description="Number of days to look back for bookings (default: 30)",
                required=False,
            ),
        ],
        responses={
            200: OpenApiTypes.OBJECT,
        },
        examples=[
            OpenApiExample(
                "GET Response",
                value={
                    "total_customers": 2,
                    "customers": [
                        {
                            "customer_id": 101,
                            "full_name": "Ali Raza",
                            "phone": "+92-3001234567",
                            "email": "ali.raza@gmail.com",
                            "city": "Lahore",
                            "source": "Booking",
                            "last_activity": "2025-10-14",
                            "branch_id": 12,
                            "organization_id": 5
                        }
                    ]
                }
            ),
            OpenApiExample(
                "POST Response",
                value={
                    "created": 5,
                    "updated": 12
                }
            )
        ]
    )
    @action(detail=False, methods=["get", "post"], permission_classes=[IsAuthenticated])
    def auto_collection(self, request):
        """GET: return merged customer list (de-duplicated by phone/email).
           POST: trigger an on-demand scan of recent Bookings (same behavior as before)
        """
        if request.method == "GET":
            # merged listing: prefer grouping by phone then email
            qs = Customer.objects.filter(is_active=True).order_by("-updated_at")
            seen = {}
            merged = []
            for c in qs:
                key = None
                if c.phone:
                    key = f"phone:{c.phone}"
                elif c.email:
                    key = f"email:{c.email}"
                else:
                    key = f"id:{c.id}"

                existing = seen.get(key)
                if not existing:
                    seen[key] = c
                    merged.append(c)
                else:
                    # keep the one with latest updated_at
                    if c.updated_at and existing.updated_at and c.updated_at > existing.updated_at:
                        seen[key] = c
            serializer = CustomerSerializer(merged, many=True)
            return Response({"total_customers": len(merged), "customers": serializer.data})

        # POST behavior: scan recent bookings and upsert
        cutoff_days = int(request.data.get("cutoff_days", 30))
        since = timezone.now() - timezone.timedelta(days=cutoff_days)
        bookings = Booking.objects.filter(created_at__gte=since)
        created = 0
        updated = 0
        with transaction.atomic():
            for b in bookings:
                # Extract primary contact from booking person details
                person = None
                try:
                    person = b.person_details.first()
                except Exception:
                    person = None

                if not person:
                    continue

                full_name = " ".join(filter(None, [person.first_name, person.last_name])).strip() or b.user.username
                phone = person.contact_number or None
                email = None

                if not (phone or email):
                    continue

                obj, created_flag = Customer.objects.update_or_create(
                    phone=phone,
                    defaults={
                        "full_name": full_name,
                        "email": email,
                        "branch": b.branch,
                        "organization": b.organization,
                        "source": "Booking",
                        "last_activity": b.date,
                        "is_active": True,
                    },
                )
                if created_flag:
                    created += 1
                else:
                    updated += 1

        return Response({"created": created, "updated": updated})

    @extend_schema(
        summary="Manually add a new customer",
        description="""
        Add a walk-in or untracked customer manually to the system.
        Useful for customers who haven't booked yet but shared contact info.
        """,
        tags=["Customers - Auto Collection"],
        request=CustomerSerializer,
        responses={201: CustomerSerializer},
        examples=[
            OpenApiExample(
                "Manual Add Request",
                value={
                    "full_name": "Ahmed Khan",
                    "phone": "+92-3009876543",
                    "email": "ahmed@gmail.com",
                    "city": "Faisalabad",
                    "source": "Walk-in",
                    "branch_id": 12,
                    "organization_id": 5
                }
            )
        ]
    )
    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated], url_path="manual-add")
    def manual_add(self, request):
        """Create a customer manually via API."""
        serializer = CustomerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()
        return Response(CustomerSerializer(obj).data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        """Soft-delete: set is_active=False instead of hard delete."""
        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    list=extend_schema(
        summary="List all leads",
        description="Get all customer leads ordered by creation date.",
        tags=["Customers - Leads"]
    ),
    retrieve=extend_schema(
        summary="Get lead details",
        tags=["Customers - Leads"]
    ),
    create=extend_schema(
        summary="Create new lead",
        tags=["Customers - Leads"]
    ),
    update=extend_schema(
        summary="Update lead",
        tags=["Customers - Leads"]
    ),
    partial_update=extend_schema(
        summary="Partially update lead",
        tags=["Customers - Leads"]
    ),
    destroy=extend_schema(
        summary="Delete lead",
        tags=["Customers - Leads"]
    ),
)
class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all().order_by("-created_at")
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated]


@extend_schema_view(
    list=extend_schema(
        summary="List follow-up history",
        description="Get all follow-up records ordered by creation date.",
        tags=["Customers - Follow-ups"]
    ),
    retrieve=extend_schema(
        summary="Get follow-up details",
        tags=["Customers - Follow-ups"]
    ),
    create=extend_schema(
        summary="Create follow-up record",
        tags=["Customers - Follow-ups"]
    ),
    update=extend_schema(
        summary="Update follow-up",
        tags=["Customers - Follow-ups"]
    ),
    partial_update=extend_schema(
        summary="Partially update follow-up",
        tags=["Customers - Follow-ups"]
    ),
    destroy=extend_schema(
        summary="Delete follow-up",
        tags=["Customers - Follow-ups"]
    ),
)
class FollowUpViewSet(viewsets.ModelViewSet):
    queryset = FollowUpHistory.objects.all().order_by("-created_at")
    serializer_class = FollowUpHistorySerializer
    permission_classes = [IsAuthenticated]


@extend_schema_view(
    list=extend_schema(
        summary="List loan commitments",
        description="Get all loan commitment records ordered by creation date.",
        tags=["Customers - Loan Commitments"]
    ),
    retrieve=extend_schema(
        summary="Get loan commitment details",
        tags=["Customers - Loan Commitments"]
    ),
    create=extend_schema(
        summary="Create loan commitment",
        tags=["Customers - Loan Commitments"]
    ),
    update=extend_schema(
        summary="Update loan commitment",
        tags=["Customers - Loan Commitments"]
    ),
    partial_update=extend_schema(
        summary="Partially update loan commitment",
        tags=["Customers - Loan Commitments"]
    ),
    destroy=extend_schema(
        summary="Delete loan commitment",
        tags=["Customers - Loan Commitments"]
    ),
)
class LoanCommitmentViewSet(viewsets.ModelViewSet):
    queryset = LoanCommitment.objects.all().order_by("-created_at")
    serializer_class = LoanCommitmentSerializer
    permission_classes = [IsAuthenticated]
