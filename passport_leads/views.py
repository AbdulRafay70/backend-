from rest_framework import viewsets, generics, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import PassportLead, PaxProfile, FollowUpLog
from .serializers import PassportLeadSerializer, PassportLeadCreateSerializer, PaxProfileSerializer, FollowUpLogSerializer
from rest_framework.views import APIView
from rest_framework import serializers
from django.utils.dateparse import parse_date
from rest_framework import status
from django.shortcuts import get_object_or_404
from decimal import Decimal
from django.db.models import Q

# drf-spectacular helpers (add OpenAPI meta for custom endpoints)
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter

# ledger models (optional integration)
try:
    from ledger.models import Account, LedgerEntry, LedgerLine
except Exception:
    Account = LedgerEntry = LedgerLine = None


class PassportLeadViewSet(viewsets.ModelViewSet):
    queryset = PassportLead.objects.filter(is_deleted=False).order_by('-created_at')
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ('create',):
            return PassportLeadCreateSerializer
        return PassportLeadSerializer

    def perform_destroy(self, instance):
        # soft delete
        instance.is_deleted = True
        instance.save()

    def destroy(self, request, *args, **kwargs):
        # override to return a JSON confirmation instead of 204
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({'detail': 'Lead soft-deleted', 'lead_id': instance.id})

    @action(detail=False, methods=['get'], url_path='list')
    @extend_schema(
        summary="List Passport Leads",
        description="Return compact or detailed leads list. Query params: branch_id, status, date_from, date_to, details, include",
        parameters=[
            OpenApiParameter("branch_id", description="Branch id to filter", required=False),
            OpenApiParameter("status", description="followup_status to filter", required=False),
            OpenApiParameter("date_from", description="Start created date (YYYY-MM-DD)", required=False),
            OpenApiParameter("date_to", description="End created date (YYYY-MM-DD)", required=False),
            OpenApiParameter("details", description="Return detailed objects when truthy", required=False),
            OpenApiParameter("include", description="Comma list of related fields to include e.g. pax", required=False),
        ],
    )
    def list_summary(self, request):
        """Router-mounted GET /passport-leads/list/ to return summary or details per query params."""
        qs = PassportLead.objects.filter(is_deleted=False)

        branch_id = request.GET.get('branch_id')
        status_param = request.GET.get('status')
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')

        if branch_id:
            try:
                qs = qs.filter(branch_id=int(branch_id))
            except ValueError:
                return Response({'error': 'branch_id must be an integer'}, status=status.HTTP_400_BAD_REQUEST)

        if status_param:
            qs = qs.filter(followup_status__iexact=status_param)

        start_date = parse_date(date_from) if date_from else None
        end_date = parse_date(date_to) if date_to else None
        if start_date and end_date:
            qs = qs.filter(created_at__date__gte=start_date, created_at__date__lte=end_date)
        elif start_date:
            qs = qs.filter(created_at__date__gte=start_date)
        elif end_date:
            qs = qs.filter(created_at__date__lte=end_date)

        qs = qs.order_by('-created_at')

        details_val = (request.GET.get('details') or '').lower()
        include_param = request.GET.get('include', '')
        includes = {p.strip().lower() for p in include_param.split(',') if p.strip()} if include_param else set()

        truthy = {'1', 'true', 'yes', 'on'}
        if details_val in truthy or 'pax' in includes:
            serializer = PassportLeadSerializer(qs, many=True)
        else:
            serializer = LeadListItemSerializer(qs, many=True)

        return Response({'total_leads': qs.count(), 'leads': serializer.data})

    @action(detail=True, methods=['get'], url_path='history')
    @extend_schema(
        summary="Lead history",
        description="Return lead details plus pax previous bookings and optional payments. Query param: include_payments=1",
        parameters=[OpenApiParameter("include_payments", description="Include payment lines for bookings", required=False)],
    )
    def history(self, request, pk=None):
        """Return lead details plus pax previous bookings and optional payments.

        GET /passport-leads/{id}/history/?include_payments=1
        """
        lead = self.get_object()
        # serialize lead using existing serializer
        lead_ser = PassportLeadSerializer(lead, context={'request': request})
        data = dict(lead_ser.data)

        # we'll return pax as pax_details to match requested shape
        pax_list = data.get('pax', [])
        include_payments = (request.GET.get('include_payments') or '').lower() in ('1', 'true', 'yes')

        enhanced_pax = []
        for pax in pax_list:
            # basic pax fields
            pax_entry = {
                'pax_id': pax.get('id'),
                'first_name': pax.get('first_name'),
                'last_name': pax.get('last_name'),
                'passport_number': pax.get('passport_number'),
                'gender': pax.get('gender'),
                'nationality': pax.get('nationality'),
            }

            passport_no = pax.get('passport_number')
            previous = []
            if passport_no:
                try:
                    from booking.models import Booking
                except Exception:
                    Booking = None

                if Booking:
                    bookings = Booking.objects.filter(person_details__passport_number=passport_no).distinct().order_by('-created_at')[:10]
                    for b in bookings:
                        payments = []
                        if include_payments and hasattr(b, 'payment_details'):
                            for p in getattr(b, 'payment_details').all():
                                payments.append({
                                    'payment_id': p.id,
                                    'amount': p.amount,
                                    'method': p.method,
                                    'date': p.date.isoformat() if getattr(p, 'date', None) else None,
                                    'status': p.status,
                                })

                        previous.append({
                            'booking_id': b.id,
                            'type': getattr(b, 'booking_type', None) or getattr(b, 'category', None),
                            'status': getattr(b, 'status', None),
                            'payments': payments,
                        })

            pax_entry['previous_bookings'] = previous
            enhanced_pax.append(pax_entry)

        response = {
            'lead_id': data.get('id'),
            'customer_name': data.get('customer_name'),
            'customer_phone': data.get('customer_phone'),
            'pending_balance': data.get('pending_balance'),
            'followup_status': data.get('followup_status'),
            'next_followup_date': data.get('next_followup_date'),
            'remarks': data.get('remarks'),
            'pax_details': enhanced_pax,
        }
        return Response(response)

    @action(detail=True, methods=['post'])
    @extend_schema(
        summary="Add follow-up remark",
        request=FollowUpLogSerializer,
        responses={201: OpenApiResponse(response=FollowUpLogSerializer)},
    )
    def add_followup(self, request, pk=None):
        lead = self.get_object()
        serializer = FollowUpLogSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(lead=lead, created_by=request.user)
        # optionally update next_followup_date
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PaxProfileViewSet(viewsets.ModelViewSet):
    queryset = PaxProfile.objects.all().order_by('-created_at')
    serializer_class = PaxProfileSerializer
    permission_classes = [IsAuthenticated]


