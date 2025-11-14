"""
5-Level Ledger API Views
Implements comprehensive ledger querying across different organizational levels
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db.models import Q, Sum, Count, F
from django.shortcuts import get_object_or_404
from decimal import Decimal

from ledger.models import LedgerEntry, Account
from ledger.serializers import LedgerEntrySerializer
from organization.models import Organization, Branch, Agency
from area_leads.models import AreaLead


class OrganizationLedgerAPIView(APIView):
    """
    1️⃣ Organization Ledger (with all its branches & linked orgs)
    GET /api/ledger/organization/<organization_id>/
    → shows all transactions related to that organization and its branches.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, organization_id):
        organization = get_object_or_404(Organization, id=organization_id)
        
        # Get all ledger entries for this organization and its branches
        entries = LedgerEntry.objects.filter(
            Q(organization=organization) |
            Q(branch__organization=organization) |
            Q(seller_organization=organization) |
            Q(inventory_owner_organization=organization)
        ).select_related(
            'organization', 'branch', 'agency', 'area_agency',
            'seller_organization', 'inventory_owner_organization',
            'created_by', 'reversed_by'
        ).prefetch_related('lines').order_by('-creation_datetime')
        
        # Calculate summary statistics
        total_debit = entries.filter(transaction_type='debit').aggregate(
            total=Sum('transaction_amount')
        )['total'] or Decimal('0.00')
        
        total_credit = entries.filter(transaction_type='credit').aggregate(
            total=Sum('transaction_amount')
        )['total'] or Decimal('0.00')
        
        net_balance = total_debit - total_credit
        
        # Breakdown by service type
        service_breakdown = entries.values('service_type').annotate(
            count=Count('id'),
            total_amount=Sum('transaction_amount')
        ).order_by('-total_amount')
        
        # Serialize entries
        serializer = LedgerEntrySerializer(entries, many=True, context={'request': request})
        
        return Response({
            'organization_id': organization_id,
            'organization_name': organization.name,
            'summary': {
                'total_entries': entries.count(),
                'total_debit': float(total_debit),
                'total_credit': float(total_credit),
                'net_balance': float(net_balance),
            },
            'service_breakdown': list(service_breakdown),
            'entries': serializer.data
        })


class BranchLedgerAPIView(APIView):
    """
    2️⃣ Branch Ledger
    GET /api/ledger/branch/<branch_id>/
    → shows all transactions between branch ↔ organization / agents.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, branch_id):
        branch = get_object_or_404(Branch, id=branch_id)
        
        # Get all ledger entries for this branch
        entries = LedgerEntry.objects.filter(
            branch=branch
        ).select_related(
            'organization', 'branch', 'agency', 'area_agency',
            'seller_organization', 'inventory_owner_organization',
            'created_by', 'reversed_by'
        ).prefetch_related('lines').order_by('-creation_datetime')
        
        # Calculate summary statistics
        total_debit = entries.filter(transaction_type='debit').aggregate(
            total=Sum('transaction_amount')
        )['total'] or Decimal('0.00')
        
        total_credit = entries.filter(transaction_type='credit').aggregate(
            total=Sum('transaction_amount')
        )['total'] or Decimal('0.00')
        
        net_balance = total_debit - total_credit
        
        # Breakdown by agency
        agency_breakdown = entries.filter(agency__isnull=False).values(
            'agency__id', 'agency__name'
        ).annotate(
            count=Count('id'),
            total_amount=Sum('transaction_amount')
        ).order_by('-total_amount')
        
        # Serialize entries
        serializer = LedgerEntrySerializer(entries, many=True, context={'request': request})
        
        return Response({
            'branch_id': branch_id,
            'branch_name': branch.name,
            'organization_id': branch.organization_id,
            'summary': {
                'total_entries': entries.count(),
                'total_debit': float(total_debit),
                'total_credit': float(total_credit),
                'net_balance': float(net_balance),
            },
            'agency_breakdown': list(agency_breakdown),
            'entries': serializer.data
        })


class AgencyLedgerAPIView(APIView):
    """
    3️⃣ Agency Ledger
    GET /api/ledger/agency/<agency_id>/
    → shows all transactions between agent ↔ branch / organization.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, agency_id):
        agency = get_object_or_404(Agency, id=agency_id)
        
        # Get all ledger entries for this agency
        entries = LedgerEntry.objects.filter(
            agency=agency
        ).select_related(
            'organization', 'branch', 'agency', 'area_agency',
            'seller_organization', 'inventory_owner_organization',
            'created_by', 'reversed_by'
        ).prefetch_related('lines').order_by('-creation_datetime')
        
        # Calculate summary statistics
        total_debit = entries.filter(transaction_type='debit').aggregate(
            total=Sum('transaction_amount')
        )['total'] or Decimal('0.00')
        
        total_credit = entries.filter(transaction_type='credit').aggregate(
            total=Sum('transaction_amount')
        )['total'] or Decimal('0.00')
        
        net_balance = total_debit - total_credit
        
        # Breakdown by service type
        service_breakdown = entries.values('service_type').annotate(
            count=Count('id'),
            total_amount=Sum('transaction_amount')
        ).order_by('-total_amount')
        
        # Commission summary
        commission_entries = entries.filter(service_type='commission')
        total_commission = commission_entries.aggregate(
            total=Sum('transaction_amount')
        )['total'] or Decimal('0.00')
        
        # Serialize entries
        serializer = LedgerEntrySerializer(entries, many=True, context={'request': request})
        
        return Response({
            'agency_id': agency_id,
            'agency_name': agency.name,
            'branch_id': agency.branch_id if hasattr(agency, 'branch_id') else None,
            'summary': {
                'total_entries': entries.count(),
                'total_debit': float(total_debit),
                'total_credit': float(total_credit),
                'net_balance': float(net_balance),
                'total_commission': float(total_commission),
                'commission_entries': commission_entries.count(),
            },
            'service_breakdown': list(service_breakdown),
            'entries': serializer.data
        })


