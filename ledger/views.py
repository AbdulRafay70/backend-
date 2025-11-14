from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.shortcuts import get_object_or_404
from decimal import Decimal

from .models import Account, LedgerEntry, LedgerLine
from .serializers import LedgerEntrySerializer
from datetime import datetime

from rest_framework.decorators import api_view
from rest_framework.response import Response
from organization.models import Organization, Branch, Agency
from .models import Account
from django.db import models
from django.conf import settings

class LedgerCreateAPIView(APIView):
    """Create a simple two-line ledger entry (debit & credit)."""

    def post(self, request):
        data = request.data
        debit_account_id = data.get("debit_account_id")
        credit_account_id = data.get("credit_account_id")
        amount = data.get("amount")
        booking_no = data.get("booking_no")
        service_type = data.get("service_type")
        narration = data.get("narration")
        metadata = data.get("metadata") or {}

        if not (debit_account_id and credit_account_id and amount):
            return Response({"detail": "debit_account_id, credit_account_id and amount are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amount = Decimal(str(amount))
        except Exception:
            return Response({"detail": "Invalid amount."}, status=status.HTTP_400_BAD_REQUEST)

        if amount <= 0:
            return Response({"detail": "Amount must be positive."}, status=status.HTTP_400_BAD_REQUEST)

        debit_account = get_object_or_404(Account, pk=debit_account_id)
        credit_account = get_object_or_404(Account, pk=credit_account_id)

        # create entry and update balances atomically
        with transaction.atomic():
            # lock accounts
            locked_accounts = Account.objects.select_for_update().filter(pk__in=[debit_account.id, credit_account.id])
            audit_note = f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Created via API by user {request.user.id if request.user.is_authenticated else 'unknown'}."
            
            # Determine organization from accounts or user
            organization = debit_account.organization or credit_account.organization
            if not organization and hasattr(request.user, 'organization'):
                organization = request.user.organization
            
            if not organization:
                return Response(
                    {"detail": "Unable to determine organization. Accounts must have an organization assigned."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            entry = LedgerEntry.objects.create(
                booking_no=booking_no,
                reference_no=booking_no or f"MANUAL-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                transaction_type='manual_adjustment',
                service_type=service_type or "other",
                narration=narration,
                remarks=f"Manual adjustment via API",
                organization=organization,
                branch=debit_account.branch or credit_account.branch,
                agency=debit_account.agency or credit_account.agency,
                created_by=request.user if request.user.is_authenticated else None,
                metadata=metadata,
                internal_notes=[audit_note],
            )

            # debit increases balance (for asset style accounts) and credit decreases; business logic may vary
            # Here we treat balance as a net asset: balance = balance + debit - credit

            # create debit line
            debit_final = (debit_account.balance + amount)
            debit_line = LedgerLine.objects.create(
                ledger_entry=entry,
                account=debit_account,
                debit=amount,
                credit=Decimal("0.00"),
                balance_after=debit_final,
                remarks=f"Manual debit adjustment"
            )
            debit_account.balance = debit_final
            debit_account.save()

            # create credit line
            credit_final = (credit_account.balance - amount)
            credit_line = LedgerLine.objects.create(
                ledger_entry=entry,
                account=credit_account,
                debit=Decimal("0.00"),
                credit=amount,
                balance_after=credit_final,
                remarks=f"Manual credit adjustment"
            )
            credit_account.balance = credit_final
            credit_account.save()

        serializer = LedgerEntrySerializer(entry)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

# --- Pending/Final Balance Endpoints ---
@api_view(["GET"])
def agents_pending_balances(request):
    """Return pending/final balances for all agent accounts."""
    if getattr(settings, "USE_DUMMY_DATA", False):
        data = [
            {"id": 1, "name": "Agent A", "agency_id": 10, "balance": 5000},
            {"id": 2, "name": "Agent B", "agency_id": 11, "balance": 3000},
        ]
        return Response(data)
    agents = Account.objects.filter(account_type="AGENT")
    data = [
        {
            "id": acc.id,
            "name": acc.name,
            "agency_id": acc.agency_id,
            "balance": acc.balance,
        }
        for acc in agents
    ]
    return Response(data)

@api_view(["GET"])
def area_agents_pending_balances(request):
    """Return pending/final balances for all area agent accounts (customize filter as needed)."""
    if getattr(settings, "USE_DUMMY_DATA", False):
        data = [
            {"id": 3, "name": "Area Agent X", "agency_id": 20, "balance": 7000},
            {"id": 4, "name": "Area Agent Y", "agency_id": 21, "balance": 2000},
        ]
        return Response(data)
    area_agents = Account.objects.filter(account_type="AGENT")
    data = [
        {
            "id": acc.id,
            "name": acc.name,
            "agency_id": acc.agency_id,
            "balance": acc.balance,
        }
        for acc in area_agents
    ]
    return Response(data)

@api_view(["GET"])
def branch_pending_balances(request):
    """Return pending/final balances for all branch accounts."""
    if getattr(settings, "USE_DUMMY_DATA", False):
        data = [
            {"branch_id": 1, "branch_name": "Main Branch", "total_balance": 10000},
            {"branch_id": 2, "branch_name": "Sub Branch", "total_balance": 4000},
        ]
        return Response(data)
    branches = Branch.objects.all()
    data = []
    for branch in branches:
        branch_accounts = Account.objects.filter(branch=branch)
        total_balance = sum(acc.balance for acc in branch_accounts)
        data.append({
            "branch_id": branch.id,
            "branch_name": branch.name,
            "total_balance": total_balance,
        })
    return Response(data)

@api_view(["GET"])
def organization_pending_balances(request):
    """Return pending/final balances for all organization accounts."""
    if getattr(settings, "USE_DUMMY_DATA", False):
        data = [
            {"organization_id": 1, "organization_name": "Org Alpha", "total_balance": 25000},
            {"organization_id": 2, "organization_name": "Org Beta", "total_balance": 8000},
        ]
        return Response(data)
    orgs = Organization.objects.all()
    data = []
    for org in orgs:
        org_accounts = Account.objects.filter(organization=org)
        total_balance = sum(acc.balance for acc in org_accounts)
        data.append({
            "organization_id": org.id,
            "organization_name": org.name,
            "total_balance": total_balance,
        })
    return Response(data)

@api_view(["GET"])
def final_balance(request):
    """Return the global final balance (sum of all account balances)."""
    if getattr(settings, "USE_DUMMY_DATA", False):
        return Response({"final_balance": 99999})
    total = Account.objects.all().aggregate(total=models.Sum("balance"))["total"] or 0
    return Response({"final_balance": total})

class LedgerListAPIView(APIView):
    def get(self, request):
        qs = LedgerEntry.objects.all().order_by("-creation_datetime")
        # simple pagination could be added later
        serializer = LedgerEntrySerializer(qs, many=True)
        return Response(serializer.data)


class LedgerReverseAPIView(APIView):
    def post(self, request, pk):
        entry = get_object_or_404(LedgerEntry, pk=pk)
        if entry.reversed:
            return Response({"detail": "Entry already reversed."}, status=status.HTTP_400_BAD_REQUEST)

        # create reversing entry: swap debit/credit for each line
        with transaction.atomic():
            # lock all involved accounts
            account_ids = list(entry.lines.values_list("account_id", flat=True))
            Account.objects.select_for_update().filter(pk__in=account_ids)

            reverse_entry = LedgerEntry.objects.create(
                booking_no=entry.booking_no,
                reference_no=entry.reference_no,
                transaction_type='refund',  # Reversal is a refund
                service_type=entry.service_type,
                narration=(f"Reversal of #{entry.id}: " + (entry.narration or "")),
                remarks=f"Reversal of ledger entry #{entry.id}",
                booking=entry.booking,
                organization=entry.organization,
                branch=entry.branch,
                agency=entry.agency,
                created_by=request.user if request.user.is_authenticated else None,
                reversed_by=request.user if request.user.is_authenticated else None,
                metadata={"reversed_of": entry.id, "original_entry": entry.id},
                reversed_of=entry,
            )

            for line in entry.lines.all():
                # create opposite line
                rev_debit = line.credit
                rev_credit = line.debit

                account = line.account
                # apply reversal to balances
                account.balance = account.balance + rev_debit - rev_credit
                account.save()

                LedgerLine.objects.create(
                    ledger_entry=reverse_entry,
                    account=account,
                    debit=rev_debit,
                    credit=rev_credit,
                    balance_after=account.balance,
                    remarks=f"Reversal of line from entry #{entry.id}"
                )

            # Mark original entry as reversed
            from django.utils import timezone
            entry.reversed = True
            entry.reversed_at = timezone.now()
            entry.reversed_by = request.user if request.user.is_authenticated else None
            entry.save()

        serializer = LedgerEntrySerializer(reverse_entry)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class LedgerDetailAPIView(APIView):
    """Retrieve a single ledger entry with all its lines."""
    
    def get(self, request, pk):
        entry = get_object_or_404(LedgerEntry, pk=pk)
        serializer = LedgerEntrySerializer(entry)
        return Response(serializer.data)


class LedgerAccountsAPIView(APIView):
    """List all accounts and their balances."""
    
    def get(self, request):
        # Filter by organization if provided
        organization_id = request.query_params.get('organization')
        branch_id = request.query_params.get('branch')
        agency_id = request.query_params.get('agency')
        account_type = request.query_params.get('account_type')
        
        queryset = Account.objects.all().select_related('organization', 'branch', 'agency')
        
        if organization_id:
            queryset = queryset.filter(organization_id=organization_id)
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        if agency_id:
            queryset = queryset.filter(agency_id=agency_id)
        if account_type:
            queryset = queryset.filter(account_type=account_type)
        
        queryset = queryset.order_by('name')
        
        data = []
        for account in queryset:
            data.append({
                'id': account.id,
                'name': account.name,
                'account_type': account.account_type,
                'balance': str(account.balance),
                'organization': {
                    'id': account.organization.id,
                    'name': account.organization.name
                } if account.organization else None,
                'branch': {
                    'id': account.branch.id,
                    'name': account.branch.name
                } if account.branch else None,
                'agency': {
                    'id': account.agency.id,
                    'name': account.agency.name
                } if account.agency else None,
            })
        
        return Response(data)


class LedgerSummaryAPIView(APIView):
    """Get organization-wide ledger summary with totals and counts."""
    
    def get(self, request):
        organization_id = request.query_params.get('organization')
        branch_id = request.query_params.get('branch')
        agency_id = request.query_params.get('agency')
        
        # Filter ledger entries
        entries_qs = LedgerEntry.objects.all()
        if organization_id:
            entries_qs = entries_qs.filter(organization_id=organization_id)
        if branch_id:
            entries_qs = entries_qs.filter(branch_id=branch_id)
        if agency_id:
            entries_qs = entries_qs.filter(agency_id=agency_id)
        
        # Filter accounts
        accounts_qs = Account.objects.all()
        if organization_id:
            accounts_qs = accounts_qs.filter(organization_id=organization_id)
        if branch_id:
            accounts_qs = accounts_qs.filter(branch_id=branch_id)
        if agency_id:
            accounts_qs = accounts_qs.filter(agency_id=agency_id)
        
        # Get ledger lines for these entries
        lines_qs = LedgerLine.objects.filter(ledger_entry__in=entries_qs)
        
        # Calculate totals
        total_debit = lines_qs.aggregate(total=models.Sum('debit'))['total'] or Decimal('0')
        total_credit = lines_qs.aggregate(total=models.Sum('credit'))['total'] or Decimal('0')
        net_balance = total_debit - total_credit
        
        # Account balances by type
        account_balances = accounts_qs.values('account_type').annotate(
            total_balance=models.Sum('balance'),
            count=models.Count('id')
        ).order_by('account_type')
        
        # Transaction counts by type
        transaction_counts = entries_qs.values('transaction_type').annotate(
            count=models.Count('id')
        ).order_by('transaction_type')
        
        # Recent entries
        recent_entries = entries_qs.order_by('-created_at')[:10]
        
        summary = {
            'total_debit': str(total_debit),
            'total_credit': str(total_credit),
            'net_balance': str(net_balance),
            'total_entries': entries_qs.count(),
            'total_accounts': accounts_qs.count(),
            'account_balances': [
                {
                    'account_type': item['account_type'],
                    'total_balance': str(item['total_balance'] or 0),
                    'count': item['count']
                }
                for item in account_balances
            ],
            'transaction_counts': [
                {
                    'transaction_type': item['transaction_type'],
                    'count': item['count']
                }
                for item in transaction_counts
            ],
            'recent_entries': LedgerEntrySerializer(recent_entries, many=True).data
        }
        
        return Response(summary)