class TodayFollowUpsView(generics.ListAPIView):
    serializer_class = PassportLeadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from django.utils import timezone
        today = timezone.localdate()
        return PassportLead.objects.filter(is_deleted=False, next_followup_date=today).order_by('next_followup_date')

    @extend_schema(
        summary="Today's followups",
        description="List of leads with next_followup_date == today",
    )
    def get(self, request, *args, **kwargs):
        qs = self.get_queryset()
        followups = []
        for lead in qs:
            followups.append({
                'lead_id': lead.id,
                'customer_name': lead.customer_name,
                'phone': lead.customer_phone,
                'remarks': lead.remarks,
                'next_followup_date': lead.next_followup_date.isoformat() if lead.next_followup_date else None,
            })
        return Response({'total_due': len(followups), 'followups': followups})


class LeadListItemSerializer(serializers.Serializer):
    lead_id = serializers.IntegerField(source='id')
    customer_name = serializers.CharField()
    customer_phone = serializers.CharField(allow_blank=True, allow_null=True)
    passport_number = serializers.CharField(allow_blank=True, allow_null=True)
    pending_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    followup_status = serializers.CharField(allow_blank=True, allow_null=True)
    next_followup_date = serializers.DateField(allow_null=True)
    remarks = serializers.CharField(allow_blank=True, allow_null=True)
    branch_id = serializers.IntegerField()
    assigned_to_name = serializers.SerializerMethodField()

    def get_assigned_to_name(self, obj):
        user = getattr(obj, 'assigned_to', None)
        return str(user) if user else None


