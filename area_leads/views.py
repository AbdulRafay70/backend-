from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Sum, Q
from decimal import Decimal
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from .models import AreaLead, LeadFollowUp, LeadConversation, LeadPaymentPromise
from .serializers import (
    AreaLeadSerializer,
    LeadFollowUpSerializer,
    LeadConversationSerializer,
    LeadPaymentPromiseSerializer,
)
from .permissions import IsBranchUser


class AreaLeadCreateView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, IsBranchUser]
    serializer_class = AreaLeadSerializer


class AreaLeadSearchView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AreaLeadSerializer

    def get_queryset(self):
        passport = self.request.query_params.get("passport")
        contact = self.request.query_params.get("contact")
        qs = AreaLead.objects.all()
        if passport:
            qs = qs.filter(passport_number__iexact=passport)
        if contact:
            qs = qs.filter(contact_number__icontains=contact)
        return qs


class FollowUpCreateView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, IsBranchUser]
    serializer_class = LeadFollowUpSerializer


class FollowUpTodayView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsBranchUser]
    serializer_class = AreaLeadSerializer

    def get_queryset(self):
        today = timezone.now().date()
        return AreaLead.objects.filter(followups__next_followup_date=today).distinct()


class ConversationAddView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, IsBranchUser]
    serializer_class = LeadConversationSerializer


class ConversationHistoryView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LeadConversationSerializer

    def get_queryset(self):
        lead_id = self.request.query_params.get("lead_id")
        qs = LeadConversation.objects.all()
        if lead_id:
            qs = qs.filter(lead_id=lead_id)
        return qs.order_by("-timestamp")


class PaymentPromiseAddView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, IsBranchUser]
    serializer_class = LeadPaymentPromiseSerializer


class PaymentPromiseUpcomingView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsBranchUser]
    serializer_class = LeadPaymentPromiseSerializer

    def get_queryset(self):
        today = timezone.now().date()
        return LeadPaymentPromise.objects.filter(due_date__gte=today).order_by("due_date")


@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsBranchUser])
def update_status(request):
    lead_id = request.data.get("lead_id")
    status = request.data.get("status")
    lead = get_object_or_404(AreaLead, pk=lead_id)
    if status not in [choice[0] for choice in AreaLead._meta.get_field("lead_status").choices]:
        return Response({"error": "Invalid status"}, status=400)
    lead.lead_status = status
    lead.save(update_fields=["lead_status", "updated_at"])
    return Response({"message": "Lead status updated", "lead_id": lead.id})


@extend_schema(
    parameters=[
        OpenApiParameter(
            name='organization_id',
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            required=True,
            description='Organization ID to filter area agents'
        ),
    ],
    description='Returns list of all area agents with negative final balance (pending payments) for a specific organization',
    summary='Get pending balances for area agents',
    responses={
        200: {
            'description': 'List of area agents with pending balances',
            'example': {
                "organization_id": "5",
                "total_pending_area_agents": 2,
                "area_agents": [
                    {
                        "area_agent_id": 1,
                        "area_agent_name": "John Doe",
                        "contact_no": "1234567890",
                        "pending_balance": -5000.00,
                        "payment_promise_ids": [1, 2, 3],
                        "branch_id": "B001"
                    }
                ]
            }
        },
        400: {
            'description': 'Bad Request - organization_id parameter missing'
        }
    }
)
@api_view(["GET"])
@permission_classes([AllowAny])
def pending_balances(request):
    """
    GET /api/area-agents/pending-balances?organization_id={organization_id}
    
    Returns list of all area agents with negative final balance (pending payments)
    """
    organization_id = request.query_params.get("organization_id")
    
    if not organization_id:
        return Response(
            {"detail": "organization_id query parameter is required"},
            status=400
        )
    
    # Filter area leads by organization_id
    area_leads = AreaLead.objects.filter(organization_id=organization_id)
    
    pending_area_agents = []
    
    for area_lead in area_leads:
        # Calculate total pending amount from payment promises
        payment_summary = LeadPaymentPromise.objects.filter(
            lead=area_lead,
            status__in=["pending", "overdue"]
        ).aggregate(
            total_pending=Sum('amount_due')
        )
        
        total_pending = payment_summary['total_pending'] or Decimal('0.00')
        
        # Only include area agents with pending balance (negative balance)
        if total_pending > 0:
            # Get payment promise IDs for this lead
            promise_ids = list(
                LeadPaymentPromise.objects.filter(
                    lead=area_lead,
                    status__in=["pending", "overdue"]
                ).values_list('id', flat=True)
            )
            
            pending_area_agents.append({
                "area_agent_id": area_lead.id,
                "area_agent_name": area_lead.customer_name,
                "contact_no": area_lead.contact_number,
                "pending_balance": -float(total_pending),  # Negative to indicate they owe money
                "payment_promise_ids": promise_ids,
                "branch_id": area_lead.branch_id,
            })
    
    return Response({
        "organization_id": organization_id,
        "total_pending_area_agents": len(pending_area_agents),
        "area_agents": pending_area_agents
    })
