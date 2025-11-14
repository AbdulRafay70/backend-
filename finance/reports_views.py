"""
📊 REPORTS MODULE API VIEWS
Complete reporting endpoints for Sales, Financial, and Top Sellers reports
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count, Q, F, DecimalField, FloatField
from django.db.models.functions import Coalesce
from decimal import Decimal
from datetime import datetime, timedelta
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from booking.models import Booking, BookingHotelDetails
from ledger.models import LedgerEntry
from organization.models import Organization, Branch, Agency
from django.contrib.auth.models import User


def get_date_range(date_from=None, date_to=None):
    """
    Helper to get date range.
    Default: current month if no dates provided
    """
    if not date_from:
        # Start of current month
        now = timezone.now()
        date_from = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        date_from = datetime.strptime(date_from, '%Y-%m-%d')
        date_from = timezone.make_aware(date_from)
    
    if not date_to:
        # End of current month
        if not date_from:
            now = timezone.now()
        else:
            now = date_from
        # Get first day of next month, then subtract 1 second
        next_month = now.replace(day=28) + timedelta(days=4)
        date_to = next_month.replace(day=1, hour=23, minute=59, second=59, microsecond=999999)
    else:
        date_to = datetime.strptime(date_to, '%Y-%m-%d')
        date_to = timezone.make_aware(date_to)
        date_to = date_to.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    return date_from, date_to


def filter_bookings_by_permissions(queryset, request_user, organization_id=None, branch_id=None, agent_id=None):
    """
    Apply permission-based filtering:
    - Org admin: see all their agents + branches
    - Branch: see their own data only
    - Agent: see self only
    """
    # Apply organization filter if provided
    if organization_id:
        queryset = queryset.filter(organization_id=organization_id)
    
    # Apply branch filter if provided
    if branch_id:
        queryset = queryset.filter(branch_id=branch_id)
    
    # Apply agent filter if provided
    if agent_id:
        queryset = queryset.filter(agency_id=agent_id)
    
    # TODO: Add role-based filtering based on user's role
    # For now, returning filtered queryset
    
    return queryset


@extend_schema(
    summary="Sales Counting Report",
    description="""
    📊 Sales Summary Report API
    
    Returns comprehensive sales statistics including:
    - Total bookings by category (ticket, umrah, visa, hotel, transport, food, ziyarat)
    - Payment status breakdown (paid, unpaid, expired)
    - Amount summaries
    - Agent-wise breakdown with service details
    
    **Calculation Rules:**
    - From Booking table: COUNT(all bookings), SUM(total_amount)
    - total_paid_amount = SUM(total_amount WHERE payment_status = "Paid")
    - total_hotel_nights = SUM of BookingHotelDetails.total_nights
    - Filters applied on booking_date/created_at
    """,
    parameters=[
        OpenApiParameter(
            name="date_from",
            type=OpenApiTypes.DATE,
            location=OpenApiParameter.QUERY,
            description="Start date (YYYY-MM-DD). Default: first day of current month",
            required=False,
        ),
        OpenApiParameter(
            name="date_to",
            type=OpenApiTypes.DATE,
            location=OpenApiParameter.QUERY,
            description="End date (YYYY-MM-DD). Default: last day of current month",
            required=False,
        ),
        OpenApiParameter(
            name="organization_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description="Organization ID (required)",
            required=True,
        ),
        OpenApiParameter(
            name="agent_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description="Filter by specific agent (optional)",
            required=False,
        ),
        OpenApiParameter(
            name="branch_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description="Filter by specific branch (optional)",
            required=False,
        ),
    ],
    responses={
        200: {
            "type": "object",
            "properties": {
                "message": {"type": "string"},
                "data": {
                    "type": "object",
                    "properties": {
                        "total_bookings": {"type": "integer"},
                        "total_group_bookings": {"type": "integer"},
                        "total_ticket_bookings": {"type": "integer"},
                        "total_umrah_bookings": {"type": "integer"},
                        "total_visa_bookings": {"type": "integer"},
                        "total_hotel_nights": {"type": "integer"},
                        "total_transport_bookings": {"type": "integer"},
                        "total_food_bookings": {"type": "integer"},
                        "total_ziyarat_bookings": {"type": "integer"},
                        "total_paid_orders": {"type": "integer"},
                        "total_unpaid_orders": {"type": "integer"},
                        "total_expired_orders": {"type": "integer"},
                        "total_amount": {"type": "number"},
                        "total_paid_amount": {"type": "number"},
                        "total_unpaid_amount": {"type": "number"},
                        "total_expired_amount": {"type": "number"},
                        "agent_wise_summary": {"type": "array"},
                    }
                }
            }
        }
    }
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sales_summary_report(request):
    """
    📊 Sales Counting Report API
    GET /api/v1/reports/sales-summary/
    """
    # Get parameters
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    organization_id = request.GET.get('organization_id')
    agent_id = request.GET.get('agent_id')
    branch_id = request.GET.get('branch_id')
    
    # Validate organization_id
    if not organization_id:
        return Response({
            "message": "organization_id is required",
            "data": None
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get date range
    date_from, date_to = get_date_range(date_from, date_to)
    
    # Base queryset
    bookings = Booking.objects.filter(
        created_at__gte=date_from,
        created_at__lte=date_to
    )
    
    # Apply filters
    bookings = filter_bookings_by_permissions(
        bookings, request.user, organization_id, branch_id, agent_id
    )
    
    # Total bookings
    total_bookings = bookings.count()
    
    # Category counts
    total_ticket_bookings = bookings.filter(
        Q(category__iexact='ticket') | 
        Q(category__icontains='ticket')
    ).count()
    
    total_umrah_bookings = bookings.filter(
        Q(category__iexact='umrah') | 
        Q(umrah_package__isnull=False)
    ).count()
    
    total_visa_bookings = bookings.filter(
        Q(category__iexact='visa') |
        Q(category__icontains='visa')
    ).count()
    
    # Transport, Food, Ziyarat counts (based on related models or category)
    total_transport_bookings = bookings.filter(
        Q(category__icontains='transport') |
        Q(total_transport_amount__gt=0)
    ).count()
    
    total_food_bookings = bookings.filter(
        Q(total_food_amount_pkr__gt=0) |
        Q(total_food_amount_sar__gt=0)
    ).count()
    
    total_ziyarat_bookings = bookings.filter(
        Q(total_ziyarat_amount_pkr__gt=0) |
        Q(total_ziyarat_amount_sar__gt=0)
    ).count()
    
    # Group bookings (bookings with multiple passengers)
    total_group_bookings = bookings.filter(total_pax__gt=1).count()
    
    # Hotel nights calculation
    hotel_bookings = BookingHotelDetails.objects.filter(
        booking__in=bookings
    )
    total_hotel_nights = hotel_bookings.aggregate(
        total=Coalesce(Sum('total_nights'), 0)
    )['total'] or 0
    
    # Payment status breakdown
    total_paid_orders = bookings.filter(
        Q(payment_status__iexact='paid') |
        Q(is_paid=True)
    ).count()
    
    total_unpaid_orders = bookings.filter(
        Q(payment_status__iexact='pending') |
        Q(payment_status__iexact='partial')
    ).exclude(is_paid=True).count()
    
    # Expired orders (where expiry_time < now and not paid)
    now = timezone.now()
    total_expired_orders = bookings.filter(
        expiry_time__lt=now,
        is_paid=False
    ).count()
    
    # Amount calculations
    amounts = bookings.aggregate(
        total=Coalesce(Sum('total_amount'), 0.0),
        paid=Coalesce(
            Sum('total_amount', filter=Q(payment_status__iexact='paid') | Q(is_paid=True)),
            0.0
        ),
        unpaid=Coalesce(
            Sum('total_amount', filter=Q(payment_status__in=['Pending', 'Partial'])),
            0.0
        ),
        expired=Coalesce(
            Sum('total_amount', filter=Q(expiry_time__lt=now, is_paid=False)),
            0.0
        )
    )
    
    # Agent-wise summary
    agent_wise_data = []
    
    # Get unique agents from filtered bookings
    agent_ids = bookings.values_list('agency_id', flat=True).distinct()
    
    for agent_id_item in agent_ids:
        if not agent_id_item:
            continue
        
        try:
            agent = Agency.objects.get(id=agent_id_item)
        except Agency.DoesNotExist:
            continue
        
        agent_bookings = bookings.filter(agency_id=agent_id_item)
        
        # Agent totals
        agent_totals = agent_bookings.aggregate(
            total_orders=Count('id'),
            paid_orders=Count('id', filter=Q(payment_status__iexact='paid') | Q(is_paid=True)),
            unpaid_orders=Count('id', filter=Q(payment_status__in=['Pending', 'Partial'])),
            total_sales_amount=Coalesce(Sum('total_amount'), 0.0),
            paid_sales_amount=Coalesce(
                Sum('total_amount', filter=Q(payment_status__iexact='paid') | Q(is_paid=True)),
                0.0
            ),
        )
        
        # Service breakdown
        service_breakdown = {
            "umrah": {
                "count": agent_bookings.filter(Q(category__iexact='umrah') | Q(umrah_package__isnull=False)).count(),
                "amount": float(agent_bookings.filter(
                    Q(category__iexact='umrah') | Q(umrah_package__isnull=False)
                ).aggregate(total=Coalesce(Sum('total_amount'), 0.0))['total'])
            },
            "visa": {
                "count": agent_bookings.filter(category__icontains='visa').count(),
                "amount": float(agent_bookings.filter(
                    category__icontains='visa'
                ).aggregate(total=Coalesce(Sum('total_visa_amount'), 0.0))['total'])
            },
            "tickets": {
                "count": agent_bookings.filter(category__icontains='ticket').count(),
                "amount": float(agent_bookings.filter(
                    category__icontains='ticket'
                ).aggregate(total=Coalesce(Sum('total_ticket_amount'), 0.0))['total'])
            },
            "hotel": {
                "nights": BookingHotelDetails.objects.filter(
                    booking__in=agent_bookings
                ).aggregate(total=Coalesce(Sum('total_nights'), 0))['total'] or 0,
                "amount": float(agent_bookings.aggregate(
                    total=Coalesce(Sum('total_hotel_amount'), 0.0)
                )['total'])
            },
            "transport": {
                "count": agent_bookings.filter(total_transport_amount__gt=0).count(),
                "amount": float(agent_bookings.aggregate(
                    total=Coalesce(Sum('total_transport_amount'), 0.0)
                )['total'])
            },
            "food": {
                "count": agent_bookings.filter(
                    Q(total_food_amount_pkr__gt=0) | Q(total_food_amount_sar__gt=0)
                ).count(),
                "amount": float(agent_bookings.aggregate(
                    total=Coalesce(Sum('total_food_amount_pkr'), 0.0)
                )['total'])
            },
            "ziyarat": {
                "count": agent_bookings.filter(
                    Q(total_ziyarat_amount_pkr__gt=0) | Q(total_ziyarat_amount_sar__gt=0)
                ).count(),
                "amount": float(agent_bookings.aggregate(
                    total=Coalesce(Sum('total_ziyarat_amount_pkr'), 0.0)
                )['total'])
            }
        }
        
        agent_wise_data.append({
            "agent_id": agent.id,
            "agent_name": agent.name if hasattr(agent, 'name') else f"Agent {agent.id}",
            "total_orders": agent_totals['total_orders'],
            "paid_orders": agent_totals['paid_orders'],
            "unpaid_orders": agent_totals['unpaid_orders'],
            "total_sales_amount": float(agent_totals['total_sales_amount']),
            "paid_sales_amount": float(agent_totals['paid_sales_amount']),
            "service_breakdown": service_breakdown
        })
    
    # Prepare response
    response_data = {
        "total_bookings": total_bookings,
        "total_group_bookings": total_group_bookings,
        "total_ticket_bookings": total_ticket_bookings,
        "total_umrah_bookings": total_umrah_bookings,
        "total_visa_bookings": total_visa_bookings,
        "total_hotel_nights": total_hotel_nights,
        "total_transport_bookings": total_transport_bookings,
        "total_food_bookings": total_food_bookings,
        "total_ziyarat_bookings": total_ziyarat_bookings,
        "total_paid_orders": total_paid_orders,
        "total_unpaid_orders": total_unpaid_orders,
        "total_expired_orders": total_expired_orders,
        "total_amount": float(amounts['total']),
        "total_paid_amount": float(amounts['paid']),
        "total_unpaid_amount": float(amounts['unpaid']),
        "total_expired_amount": float(amounts['expired']),
        "agent_wise_summary": agent_wise_data,
        "date_range": {
            "from": date_from.strftime('%Y-%m-%d'),
            "to": date_to.strftime('%Y-%m-%d')
        }
    }
    
    return Response({
        "message": "Sales summary report generated successfully",
        "data": response_data
    }, status=status.HTTP_200_OK)


@extend_schema(
    summary="Financial / Ledger Summary Report",
    description="""
    📊 Financial Summary Report API
    
    Returns comprehensive financial overview including:
    - Total receivable and payable amounts
    - Settled vs unsettled breakdowns
    - Net balance calculation
    - By counterparty (organization) breakdown
    - By agent breakdown
    
    **Calculation Rules:**
    - Receivable: SUM(amount) from Ledger where to_company_id = organization_id
    - Payable: SUM(amount) from Ledger where from_company_id = organization_id
    - Net Balance: total_receivable_amount - total_payable_amount
    - Settled/Unsettled split based on status field
    """,
    parameters=[
        OpenApiParameter(
            name="organization_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description="Organization ID (required)",
            required=True,
        ),
    ],
    responses={
        200: {
            "type": "object",
            "properties": {
                "message": {"type": "string"},
                "data": {
                    "type": "object",
                    "properties": {
                        "organization_id": {"type": "integer"},
                        "total_receivable_amount": {"type": "number"},
                        "total_payable_amount": {"type": "number"},
                        "receivable_settled_amount": {"type": "number"},
                        "receivable_unsettled_amount": {"type": "number"},
                        "payable_settled_amount": {"type": "number"},
                        "payable_unsettled_amount": {"type": "number"},
                        "net_balance": {"type": "number"},
                        "by_counterparty": {"type": "array"},
                        "by_agent": {"type": "array"},
                    }
                }
            }
        }
    }
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def financial_summary_report(request):
    """
    📊 Financial / Ledger Summary Report API
    GET /api/v1/reports/financial-summary/
    """
    # Get parameters
    organization_id = request.GET.get('organization_id')
    
    # Validate organization_id
    if not organization_id:
        return Response({
            "message": "organization_id is required",
            "data": None
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        organization = Organization.objects.get(id=organization_id)
    except Organization.DoesNotExist:
        return Response({
            "message": "Organization not found",
            "data": None
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Receivable: where this org is receiving money (to_company = this org)
    # For now, using organization field as main reference
    receivable_entries = LedgerEntry.objects.filter(
        organization_id=organization_id,
        transaction_type='credit'
    )
    
    receivable_totals = receivable_entries.aggregate(
        total=Coalesce(Sum('transaction_amount'), Decimal('0.00')),
        # Assuming 'settled' status exists; adjust based on your model
        settled=Coalesce(
            Sum('transaction_amount', filter=Q(remarks__icontains='settled')),
            Decimal('0.00')
        ),
    )
    
    total_receivable = receivable_totals['total']
    receivable_settled = receivable_totals['settled']
    receivable_unsettled = total_receivable - receivable_settled
    
    # Payable: where this org owes money (from_company = this org)
    payable_entries = LedgerEntry.objects.filter(
        organization_id=organization_id,
        transaction_type='debit'
    )
    
    payable_totals = payable_entries.aggregate(
        total=Coalesce(Sum('transaction_amount'), Decimal('0.00')),
        settled=Coalesce(
            Sum('transaction_amount', filter=Q(remarks__icontains='settled')),
            Decimal('0.00')
        ),
    )
    
    total_payable = payable_totals['total']
    payable_settled = payable_totals['settled']
    payable_unsettled = total_payable - payable_settled
    
    # Net balance
    net_balance = total_receivable - total_payable
    
    # By Counterparty (seller_organization or inventory_owner_organization)
    by_counterparty = []
    
    # Get unique counterparty organizations from receivables
    counterparty_ids = receivable_entries.exclude(
        seller_organization__isnull=True
    ).values_list('seller_organization_id', flat=True).distinct()
    
    for counterparty_id in counterparty_ids:
        if not counterparty_id:
            continue
        
        try:
            counterparty_org = Organization.objects.get(id=counterparty_id)
        except Organization.DoesNotExist:
            continue
        
        # Receivable from this counterparty
        recv = receivable_entries.filter(
            seller_organization_id=counterparty_id
        ).aggregate(total=Coalesce(Sum('transaction_amount'), Decimal('0.00')))['total']
        
        # Payable to this counterparty
        pay = payable_entries.filter(
            seller_organization_id=counterparty_id
        ).aggregate(total=Coalesce(Sum('transaction_amount'), Decimal('0.00')))['total']
        
        by_counterparty.append({
            "organization_id": counterparty_org.id,
            "organization_name": counterparty_org.name,
            "receivable": float(recv),
            "payable": float(pay)
        })
    
    # By Agent
    by_agent = []
    
    # Get agent-related entries from bookings
    agent_bookings = Booking.objects.filter(
        organization_id=organization_id
    ).values_list('agency_id', flat=True).distinct()
    
    for agent_id in agent_bookings:
        if not agent_id:
            continue
        
        try:
            agent = Agency.objects.get(id=agent_id)
        except Agency.DoesNotExist:
            continue
        
        # Get ledger entries linked to this agent's bookings
        agent_booking_ids = Booking.objects.filter(
            agency_id=agent_id,
            organization_id=organization_id
        ).values_list('id', flat=True)
        
        agent_receivable = LedgerEntry.objects.filter(
            booking_id__in=agent_booking_ids,
            transaction_type='credit'
        ).aggregate(total=Coalesce(Sum('transaction_amount'), Decimal('0.00')))['total']
        
        agent_payable = LedgerEntry.objects.filter(
            booking_id__in=agent_booking_ids,
            transaction_type='debit'
        ).aggregate(total=Coalesce(Sum('transaction_amount'), Decimal('0.00')))['total']
        
        by_agent.append({
            "agent_id": agent.id,
            "agent_name": agent.name if hasattr(agent, 'name') else f"Agent {agent.id}",
            "receivable": float(agent_receivable),
            "payable": float(agent_payable)
        })
    
    # Prepare response
    response_data = {
        "organization_id": int(organization_id),
        "organization_name": organization.name,
        "total_receivable_amount": float(total_receivable),
        "total_payable_amount": float(total_payable),
        "receivable_settled_amount": float(receivable_settled),
        "receivable_unsettled_amount": float(receivable_unsettled),
        "payable_settled_amount": float(payable_settled),
        "payable_unsettled_amount": float(payable_unsettled),
        "net_balance": float(net_balance),
        "by_counterparty": by_counterparty,
        "by_agent": by_agent
    }
    
    return Response({
        "message": "Financial summary report generated successfully",
        "data": response_data
    }, status=status.HTTP_200_OK)


@extend_schema(
    summary="Top Seller (Agent-Wise) Report",
    description="""
    📊 Top Seller Report API
    
    Returns ranking of agents by total sales or booking count with:
    - Agent-wise sales totals
    - Category breakdown per agent
    - Ranking based on total_amount or total_bookings
    
    **Calculation Logic:**
    - Group bookings by agent_id
    - Count total bookings per agent
    - Sum total_amount per agent
    - Group by (agent_id, category) for breakdown
    - Sort by total_amount or total_bookings descending
    - Assign sequential ranking
    """,
    parameters=[
        OpenApiParameter(
            name="date_from",
            type=OpenApiTypes.DATE,
            location=OpenApiParameter.QUERY,
            description="Start date (YYYY-MM-DD). Optional",
            required=False,
        ),
        OpenApiParameter(
            name="date_to",
            type=OpenApiTypes.DATE,
            location=OpenApiParameter.QUERY,
            description="End date (YYYY-MM-DD). Optional",
            required=False,
        ),
        OpenApiParameter(
            name="organization_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description="Organization ID (required)",
            required=True,
        ),
        OpenApiParameter(
            name="limit",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description="Number of top sellers to return (default: 10)",
            required=False,
        ),
        OpenApiParameter(
            name="sort_by",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Sort by 'total_amount' or 'total_bookings' (default: total_amount)",
            required=False,
            enum=['total_amount', 'total_bookings']
        ),
    ],
    responses={
        200: {
            "type": "object",
            "properties": {
                "message": {"type": "string"},
                "data": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "agent_id": {"type": "integer"},
                            "agent_name": {"type": "string"},
                            "total_bookings": {"type": "integer"},
                            "total_amount": {"type": "number"},
                            "categories": {"type": "array"},
                            "ranking": {"type": "integer"}
                        }
                    }
                }
            }
        }
    }
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def top_sellers_report(request):
    """
    📊 Top Seller (Agent-Wise) Report API
    GET /api/v1/reports/top-sellers/
    """
    # Get parameters
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    organization_id = request.GET.get('organization_id')
    limit = int(request.GET.get('limit', 10))
    sort_by = request.GET.get('sort_by', 'total_amount')
    
    # Validate organization_id
    if not organization_id:
        return Response({
            "message": "organization_id is required",
            "data": None
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate sort_by
    if sort_by not in ['total_amount', 'total_bookings']:
        sort_by = 'total_amount'
    
    # Base queryset
    bookings = Booking.objects.filter(organization_id=organization_id)
    
    # Apply date filters if provided
    if date_from or date_to:
        date_from_obj, date_to_obj = get_date_range(date_from, date_to)
        bookings = bookings.filter(
            created_at__gte=date_from_obj,
            created_at__lte=date_to_obj
        )
    
    # Filter only paid bookings for accurate sales reporting
    bookings = bookings.filter(
        Q(payment_status__iexact='paid') | Q(is_paid=True)
    )
    
    # Get unique agents
    agent_ids = bookings.values_list('agency_id', flat=True).distinct()
    
    agent_data = []
    
    for agent_id in agent_ids:
        if not agent_id:
            continue
        
        try:
            agent = Agency.objects.get(id=agent_id)
        except Agency.DoesNotExist:
            continue
        
        agent_bookings = bookings.filter(agency_id=agent_id)
        
        # Agent totals
        total_bookings = agent_bookings.count()
        total_amount = agent_bookings.aggregate(
            total=Coalesce(Sum('total_amount'), 0.0)
        )['total']
        
        # Category breakdown
        categories = []
        
        # Ticket
        ticket_data = agent_bookings.filter(
            Q(category__icontains='ticket')
        ).aggregate(
            count=Count('id'),
            amount=Coalesce(Sum('total_ticket_amount'), 0.0)
        )
        if ticket_data['count'] > 0:
            categories.append({
                "category": "ticket",
                "count": ticket_data['count'],
                "amount": float(ticket_data['amount'])
            })
        
        # Umrah
        umrah_data = agent_bookings.filter(
            Q(category__iexact='umrah') | Q(umrah_package__isnull=False)
        ).aggregate(
            count=Count('id'),
            amount=Coalesce(Sum('total_amount'), 0.0)
        )
        if umrah_data['count'] > 0:
            categories.append({
                "category": "umrah",
                "count": umrah_data['count'],
                "amount": float(umrah_data['amount'])
            })
        
        # Visa
        visa_data = agent_bookings.filter(
            Q(category__icontains='visa')
        ).aggregate(
            count=Count('id'),
            amount=Coalesce(Sum('total_visa_amount'), 0.0)
        )
        if visa_data['count'] > 0:
            categories.append({
                "category": "visa",
                "count": visa_data['count'],
                "amount": float(visa_data['amount'])
            })
        
        # Hotel
        hotel_data = agent_bookings.filter(
            total_hotel_amount__gt=0
        ).aggregate(
            count=Count('id'),
            amount=Coalesce(Sum('total_hotel_amount'), 0.0)
        )
        if hotel_data['count'] > 0:
            categories.append({
                "category": "hotel",
                "count": hotel_data['count'],
                "amount": float(hotel_data['amount'])
            })
        
        # Transport
        transport_data = agent_bookings.filter(
            total_transport_amount__gt=0
        ).aggregate(
            count=Count('id'),
            amount=Coalesce(Sum('total_transport_amount'), 0.0)
        )
        if transport_data['count'] > 0:
            categories.append({
                "category": "transport",
                "count": transport_data['count'],
                "amount": float(transport_data['amount'])
            })
        
        agent_data.append({
            "agent_id": agent.id,
            "agent_name": agent.name if hasattr(agent, 'name') else f"Agent {agent.id}",
            "total_bookings": total_bookings,
            "total_amount": float(total_amount),
            "categories": categories,
            "ranking": 0  # Will be set after sorting
        })
    
    # Sort agents
    if sort_by == 'total_amount':
        agent_data.sort(key=lambda x: x['total_amount'], reverse=True)
    else:  # total_bookings
        agent_data.sort(key=lambda x: x['total_bookings'], reverse=True)
    
    # Assign rankings
    for idx, agent in enumerate(agent_data, start=1):
        agent['ranking'] = idx
    
    # Limit results
    agent_data = agent_data[:limit]
    
    return Response({
        "message": "Top sellers report generated successfully",
        "data": agent_data
    }, status=status.HTTP_200_OK)