class PassportLeadListView(APIView):
    """
    GET /passport-leads/list
    Query params: branch_id, status, date_from (YYYY-MM-DD), date_to (YYYY-MM-DD)
    Returns: { total_leads: int, leads: [ ... ] }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """List endpoint with optional details parameter (alternate to router action)."""
    
    @extend_schema(
        summary="Legacy list of passport leads",
        description="Alternate list endpoint — use /passport-leads/list/ on the router for consistent docs",
    )
    def get(self, request, *args, **kwargs):
        qs = PassportLead.objects.filter(is_deleted=False)

        branch_id = request.GET.get('branch_id')
        status_param = request.GET.get('status')
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')

        if branch_id:
            try:
                qs = qs.filter(branch_id=int(branch_id))
            except ValueError:
                return Response({'error': 'branch_id must be an integer'}, status=status.HTTP_400_BAD_REQUEST)

        if status_param:
            qs = qs.filter(followup_status__iexact=status_param)

        # filter by created_at date range if provided
        start_date = parse_date(date_from) if date_from else None
        end_date = parse_date(date_to) if date_to else None
        if start_date and end_date:
            qs = qs.filter(created_at__date__gte=start_date, created_at__date__lte=end_date)
        elif start_date:
            qs = qs.filter(created_at__date__gte=start_date)
        elif end_date:
            qs = qs.filter(created_at__date__lte=end_date)

        qs = qs.order_by('-created_at')

        # support details=true (or details=1) to return the full lead serializer
        details_val = (request.GET.get('details') or '').lower()
        include_param = request.GET.get('include', '')
        includes = {p.strip().lower() for p in include_param.split(',') if p.strip()} if include_param else set()

        truthy = {'1', 'true', 'yes', 'on'}
        if details_val in truthy or 'pax' in includes:
            # full serializer includes nested pax and assigned_to string
            serializer = PassportLeadSerializer(qs, many=True)
        else:
            serializer = LeadListItemSerializer(qs, many=True)

        return Response({'total_leads': qs.count(), 'leads': serializer.data})


class PaxUpdateView(APIView):
    """POST/PUT/PATCH /pax/update/{pax_id}/ - update a pax profile"""
    permission_classes = [IsAuthenticated]

    class PaxUpdateSerializer(serializers.Serializer):
        first_name = serializers.CharField(required=False)
        last_name = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        passport_number = serializers.CharField(required=False)
        phone = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        nationality = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        notes = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    def post(self, request, pax_id=None, *args, **kwargs):
        return self.put(request, pax_id, *args, **kwargs)

    def patch(self, request, pax_id=None, *args, **kwargs):
        return self.put(request, pax_id, *args, **kwargs)

    def get(self, request, pax_id=None, *args, **kwargs):
        """Return pax data for convenience at the update endpoint."""
        pax = get_object_or_404(PaxProfile, pk=pax_id)
        return Response(PaxProfileSerializer(pax).data)

    @extend_schema(
        summary="Get pax by id",
        description="Return PaxProfile data for the specified pax_id",
        responses={200: OpenApiResponse(response=PaxProfileSerializer)},
    )

    def put(self, request, pax_id=None, *args, **kwargs):
        pax = get_object_or_404(PaxProfile, pk=pax_id)
        serializer = self.PaxUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        changed = False
        for field in ['first_name', 'last_name', 'passport_number', 'phone', 'nationality', 'notes']:
            if field in data:
                setattr(pax, field, data.get(field))
                changed = True
        if changed:
            pax.save()
        return Response(PaxProfileSerializer(pax).data)


class PaxListView(APIView):
    """GET /pax/list?branch_id=&organization_id=&search=..."""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List Pax",
        description="Search and filter pax profiles. Query params: branch_id, organization_id, search",
        responses={200: OpenApiResponse(response=PaxProfileSerializer(many=True))},
    )
    def get(self, request, *args, **kwargs):
        branch_id = request.GET.get('branch_id')
        org_id = request.GET.get('organization_id')
        search = request.GET.get('search', '').strip()

        qs = PaxProfile.objects.all().order_by('-created_at')
        if branch_id:
            # filter pax by leads' branch if lead relation exists
            qs = qs.filter(lead__branch_id=branch_id)
        elif org_id:
            qs = qs.filter(lead__organization_id=org_id)

        if search:
            q = Q(first_name__icontains=search) | Q(last_name__icontains=search) | Q(passport_number__icontains=search) | Q(phone__icontains=search)
            qs = q and qs.filter(q) or qs

        serializer = PaxProfileSerializer(qs, many=True)
        return Response({'total': qs.count(), 'pax': serializer.data})


class UpdatePassportLeadView(APIView):
    """PUT /passport-leads/update/{lead_id}/

    Update lead status, remarks, follow-up date, or pending balance.
    If pending_balance is cleared (<= 0) this will attempt to auto-close the
    corresponding receivable in the branch ledger by creating a payment ledger entry.
    """
    permission_classes = [IsAuthenticated]

    class UpdateSerializer(serializers.Serializer):
        followup_status = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        remarks = serializers.CharField(required=False, allow_null=True, allow_blank=True)
        pending_balance = serializers.DecimalField(required=False, max_digits=12, decimal_places=2)
        next_followup_date = serializers.DateField(required=False, allow_null=True)

    def post(self, request, lead_id=None, *args, **kwargs):
        # accept POST for clients that cannot PUT; keep semantics same
        return self.put(request, lead_id, *args, **kwargs)

    @extend_schema(
        summary="Get a passport lead",
        description="Return the current lead data for given lead_id",
        responses={200: OpenApiResponse(response=PassportLeadSerializer)},
    )
    def get(self, request, lead_id=None, *args, **kwargs):
        """Return the current lead data (same shape as update response)"""
        lead = get_object_or_404(PassportLead, pk=lead_id, is_deleted=False)
        out = PassportLeadSerializer(lead, context={'request': request}).data
        return Response({'lead': out})

    def patch(self, request, lead_id=None, *args, **kwargs):
        # support partial updates; reuse put logic
        return self.put(request, lead_id, *args, **kwargs)

    def put(self, request, lead_id=None, *args, **kwargs):
        lead = get_object_or_404(PassportLead, pk=lead_id, is_deleted=False)
        serializer = self.UpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        prev_pending = lead.pending_balance or Decimal('0.00')

        # apply updates
        changed = False
        if 'followup_status' in data:
            lead.followup_status = data.get('followup_status')
            changed = True
        if 'next_followup_date' in data:
            lead.next_followup_date = data.get('next_followup_date')
            changed = True
        if 'remarks' in data:
            # create a followup log entry for remarks
            remark_text = data.get('remarks')
            if remark_text:
                FollowUpLog.objects.create(lead=lead, remark_text=remark_text, created_by=request.user)
            # also store on lead
            lead.remarks = remark_text
            changed = True
        ledger_result = None
        if 'pending_balance' in data:
            new_pending = data.get('pending_balance') or Decimal('0.00')
            lead.pending_balance = new_pending
            changed = True

        if changed:
            lead.save()

        # If pending cleared (previous > 0, now <= 0) attempt ledger auto-close
        try:
            if Account and LedgerEntry and LedgerLine and ('pending_balance' in data):
                new_pending = lead.pending_balance or Decimal('0.00')
                if (prev_pending > Decimal('0.00')) and (new_pending <= Decimal('0.00')):
                    amount = prev_pending
                    # find receivable account scoped to branch -> organization -> any
                    receivable = Account.objects.filter(branch_id=lead.branch_id, account_type='RECEIVABLE').first()
                    if not receivable:
                        receivable = Account.objects.filter(organization_id=lead.organization_id, account_type='RECEIVABLE').first()
                    if not receivable:
                        receivable = Account.objects.filter(account_type='RECEIVABLE').first()

                    # find a cash/bank account to debit
                    cash = Account.objects.filter(branch_id=lead.branch_id, account_type__in=['CASH', 'BANK']).first()
                    if not cash:
                        cash = Account.objects.filter(organization_id=lead.organization_id, account_type__in=['CASH', 'BANK']).first()
                    if not cash:
                        cash = Account.objects.filter(account_type__in=['CASH', 'BANK']).first()

                    if receivable and cash and amount > Decimal('0.00'):
                        # perform two-line ledger entry: debit cash, credit receivable
                        with transaction.atomic():
                            # lock accounts
                            Account.objects.select_for_update().filter(pk__in=[receivable.pk, cash.pk])

                            entry = LedgerEntry.objects.create(
                                booking_no=None,
                                service_type='payment',
                                narration=f'Auto-close pending for passport lead {lead.id}',
                                created_by=request.user if request.user.is_authenticated else None,
                                metadata={'lead_id': lead.id},
                            )

                            # debit cash (increase)
                            cash_final = (cash.balance + amount)
                            LedgerLine.objects.create(
                                ledger_entry=entry,
                                account=cash,
                                debit=amount,
                                credit=Decimal('0.00'),
                                final_balance=cash_final,
                            )
                            cash.balance = cash_final
                            cash.save()

                            # credit receivable (decrease)
                            recv_final = (receivable.balance - amount)
                            LedgerLine.objects.create(
                                ledger_entry=entry,
                                account=receivable,
                                debit=Decimal('0.00'),
                                credit=amount,
                                final_balance=recv_final,
                            )
                            receivable.balance = recv_final
                            receivable.save()

                        ledger_result = {'closed': True, 'amount': str(amount), 'entry_id': entry.id}
                    else:
                        ledger_result = {'closed': False, 'reason': 'Could not find suitable accounts to perform auto-close'}
        except Exception as e:
            # don't fail the lead update if ledger integration breaks; return note
            ledger_result = {'closed': False, 'error': str(e)}

        out = PassportLeadSerializer(lead, context={'request': request}).data
        resp = {'lead': out}
        if ledger_result is not None:
            resp['ledger'] = ledger_result

        return Response(resp)