class AreaAgencyLedgerAPIView(APIView):
    """
    4️⃣ Area Agency Ledger
    GET /api/ledger/area-agency/<area_agency_id>/
    → shows all transactions between area agency ↔ organization.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, area_agency_id):
        area_agency = get_object_or_404(AreaLead, id=area_agency_id)
        
        # Get all ledger entries for this area agency
        entries = LedgerEntry.objects.filter(
            area_agency=area_agency
        ).select_related(
            'organization', 'branch', 'agency', 'area_agency',
            'seller_organization', 'inventory_owner_organization',
            'created_by', 'reversed_by'
        ).prefetch_related('lines').order_by('-creation_datetime')
        
        # Calculate summary statistics
        total_debit = entries.filter(transaction_type='debit').aggregate(
            total=Sum('transaction_amount')
        )['total'] or Decimal('0.00')
        
        total_credit = entries.filter(transaction_type='credit').aggregate(
            total=Sum('transaction_amount')
        )['total'] or Decimal('0.00')
        
        net_balance = total_debit - total_credit
        
        # Commission summary
        commission_entries = entries.filter(service_type='commission')
        total_commission = commission_entries.aggregate(
            total=Sum('transaction_amount')
        )['total'] or Decimal('0.00')
        
        # Breakdown by organization
        org_breakdown = entries.values(
            'organization__id', 'organization__name'
        ).annotate(
            count=Count('id'),
            total_amount=Sum('transaction_amount')
        ).order_by('-total_amount')
        
        # Serialize entries
        serializer = LedgerEntrySerializer(entries, many=True, context={'request': request})
        
        return Response({
            'area_agency_id': area_agency_id,
            'area_agency_name': area_agency.name if hasattr(area_agency, 'name') else f"Area Lead #{area_agency_id}",
            'summary': {
                'total_entries': entries.count(),
                'total_debit': float(total_debit),
                'total_credit': float(total_credit),
                'net_balance': float(net_balance),
                'total_commission': float(total_commission),
                'commission_entries': commission_entries.count(),
            },
            'organization_breakdown': list(org_breakdown),
            'entries': serializer.data
        })


class OrgToOrgLedgerAPIView(APIView):
    """
    5️⃣ Organization-to-Organization Ledger
    GET /api/ledger/org-to-org/<org1_id>/<org2_id>/
    → shows receivable/payable summary and full transaction history between two companies.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, org1_id, org2_id):
        org1 = get_object_or_404(Organization, id=org1_id)
        org2 = get_object_or_404(Organization, id=org2_id)
        
        # Get all transactions between the two organizations
        entries = LedgerEntry.objects.filter(
            (Q(seller_organization=org1) & Q(inventory_owner_organization=org2)) |
            (Q(seller_organization=org2) & Q(inventory_owner_organization=org1)) |
            (Q(organization=org1) & Q(seller_organization=org2)) |
            (Q(organization=org2) & Q(seller_organization=org1))
        ).select_related(
            'organization', 'branch', 'agency', 'area_agency',
            'seller_organization', 'inventory_owner_organization',
            'created_by', 'reversed_by'
        ).prefetch_related('lines').order_by('-creation_datetime')
        
        # Calculate balances from org1 perspective
        # Org1 owes to Org2 (payable)
        org1_payable = entries.filter(
            seller_organization=org1,
            inventory_owner_organization=org2,
            transaction_type='debit'
        ).aggregate(total=Sum('transaction_amount'))['total'] or Decimal('0.00')
        
        # Org2 owes to Org1 (receivable)
        org1_receivable = entries.filter(
            seller_organization=org2,
            inventory_owner_organization=org1,
            transaction_type='debit'
        ).aggregate(total=Sum('transaction_amount'))['total'] or Decimal('0.00')
        
        # Net position: positive = org2 owes org1, negative = org1 owes org2
        net_position = org1_receivable - org1_payable
        
        # Breakdown by service type
        service_breakdown = entries.values('service_type').annotate(
            count=Count('id'),
            total_amount=Sum('transaction_amount')
        ).order_by('-total_amount')
        
        # Monthly breakdown
        monthly_breakdown = entries.extra(
            select={'month': 'DATE_FORMAT(creation_datetime, "%%Y-%%m")'}
        ).values('month').annotate(
            count=Count('id'),
            total_amount=Sum('transaction_amount')
        ).order_by('-month')[:12]  # Last 12 months
        
        # Serialize entries
        serializer = LedgerEntrySerializer(entries, many=True, context={'request': request})
        
        return Response({
            'org1_id': org1_id,
            'org1_name': org1.name,
            'org2_id': org2_id,
            'org2_name': org2.name,
            'summary': {
                'total_transactions': entries.count(),
                'org1_payable_to_org2': float(org1_payable),
                'org1_receivable_from_org2': float(org1_receivable),
                'net_position': float(net_position),
                'net_position_description': (
                    f"{org2.name} owes {org1.name}" if net_position > 0 
                    else f"{org1.name} owes {org2.name}" if net_position < 0 
                    else "Balanced (no outstanding amount)"
                ),
            },
            'service_breakdown': list(service_breakdown),
            'monthly_breakdown': list(monthly_breakdown),
            'entries': serializer.data
        })
