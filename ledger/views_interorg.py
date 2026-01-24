"""
Views for inter-organizational reseller transactions and financial tracking.
"""

from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.db import transaction
from django.db.models import Q, Sum, Count
from decimal import Decimal
from datetime import datetime

from ledger.models import InterOrgPayment, LedgerEntry, LedgerLine, Account
from ledger.serializers import InterOrgPaymentSerializer, LedgerEntrySerializer
from ledger.utils import create_interorg_payment_ledger_entries
from organization.models import Organization


class InterOrgFinancialSummaryView(APIView):
    """
    GET /api/ledger/inter-org-summary/?organization_id=44
    
    Returns financial summary showing:
    - How much this org owes to other orgs (payables)
    - How much other orgs owe to this org (receivables)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        organization_id = request.query_params.get('organization_id')
        
        if not organization_id:
            return Response(
                {'detail': 'organization_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            organization = Organization.objects.get(id=organization_id)
        except Organization.DoesNotExist:
            return Response(
                {'detail': 'Organization not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # === PAYABLES: What this org owes to others ===
        # Find "Accounts Payable - OrgXX" accounts
        payable_accounts = Account.objects.filter(
            organization=organization,
            account_type='PAYABLE',
            name__startswith='Accounts Payable -'
        )
        
        payables = []
        for account in payable_accounts:
            # Extract the other org name from account name
            # Format: "Accounts Payable - OrgName"
            try:
                to_org_name = account.name.split(' - ', 1)[1]
                # Try to find the actual organization
                to_org = Organization.objects.filter(name=to_org_name).first()
                
                # Get related ledger entries to find booking count
                ledger_entries = LedgerEntry.objects.filter(
                    organization=organization,
                    inventory_owner_organization=to_org
                ).distinct()
                
                # Negative balance means money owed (payable is a credit account)
                if account.balance < 0:
                    payables.append({
                        'to_organization_id': to_org.id if to_org else None,
                        'to_organization_name': to_org_name,
                        'total_payable': abs(float(account.balance)),
                        'currency': 'PKR',
                        'bookings_count': ledger_entries.count(),
                        'last_transaction_date': ledger_entries.order_by('-created_at').first().created_at.date().isoformat() if ledger_entries.exists() else None,
                        'account_id': account.id,
                    })
            except:
                continue
        
        # === RECEIVABLES: What this org is owed by others ===
        # Find "Accounts Receivable - OrgXX" accounts
        receivable_accounts = Account.objects.filter(
            organization=organization,
            account_type='RECEIVABLE',
            name__startswith='Accounts Receivable -'
        )
        
        receivables = []
        for account in receivable_accounts:
            try:
                from_org_name = account.name.split(' - ', 1)[1]
                from_org = Organization.objects.filter(name=from_org_name).first()
                
                ledger_entries = LedgerEntry.objects.filter(
                    organization=organization,
                    seller_organization=from_org
                ).distinct()
                
                # Positive balance means money owed to us (receivable is a debit account)
                if account.balance > 0:
                    receivables.append({
                        'from_organization_id': from_org.id if from_org else None,
                        'from_organization_name': from_org_name,
                        'total_receivable': float(account.balance),
                        'currency': 'PKR',
                        'bookings_count': ledger_entries.count(),
                        'last_transaction_date': ledger_entries.order_by('-created_at').first().created_at.date().isoformat() if ledger_entries.exists() else None,
                        'account_id': account.id,
                    })
            except:
                continue
        
        return Response({
            'organization_id': organization.id,
            'organization_name': organization.name,
            'payables': payables,
            'receivables': receivables,
            'total_payable_amount': sum(p['total_payable'] for p in payables),
            'total_receivable_amount': sum(r['total_receivable'] for r in receivables),
            'net_position': sum(r['total_receivable'] for r in receivables) - sum(p['total_payable'] for p in payables),
        })


class InterOrgPaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing inter-organizational payments.
    
    POST /api/ledger/inter-org-payments/
    GET /api/ledger/inter-org-payments/
    GET /api/ledger/inter-org-payments/{id}/
    PATCH /api/ledger/inter-org-payments/{id}/
    DELETE /api/ledger/inter-org-payments/{id}/
    """
    serializer_class = InterOrgPaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = InterOrgPayment.objects.all().select_related(
            'from_organization', 
            'to_organization',
            'created_by',
            'approved_by'
        ).order_by('-created_at')
        
        # Filter by organization (show payments involving this org)
        organization_id = self.request.query_params.get('organization_id')
        if organization_id:
            queryset = queryset.filter(
                Q(from_organization_id=organization_id) |
                Q(to_organization_id=organization_id)
            )
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """
        Create a new inter-org payment and automatically create ledger entries.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Set created_by
        if request.user.is_authenticated:
            serializer.validated_data['created_by'] = request.user
        
        # Create the payment
        payment = serializer.save()
        
        # Auto-create ledger entries if status is 'completed'
        if payment.status == 'completed':
            try:
                reseller_entry, owner_entry = create_interorg_payment_ledger_entries(payment)
                
                # Link the ledger entry to payment
                payment.ledger_entry = reseller_entry
                payment.save()
                
            except Exception as e:
                # Rollback will happen automatically due to @transaction.atomic
                return Response(
                    {'detail': f'Failed to create ledger entries: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, 
            status=status.HTTP_201_CREATED,
            headers=headers
        )
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Approve a pending payment and create ledger entries.
        POST /api/ledger/inter-org-payments/{id}/approve/
        """
        payment = self.get_object()
        
        if payment.status != 'pending':
            return Response(
                {'detail': 'Only pending payments can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            payment.status = 'completed'
            payment.approved_by = request.user
            payment.approved_at = datetime.now()
            payment.save()
            
            # Create ledger entries
            try:
                reseller_entry, owner_entry = create_interorg_payment_ledger_entries(payment)
                payment.ledger_entry = reseller_entry
                payment.save()
            except Exception as e:
                return Response(
                    {'detail': f'Failed to create ledger entries: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        serializer = self.get_serializer(payment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel a payment.
        POST /api/ledger/inter-org-payments/{id}/cancel/
        """
        payment = self.get_object()
        
        if payment.status == 'completed':
            return Response(
                {'detail': 'Cannot cancel completed payments. Create a reversal instead.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        payment.status = 'cancelled'
        payment.save()
        
        serializer = self.get_serializer(payment)
        return Response(serializer.data)


class InterOrgTransactionHistoryView(APIView):
    """
    GET /api/ledger/inter-org-transactions/?organization_id=44&contra_organization_id=11
    
    Shows detailed transaction history between two organizations.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        organization_id = request.query_params.get('organization_id')
        contra_organization_id = request.query_params.get('contra_organization_id')
        transaction_type = request.query_params.get('transaction_type')  # 'payable', 'receivable', 'payment'
        
        if not organization_id:
            return Response(
                {'detail': 'organization_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            organization = Organization.objects.get(id=organization_id)
        except Organization.DoesNotExist:
            return Response(
                {'detail': 'Organization not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Build query for ledger entries
        query = Q(organization=organization)
        
        # Add contra-org filter if specified
        if contra_organization_id:
            query &= (
                Q(seller_organization_id=contra_organization_id) |
                Q(inventory_owner_organization_id=contra_organization_id)
            )
        
        # Get ledger entries
        ledger_entries = LedgerEntry.objects.filter(query).select_related(
            'seller_organization',
            'inventory_owner_organization',
            'created_by'
        ).prefetch_related('lines__account').order_by('-created_at')
        
        # Get payments
        payments_query = Q(from_organization=organization) | Q(to_organization=organization)
        if contra_organization_id:
            payments_query &= (
                Q(from_organization_id=contra_organization_id) |
                Q(to_organization_id=contra_organization_id)
            )
        
        payments = InterOrgPayment.objects.filter(payments_query).select_related(
            'from_organization',
            'to_organization',
            'created_by'
        ).order_by('-created_at')
        
        # Combine and serialize
        transactions = []
        
        # Add ledger entries as transactions
        for entry in ledger_entries:
            trans_type = None
            contra_org = None
            
            if entry.seller_organization and entry.seller_organization != organization:
                trans_type = 'receivable'
                contra_org = entry.seller_organization
            elif entry.inventory_owner_organization and entry.inventory_owner_organization != organization:
                trans_type = 'payable'
                contra_org = entry.inventory_owner_organization
            
            if not transaction_type or transaction_type == trans_type:
                transactions.append({
                    'type': 'ledger_entry',
                    'transaction_type': trans_type,
                    'id': entry.id,
                    'reference_no': entry.reference_no or entry.booking_no,
                    'amount': float(entry.transaction_amount),
                    'contra_organization': {
                        'id': contra_org.id,
                        'name': contra_org.name
                    } if contra_org else None,
                    'narration': entry.narration,
                    'date': entry.created_at.date().isoformat(),
                    'created_by': entry.created_by.username if entry.created_by else None,
                })
        
        # Add payments as transactions
        if not transaction_type or transaction_type == 'payment':
            for payment in payments:
                is_outgoing = payment.from_organization == organization
                transactions.append({
                    'type': 'payment',
                    'transaction_type': 'payment_out' if is_outgoing else 'payment_in',
                    'id': payment.id,
                    'reference_no': payment.payment_number,
                    'amount': float(payment.amount),
                    'contra_organization': {
                        'id': payment.to_organization.id if is_outgoing else payment.from_organization.id,
                        'name': payment.to_organization.name if is_outgoing else payment.from_organization.name,
                    },
                    'payment_method': payment.payment_method,
                    'reference_number': payment.reference_number,
                    'status': payment.status,
                    'date': payment.payment_date.isoformat(),
                    'created_by': payment.created_by.username if payment.created_by else None,
                })
        
        # Sort by date
        transactions.sort(key=lambda x: x['date'], reverse=True)
        
        return Response({
            'organization_id': organization.id,
            'organization_name': organization.name,
            'total_transactions': len(transactions),
            'transactions': transactions,
        })
