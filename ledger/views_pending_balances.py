"""
Pending Balance and Final Balance API Endpoints
Implements comprehensive balance tracking across agents, area agents, branches, and organizations
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Q, Count
from decimal import Decimal
from drf_spectacular.utils import extend_schema, OpenApiParameter

from ledger.models import LedgerEntry
from organization.models import Organization, Branch, Agency
from area_leads.models import AreaLead


@extend_schema(
    description="Returns list of all agents with negative final balance (outstanding amount against company)",
    parameters=[
        OpenApiParameter(
            name="organization_id",
            type=int,
            location=OpenApiParameter.QUERY,
            description="Organization ID to filter agents by",
            required=True,
        ),
    ],
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def agents_pending_balances(request):
    """
    GET /api/agents/pending-balances?organization_id={organization_id}
    
    Returns list of all agents with negative final balance (outstanding amount against company)
    """
    organization_id = request.query_params.get('organization_id')
    
    if not organization_id:
        return Response(
            {"detail": "organization_id query parameter is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        organization = Organization.objects.get(id=organization_id)
    except Organization.DoesNotExist:
        return Response(
            {"detail": "Organization not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get all agencies for this organization (via branches)
    agencies = Agency.objects.filter(
        branch__organization=organization
    ).distinct()
    
    pending_agents = []
    
    for agency in agencies:
        # Calculate final balance from ledger entries
        # Sum all debits and credits for this agency
        ledger_summary = LedgerEntry.objects.filter(
            agency=agency,
            reversed=False  # Exclude reversed entries
        ).aggregate(
            total_debit=Sum('transaction_amount', filter=Q(transaction_type='debit')),
            total_credit=Sum('transaction_amount', filter=Q(transaction_type='credit'))
        )
        
        total_debit = ledger_summary['total_debit'] or Decimal('0.00')
        total_credit = ledger_summary['total_credit'] or Decimal('0.00')
        final_balance = total_debit - total_credit
        
        # Only include agents with negative balance (they owe money)
        if final_balance < 0:
            # Get internal notes from ledger entries
            internal_note_ids = list(
                LedgerEntry.objects.filter(
                    agency=agency,
                    reversed=False
                ).exclude(
                    internal_notes=[]
                ).values_list('id', flat=True)
            )
            
            # Get agent details
            agent_user = None
            contact_no = ""
            if hasattr(agency, 'user'):
                agent_user = agency.user
                contact_no = getattr(agent_user, 'phone', '') or getattr(agency, 'contact_number', '')
            
            pending_agents.append({
                "agent_id": f"AGT{agency.id:03d}",
                "agency_name": agency.name,
                "agent_name": agent_user.get_full_name() if agent_user else agency.name,
                "contact_no": contact_no or "N/A",
                "pending_balance": float(final_balance),
                "internal_note_ids": internal_note_ids
            })
    
    return Response({
        "organization_id": f"ORG{organization.id:05d}",
        "organization_name": organization.name,
        "total_pending_agents": len(pending_agents),
        "agents": pending_agents
    })


@extend_schema(
    description="Returns list of all area agents with negative final balance",
    parameters=[
        OpenApiParameter(
            name="organization_id",
            type=int,
            location=OpenApiParameter.QUERY,
            description="Organization ID to filter area agents by",
            required=True,
        ),
    ],
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def area_agents_pending_balances(request):
    """
    GET /api/area-agents/pending-balances?organization_id={organization_id}
    
    Returns list of all area agents with negative final balance
    """
    organization_id = request.query_params.get('organization_id')
    
    if not organization_id:
        return Response(
            {"detail": "organization_id query parameter is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        organization = Organization.objects.get(id=organization_id)
    except Organization.DoesNotExist:
        return Response(
            {"detail": "Organization not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get all area leads (simplified - no organization filter since AreaLead doesn't have organization FK)
    # In a real scenario, you might filter area leads based on branches they manage
    area_leads = AreaLead.objects.all()
    
    pending_area_agents = []
    
    for area_lead in area_leads:
        # Calculate final balance from ledger entries
        ledger_summary = LedgerEntry.objects.filter(
            area_agency=area_lead,
            reversed=False
        ).aggregate(
            total_debit=Sum('transaction_amount', filter=Q(transaction_type='debit')),
            total_credit=Sum('transaction_amount', filter=Q(transaction_type='credit'))
        )
        
        total_debit = ledger_summary['total_debit'] or Decimal('0.00')
        total_credit = ledger_summary['total_credit'] or Decimal('0.00')
        final_balance = total_debit - total_credit
        
        # Only include area agents with negative balance
        if final_balance < 0:
            internal_note_ids = list(
                LedgerEntry.objects.filter(
                    area_agency=area_lead,
                    reversed=False
                ).exclude(
                    internal_notes=[]
                ).values_list('id', flat=True)
            )
            
            contact_no = getattr(area_lead, 'phone', '') or getattr(area_lead, 'contact_number', '')
            
            pending_area_agents.append({
                "area_agent_id": f"AREA{area_lead.id:03d}",
                "area_agent_name": getattr(area_lead, 'name', f"Area Lead #{area_lead.id}"),
                "contact_no": contact_no or "N/A",
                "pending_balance": float(final_balance),
                "internal_note_ids": internal_note_ids
            })
    
    return Response({
        "organization_id": f"ORG{organization.id:05d}",
        "organization_name": organization.name,
        "total_pending_area_agents": len(pending_area_agents),
        "area_agents": pending_area_agents
    })


@extend_schema(
    description="Returns list of all branches with negative final balance",
    parameters=[
        OpenApiParameter(
            name="organization_id",
            type=int,
            location=OpenApiParameter.QUERY,
            description="Organization ID to filter branches by",
            required=True,
        ),
    ],
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def branch_pending_balances(request):
    """
    GET /api/branch/pending-balances?organization_id={organization_id}
    
    Returns list of all branches with negative final balance
    """
    organization_id = request.query_params.get('organization_id')
    
    if not organization_id:
        return Response(
            {"detail": "organization_id query parameter is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        organization = Organization.objects.get(id=organization_id)
    except Organization.DoesNotExist:
        return Response(
            {"detail": "Organization not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get all branches for this organization
    branches = Branch.objects.filter(organization=organization)
    
    pending_branches = []
    
    for branch in branches:
        # Calculate final balance from ledger entries
        ledger_summary = LedgerEntry.objects.filter(
            branch=branch,
            reversed=False
        ).aggregate(
            total_debit=Sum('transaction_amount', filter=Q(transaction_type='debit')),
            total_credit=Sum('transaction_amount', filter=Q(transaction_type='credit'))
        )
        
        total_debit = ledger_summary['total_debit'] or Decimal('0.00')
        total_credit = ledger_summary['total_credit'] or Decimal('0.00')
        final_balance = total_debit - total_credit
        
        # Only include branches with negative balance
        if final_balance < 0:
            internal_note_ids = list(
                LedgerEntry.objects.filter(
                    branch=branch,
                    reversed=False
                ).exclude(
                    internal_notes=[]
                ).values_list('id', flat=True)
            )
            
            contact_no = getattr(branch, 'phone', '') or getattr(branch, 'contact_number', '')
            
            pending_branches.append({
                "branch_id": f"BRN{branch.id:04d}",
                "branch_name": branch.name,
                "contact_no": contact_no or "N/A",
                "pending_balance": float(final_balance),
                "internal_note_ids": internal_note_ids
            })
    
    return Response({
        "organization_id": f"ORG{organization.id:05d}",
        "organization_name": organization.name,
        "total_pending_branches": len(pending_branches),
        "branches": pending_branches
    })


@extend_schema(
    description="Returns pending balance between two organizations (for clearing settlement). If only org1_id is provided, returns all organizations that have pending balance with org1",
    parameters=[
        OpenApiParameter(
            name="org1_id",
            type=int,
            location=OpenApiParameter.QUERY,
            description="Organization 1 ID (or use organization_id)",
            required=False,
        ),
        OpenApiParameter(
            name="organization_id",
            type=int,
            location=OpenApiParameter.QUERY,
            description="Alternative to org1_id",
            required=False,
        ),
        OpenApiParameter(
            name="org2_id",
            type=int,
            location=OpenApiParameter.QUERY,
            description="Organization 2 ID (optional, for specific org-to-org balance)",
            required=False,
        ),
    ],
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def organization_pending_balances(request):
    """
    GET /api/organization/pending-balances?org1_id={org1_id}&org2_id={org2_id}
    
    Returns pending balance between two organizations (for clearing settlement)
    If only org1_id is provided, returns all organizations that have pending balance with org1
    """
    org1_id = request.query_params.get('org1_id') or request.query_params.get('organization_id')
    org2_id = request.query_params.get('org2_id')
    
    if not org1_id:
        return Response(
            {"detail": "org1_id or organization_id query parameter is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        org1 = Organization.objects.get(id=org1_id)
    except Organization.DoesNotExist:
        return Response(
            {"detail": "Organization 1 not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # If org2_id is provided, return balance between two specific organizations
    if org2_id:
        try:
            org2 = Organization.objects.get(id=org2_id)
        except Organization.DoesNotExist:
            return Response(
                {"detail": "Organization 2 not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Calculate balance between org1 and org2
        # org1 as seller, org2 as inventory owner (org1 bought from org2)
        ledger_summary_1 = LedgerEntry.objects.filter(
            seller_organization=org1,
            inventory_owner_organization=org2,
            reversed=False
        ).aggregate(
            total_debit=Sum('transaction_amount', filter=Q(transaction_type='debit')),
            total_credit=Sum('transaction_amount', filter=Q(transaction_type='credit'))
        )
        
        # org2 as seller, org1 as inventory owner (org2 bought from org1)
        ledger_summary_2 = LedgerEntry.objects.filter(
            seller_organization=org2,
            inventory_owner_organization=org1,
            reversed=False
        ).aggregate(
            total_debit=Sum('transaction_amount', filter=Q(transaction_type='debit')),
            total_credit=Sum('transaction_amount', filter=Q(transaction_type='credit'))
        )
        
        org1_owes = (ledger_summary_1['total_debit'] or Decimal('0.00')) - (ledger_summary_1['total_credit'] or Decimal('0.00'))
        org2_owes = (ledger_summary_2['total_debit'] or Decimal('0.00')) - (ledger_summary_2['total_credit'] or Decimal('0.00'))
        
        net_balance = org2_owes - org1_owes  # Positive means org2 owes org1
        
        return Response({
            "org1_id": f"ORG{org1.id:05d}",
            "org1_name": org1.name,
            "org2_id": f"ORG{org2.id:05d}",
            "org2_name": org2.name,
            "org1_owes_to_org2": float(org1_owes),
            "org2_owes_to_org1": float(org2_owes),
            "net_pending_balance": float(net_balance),
            "balance_description": (
                f"{org2.name} owes {org1.name}" if net_balance > 0 
                else f"{org1.name} owes {org2.name}" if net_balance < 0 
                else "Balanced (no outstanding amount)"
            )
        })
    
    # If org2_id not provided, return all organizations with pending balance against org1
    else:
        # Get all organizations that have transactions with org1
        related_org_ids = set()
        
        # As seller
        related_org_ids.update(
            LedgerEntry.objects.filter(
                seller_organization=org1,
                reversed=False
            ).exclude(
                inventory_owner_organization__isnull=True
            ).values_list('inventory_owner_organization_id', flat=True)
        )
        
        # As inventory owner
        related_org_ids.update(
            LedgerEntry.objects.filter(
                inventory_owner_organization=org1,
                reversed=False
            ).exclude(
                seller_organization__isnull=True
            ).values_list('seller_organization_id', flat=True)
        )
        
        pending_organizations = []
        
        for org_id in related_org_ids:
            try:
                org2 = Organization.objects.get(id=org_id)
            except Organization.DoesNotExist:
                continue
            
            # Calculate net balance
            ledger_summary_1 = LedgerEntry.objects.filter(
                seller_organization=org1,
                inventory_owner_organization=org2,
                reversed=False
            ).aggregate(
                total_debit=Sum('transaction_amount', filter=Q(transaction_type='debit')),
                total_credit=Sum('transaction_amount', filter=Q(transaction_type='credit'))
            )
            
            ledger_summary_2 = LedgerEntry.objects.filter(
                seller_organization=org2,
                inventory_owner_organization=org1,
                reversed=False
            ).aggregate(
                total_debit=Sum('transaction_amount', filter=Q(transaction_type='debit')),
                total_credit=Sum('transaction_amount', filter=Q(transaction_type='credit'))
            )
            
            org1_owes = (ledger_summary_1['total_debit'] or Decimal('0.00')) - (ledger_summary_1['total_credit'] or Decimal('0.00'))
            org2_owes = (ledger_summary_2['total_debit'] or Decimal('0.00')) - (ledger_summary_2['total_credit'] or Decimal('0.00'))
            
            net_balance = org2_owes - org1_owes
            
            # Only include if there's a pending balance
            if net_balance != 0:
                pending_organizations.append({
                    "organization_id": f"ORG{org2.id:05d}",
                    "organization_name": org2.name,
                    "pending_balance": float(net_balance),
                    "balance_description": (
                        f"{org2.name} owes {org1.name}" if net_balance > 0 
                        else f"{org1.name} owes {org2.name}"
                    )
                })
        
        return Response({
            "organization_id": f"ORG{org1.id:05d}",
            "organization_name": org1.name,
            "total_pending_organizations": len(pending_organizations),
            "organizations": pending_organizations
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def final_balance(request):
    """
    GET /api/final-balance?type={type}&id={id}
    
    Returns final balance for a specific entity
    type: "agent", "area_agent", "organization", or "branch"
    id: ID of the respective entity
    """
    entity_type = request.query_params.get('type')
    entity_id = request.query_params.get('id')
    
    if not entity_type or not entity_id:
        return Response(
            {"detail": "Both 'type' and 'id' query parameters are required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    entity_type = entity_type.lower()
    
    try:
        if entity_type == 'agent':
            entity = Agency.objects.get(id=entity_id)
            ledger_filter = Q(agency=entity)
            entity_name = entity.name
            
        elif entity_type == 'area_agent':
            entity = AreaLead.objects.get(id=entity_id)
            ledger_filter = Q(area_agency=entity)
            entity_name = getattr(entity, 'name', f"Area Lead #{entity.id}")
            
        elif entity_type == 'branch':
            entity = Branch.objects.get(id=entity_id)
            ledger_filter = Q(branch=entity)
            entity_name = entity.name
            
        elif entity_type == 'organization':
            entity = Organization.objects.get(id=entity_id)
            ledger_filter = Q(organization=entity) | Q(seller_organization=entity) | Q(inventory_owner_organization=entity)
            entity_name = entity.name
            
        else:
            return Response(
                {"detail": "Invalid type. Must be one of: agent, area_agent, organization, branch"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except (Agency.DoesNotExist, AreaLead.DoesNotExist, Branch.DoesNotExist, Organization.DoesNotExist):
        return Response(
            {"detail": f"{entity_type.capitalize()} not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Calculate total debit and credit
    ledger_summary = LedgerEntry.objects.filter(
        ledger_filter,
        reversed=False
    ).aggregate(
        total_debit=Sum('transaction_amount', filter=Q(transaction_type='debit')),
        total_credit=Sum('transaction_amount', filter=Q(transaction_type='credit'))
    )
    
    total_debit = ledger_summary['total_debit'] or Decimal('0.00')
    total_credit = ledger_summary['total_credit'] or Decimal('0.00')
    final_balance = total_debit - total_credit
    
    # Get last updated timestamp
    last_entry = LedgerEntry.objects.filter(
        ledger_filter,
        reversed=False
    ).order_by('-creation_datetime').first()
    
    last_updated = last_entry.creation_datetime if last_entry else None
    
    return Response({
        "type": entity_type,
        "id": str(entity_id),
        "name": entity_name,
        "total_debit": float(total_debit),
        "total_credit": float(total_credit),
        "final_balance": float(final_balance),
        "currency": "PKR",  # Default currency, can be made dynamic
        "last_updated": last_updated.isoformat() if last_updated else None
    })
