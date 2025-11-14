from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
from .models import Lead, FollowUpHistory, LoanCommitment
from .serializers import LeadSerializer, FollowUpHistorySerializer, LoanCommitmentSerializer
from .permissions import IsBranchUser
from rest_framework.permissions import IsAdminUser
from .serializers import FollowUpSerializer
from .models import FollowUp
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status


class LeadCreateAPIView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, IsBranchUser]
    serializer_class = LeadSerializer


class LeadListAPIView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LeadSerializer
    queryset = Lead.objects.all()

    def get_queryset(self):
        qs = super().get_queryset()
        branch_id = self.request.query_params.get("branch_id")
        lead_status = self.request.query_params.get("lead_status")
        next_followup_date = self.request.query_params.get("next_followup_date")

        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        if lead_status:
            qs = qs.filter(lead_status=lead_status)
        if next_followup_date:
            qs = qs.filter(next_followup_date=next_followup_date)

        return qs.order_by("-created_at")


class LeadDetailAPIView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LeadSerializer
    queryset = Lead.objects.all()


class LeadUpdateAPIView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated, IsBranchUser]
    serializer_class = LeadSerializer
    queryset = Lead.objects.all()


class FollowUpCreateAPIView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, IsBranchUser]
    serializer_class = FollowUpHistorySerializer

    def create(self, request, *args, **kwargs):
        resp = super().create(request, *args, **kwargs)
        # Optionally update lead next_followup_date and last_contacted_date
        lead_id = request.data.get("lead")
        try:
            lead = Lead.objects.get(pk=lead_id)
            lead.next_followup_date = request.data.get("next_followup_date") or lead.next_followup_date
            lead.last_contacted_date = request.data.get("followup_date") or lead.last_contacted_date
            lead.save()
        except Exception:
            pass
        return resp


class LoanPromiseAPIView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, IsBranchUser]
    serializer_class = LoanCommitmentSerializer


class LeadSearchAPIView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LeadSerializer

    def get(self, request, *args, **kwargs):
        passport = request.query_params.get("passport")
        contact = request.query_params.get("contact")
        org = request.query_params.get("organization_id")

        qs = Lead.objects.all()
        if org:
            qs = qs.filter(organization_id=org)
        if passport:
            qs = qs.filter(passport_number__iexact=passport)
        if contact:
            qs = qs.filter(contact_number__icontains=contact)

        serializer = LeadSerializer(qs, many=True)
        return Response(serializer.data)



@api_view(["PUT"])
@permission_classes([IsAuthenticated, IsBranchUser])
def convert_lead(request, pk):
    lead = get_object_or_404(Lead, pk=pk)
    lead.conversion_status = "converted_to_booking"
    lead.lead_status = "confirmed"
    booking_id = request.data.get("booking_id")
    pex_id = request.data.get("pex_id")
    if booking_id:
        lead.booking_id = booking_id
    if pex_id:
        lead.pex_id = pex_id
    lead.save(update_fields=["conversion_status", "lead_status", "booking_id", "pex_id", "updated_at"])
    return Response({"message": "Lead marked as converted", "lead_id": lead.id})


@api_view(["PUT"])
@permission_classes([IsAuthenticated, IsBranchUser])
def mark_lost(request, pk):
    lead = get_object_or_404(Lead, pk=pk)
    lead.lead_status = "lost"
    lead.conversion_status = "lost"
    lead.remarks = request.data.get("remarks", lead.remarks)
    lead.save(update_fields=["lead_status", "conversion_status", "remarks", "updated_at"])
    return Response({"message": "Lead marked as lost"})


class TodayFollowupsView(generics.ListAPIView):
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated, IsBranchUser]

    def get_queryset(self):
        today = timezone.now().date()
        return Lead.objects.filter(next_followup_date=today, lead_status__in=["new", "followup"]).order_by("-updated_at")


class OverdueLoansView(generics.ListAPIView):
    serializer_class = LoanCommitmentSerializer
    permission_classes = [IsAuthenticated, IsBranchUser]

    def get_queryset(self):
        today = timezone.now().date()
        return LoanCommitment.objects.filter(promised_clear_date__lt=today, status="pending").order_by("-promised_clear_date")


class AdminFollowUpViewSet(viewsets.ModelViewSet):
    """Admin-only CRUD for FollowUps with actions to close/reopen."""
    permission_classes = [IsAdminUser]
    serializer_class = FollowUpSerializer
    queryset = FollowUp.objects.all().order_by('-created_at')
    filter_backends = [filters.SearchFilter]
    search_fields = ['booking__booking_number', 'lead__customer_full_name', 'status']

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        fu = self.get_object()
        try:
            fu.close(user=request.user)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(self.get_serializer(fu).data)

    @action(detail=True, methods=['post'])
    def reopen(self, request, pk=None):
        fu = self.get_object()
        fu.reopen()
        return Response(self.get_serializer(fu).data)
