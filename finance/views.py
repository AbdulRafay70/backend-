from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Expense, FinancialRecord, ChartOfAccount
from .serializers import ExpenseSerializer, FinancialRecordSerializer
from django.db import transaction
from decimal import Decimal
from django.utils import timezone
from .utils import post_journal_to_ledger
from ledger.currency_utils import convert_sar_to_pkr
from ledger.currency_utils import convert_sar_to_pkr
from ledger.models import Account, LedgerEntry, LedgerLine
from django.contrib.auth.models import Group
from django.contrib.auth.decorators import user_passes_test
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .models import TransactionJournal
from rest_framework.schemas import openapi
from drf_spectacular.utils import extend_schema
from django.http import StreamingHttpResponse
import csv
import io
from datetime import datetime, timedelta
from django.db.models import Q, F, Value
from django.db.models.functions import Coalesce
from booking.models import Booking
from drf_spectacular.openapi import AutoSchema


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_expense(request):
    data = request.data.copy()
    data['created_by'] = request.user.id
    serializer = ExpenseSerializer(data=data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        expense = serializer.save()

        # convert amount to PKR if needed
        amount_pkr = Decimal(str(expense.amount))
        if expense.currency and expense.currency.upper() == 'SAR':
            try:
                amount_pkr = Decimal(str(convert_sar_to_pkr(expense.amount, expense.organization)))
            except Exception:
                amount_pkr = Decimal(str(expense.amount))

        # -----------------------------------------------------------------
        # Ledger Logic: Determine Credit (Cash/Bank) and Debit (Expense Category)
        # -----------------------------------------------------------------
        
        # 1. Credit Account (Source of Funds)
        credit_account = None
        # If payment_mode specified (Cash/Bank), try to find matching account
        if expense.payment_mode:
             credit_account = Account.objects.filter(
                 organization=expense.organization, 
                 name__icontains=expense.payment_mode, 
                 account_type__in=['CASH','BANK']
             ).first()
        
        # Fallback for credit account
        if not credit_account:
            credit_account = Account.objects.filter(organization=expense.organization, account_type__in=['CASH','BANK']).first()
        if not credit_account:
            # Create default Cash account if completely missing
            credit_account = Account.objects.create(
                organization=expense.organization,
                name="Cash Account",
                # code="1001", # Removed: Account model has no code field
                account_type="CASH"
            )

        # 2. Debit Account (Expense Destination)
        debit_account = None
        
        # A. If COA explicitly provided
        if expense.coa:
            debit_account = Account.objects.filter(organization=expense.organization, name__icontains=expense.coa.name).first()

        # B. If no COA, map based on Category (e.g. Office Expense -> Office Expense Account)
        if not debit_account and expense.category:
            category_name = expense.get_category_display() # e.g. "Office Expense"
            debit_account = Account.objects.filter(organization=expense.organization, name__iexact=category_name).first()
            
            if not debit_account:
                # Auto-create the Expense Account for this category
                debit_account = Account.objects.create(
                    organization=expense.organization,
                    name=category_name,
                    # code=f"EXP-{expense.category[:4].upper()}", 
                    account_type="EXPENSE"
                )

        # C. Fallback
        if not debit_account:
            debit_account = Account.objects.filter(organization=expense.organization, account_type='SUSPENSE').first()
        if not debit_account:
             debit_account = Account.objects.create(
                organization=expense.organization,
                name="Suspense Account",
                # code="9999",
                account_type="SUSPENSE"
            )

        # Build journal entries
        from .models import TransactionJournal
        entries = []
        if debit_account:
            entries.append({
                'account_id': debit_account.id,
                'debit': str(amount_pkr),
                'credit': '0.00'
            })
        if credit_account:
            entries.append({
                'account_id': credit_account.id,
                'debit': '0.00',
                'credit': str(amount_pkr)
            })

        journal = TransactionJournal.objects.create(
            organization=expense.organization,
            branch=expense.branch,
            reference=f"EXP-{expense.id}",
            narration=expense.notes or f"Expense: {expense.get_category_display()} ({expense.module_type})",
            created_by=request.user,
            entries=entries,
        )

        try:
            ledger_entry = post_journal_to_ledger(journal, actor=request.user)
            expense.ledger_entry_id = ledger_entry.id
            expense.save()
        except Exception as e:
            return Response({
                'expense': ExpenseSerializer(expense).data,
                'warning': f'Journal created but failed to post: {str(e)}'
            }, status=status.HTTP_201_CREATED)

        return Response(ExpenseSerializer(expense).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_expenses(request):
    org = request.query_params.get('organization')
    branch = request.query_params.get('branch')
    category = request.query_params.get('category')
    from_date = request.query_params.get('from')
    to_date = request.query_params.get('to')

    qs = Expense.objects.all()
    if org:
        qs = qs.filter(organization_id=org)
    if branch:
        qs = qs.filter(branch_id=branch)
    if category:
        qs = qs.filter(category=category)
    if from_date:
        qs = qs.filter(date__gte=from_date)
    if to_date:
        qs = qs.filter(date__lte=to_date)

    serializer = ExpenseSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def summary_all(request):
    # Simple aggregation endpoint returning totals grouped by org/branch
    org = request.query_params.get('organization')
    branch = request.query_params.get('branch')
    qs = FinancialRecord.objects.all()
    if org:
        qs = qs.filter(organization_id=org)
    if branch:
        qs = qs.filter(branch_id=branch)

    # Filter: Only Approved Bookings (or non-booking records)
    approved_ids = Booking.objects.filter(status='Approved').values('id')
    qs = qs.filter(Q(booking_id__isnull=True) | Q(booking_id__in=approved_ids))

    total_income = sum([fr.income_amount for fr in qs])
    total_purchase = sum([fr.purchase_cost or Decimal('0.00') for fr in qs])
    total_expenses = sum([fr.expenses_amount for fr in qs])
    total_profit = sum([fr.profit_loss or Decimal('0.00') for fr in qs])

    # breakdown by module
    breakdown = {}
    for svc in ['hotel', 'visa', 'transport', 'ticket', 'umrah', 'other']:
        svc_qs = qs.filter(service_type=svc)
        if not svc_qs.exists():
            continue
        breakdown[svc] = {
            'income': sum([fr.income_amount for fr in svc_qs]),
            'expense': sum([fr.expenses_amount for fr in svc_qs]),
            'profit': sum([fr.profit_loss or Decimal('0.00') for fr in svc_qs]),
        }

    return Response({
        'total_income': total_income,
        'total_purchase': total_purchase,
        'total_expenses': total_expenses,
        'total_profit': total_profit,
        'breakdown_by_module': breakdown,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def ledger_by_service(request):
    module_type = request.query_params.get('module_type') or request.query_params.get('service_type')
    org = request.query_params.get('organization')
    qs = FinancialRecord.objects.all()
    if module_type:
        qs = qs.filter(service_type=module_type)
    if org:
        qs = qs.filter(organization_id=org)

    # Filter: Only Approved Bookings (or non-booking records)
    approved_ids = Booking.objects.filter(status='Approved').values('id')
    qs = qs.filter(Q(booking_id__isnull=True) | Q(booking_id__in=approved_ids))

    records = []
    for fr in qs.order_by('-created_at'):
        records.append({
            'booking_id': fr.booking_id,
            'reference_no': fr.reference_no or (fr.metadata.get('booking_number') if fr.metadata else None),
            'income_amount': fr.income_amount,
            'purchase_cost': fr.purchase_cost,
            'expense_amount': fr.expenses_amount,
            'profit': fr.profit_loss,
            'record_date': fr.created_at.date() if fr.created_at else None,
            'agent_name': fr.agent.name if fr.agent else None,
        })

    return Response({'records': records})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def report_profit_loss(request):
    org = request.query_params.get('organization')
    branch = request.query_params.get('branch')
    month = request.query_params.get('month')  # format YYYY-MM
    year = request.query_params.get('year')

    qs = FinancialRecord.objects.all()
    if org:
        qs = qs.filter(organization_id=org)
    if branch:
        qs = qs.filter(branch_id=branch)
        
    # User Request: Additional Filters
    # 1. Agency
    agency_id = request.query_params.get('agency')
    if agency_id and agency_id != 'all':
        qs = qs.filter(agent_id=agency_id)
        
    # 2. Employee (created_by)
    employee_id = request.query_params.get('employee')
    if employee_id and employee_id != 'all':
        qs = qs.filter(created_by_id=employee_id)
      
    # 3. Module (Service Type)
    service_type = request.query_params.get('service_type')
    if service_type and service_type != 'all':
        qs = qs.filter(service_type=service_type)

    if month:
        try:
            y, m = month.split('-')
            qs = qs.filter(created_at__year=int(y), created_at__month=int(m))
        except Exception:
            pass
    if year:
        try:
            qs = qs.filter(created_at__year=int(year))
        except Exception:
            pass

    # Filter: Only Approved Bookings (or non-booking records)
    approved_ids = Booking.objects.filter(status='Approved').values('id')
    qs = qs.filter(Q(booking_id__isnull=True) | Q(booking_id__in=approved_ids))

    # 4. Profit Range Filter (on individual record basis)
    min_profit = request.query_params.get('min_profit')
    max_profit = request.query_params.get('max_profit')
    
    if min_profit or max_profit:
        # Calculate profit per record
        # Fix: Helper to ensure Decimal subtraction works
        from django.db.models import DecimalField
        qs = qs.annotate(
            record_profit=F('income_amount') - Coalesce('purchase_cost', Value(0), output_field=DecimalField(max_digits=18, decimal_places=2))
        )
        if min_profit:
            try:
                qs = qs.filter(record_profit__gte=Decimal(min_profit))
            except Exception: pass
        if max_profit:
            try:
                qs = qs.filter(record_profit__lte=Decimal(max_profit))
            except Exception: pass

    # User Request: Dynamic Grouping
    group_by = request.query_params.get('group_by', 'module')
    summary = {}
    
    group_map = []
    
    if group_by == 'agency':
        # Get distinct agents present in filtered QS (optimization)
        # Using simple iteration for compatibility 
        # (Ideal: qs.values('agent').annotate(...) but we have manual logic for profit)
        agency_ids = qs.values_list('agent_id', flat=True).distinct()
        from organization.models import Agency
        for aid in agency_ids:
            if not aid: continue
            try:
                a = Agency.objects.get(id=aid)
                label = a.title or a.name or f"Agency #{aid}"
                group_map.append((label, qs.filter(agent_id=aid)))
            except: pass
            
    elif group_by == 'branch':
        branch_ids = qs.values_list('branch_id', flat=True).distinct()
        from organization.models import Branch
        for bid in branch_ids:
            if not bid: continue
            try:
                b = Branch.objects.get(id=bid)
                label = b.name or f"Branch #{bid}"
                group_map.append((label, qs.filter(branch_id=bid)))
            except: pass
            
    elif group_by == 'employee':
        emp_ids = qs.values_list('created_by_id', flat=True).distinct()
        from django.contrib.auth import get_user_model
        User = get_user_model()
        for uid in emp_ids:
            if not uid: continue
            try:
                u = User.objects.get(id=uid)
                label = u.username or f"User #{uid}"
                group_map.append((label, qs.filter(created_by_id=uid)))
            except: pass
            
    else: # Default: 'module'
        for svc, label in FinancialRecord._meta.get_field('service_type').choices:
             svc_qs = qs.filter(service_type=svc)
             if svc_qs.exists():
                 group_map.append((label, svc_qs))

    for label, sub_qs in group_map:
        if not sub_qs.exists():
            continue
        
        income = sum([fr.income_amount for fr in sub_qs])
        # User Request: Expense = Purchase Cost
        expenses = sum([fr.purchase_cost or Decimal('0.00') for fr in sub_qs])
        profit = income - expenses

        summary[label] = {
            'income': income,
            'expenses': expenses,
            'profit': profit,
        }


    total_income = sum([v['income'] for v in summary.values()]) if summary else Decimal('0.00')
    total_expenses = sum([v['expenses'] for v in summary.values()]) if summary else Decimal('0.00')
    total_profit = sum([v['profit'] for v in summary.values()]) if summary else Decimal('0.00')

    return Response({
        'summary': summary,
        'total_income': total_income,
        'total_expenses': total_expenses,
        'total_profit': total_profit,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def report_fbr_summary(request):
    # Basic export-ready FBR summary by organization and year
    org = request.query_params.get('organization')
    year = request.query_params.get('year')

    qs = FinancialRecord.objects.all()
    if org:
        qs = qs.filter(organization_id=org)
    if year:
        try:
            qs = qs.filter(created_at__year=int(year))
        except Exception:
            pass

    total_income = sum([fr.income_amount for fr in qs])
    total_expenses = sum([fr.expenses_amount for fr in qs])
    total_profit = sum([fr.profit_loss or Decimal('0.00') for fr in qs])

    # minimal export structure
    return Response({
        'organization': org,
        'year': year,
        'total_income': total_income,
        'total_expenses': total_expenses,
        'total_profit': total_profit,
    })


@extend_schema(
    summary="Profit & Loss CSV export",
    description="Download profit & loss report as CSV. Filters: organization, branch, month (YYYY-MM), year",
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def report_profit_loss_csv(request):
    # reuse report_profit_loss filtering logic
    org = request.query_params.get('organization')
    branch = request.query_params.get('branch')
    month = request.query_params.get('month')
    year = request.query_params.get('year')

    qs = FinancialRecord.objects.all()
    if org:
        qs = qs.filter(organization_id=org)
    if branch:
        qs = qs.filter(branch_id=branch)
    if month:
        try:
            y, m = month.split('-')
            qs = qs.filter(created_at__year=int(y), created_at__month=int(m))
        except Exception:
            pass
    if year:
        try:
            qs = qs.filter(created_at__year=int(year))
        except Exception:
            pass

    # create CSV
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(['booking_id', 'reference_no', 'service_type', 'income', 'expenses', 'profit', 'record_date'])
    for fr in qs.order_by('-created_at'):
        writer.writerow([
            fr.booking_id,
            fr.reference_no or (fr.metadata.get('booking_number') if fr.metadata else ''),
            fr.service_type,
            str(fr.income_amount),
            str(fr.expenses_amount),
            str(fr.profit_loss or Decimal('0.00')),
            fr.created_at.isoformat() if fr.created_at else '',
        ])

    buffer.seek(0)
    resp = StreamingHttpResponse(buffer, content_type='text/csv')
    resp['Content-Disposition'] = f'attachment; filename="profit_loss_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
    return resp


@extend_schema(
    summary="FBR summary CSV export",
    description="Download FBR summary as CSV (organization, year).",
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def report_fbr_summary_csv(request):
    org = request.query_params.get('organization')
    year = request.query_params.get('year')

    qs = FinancialRecord.objects.all()
    if org:
        qs = qs.filter(organization_id=org)
    if year:
        try:
            qs = qs.filter(created_at__year=int(year))
        except Exception:
            pass

    # Prepare richer FBR-style CSV rows. NOTE: tax rates and mappings are placeholders.
    # For strict compliance, replace tax_rate_map and column set with official FBR spec.
    total_income = sum([fr.income_amount for fr in qs])
    total_expenses = sum([fr.expenses_amount for fr in qs])
    total_profit = sum([fr.profit_loss or Decimal('0.00') for fr in qs])

    buffer = io.StringIO()
    writer = csv.writer(buffer)

    # Header follows a common FBR summary layout (per-client doc inferred). Columns:
    # booking_id, booking_number, invoice_no, invoice_date, service_type, organization, branch,
    # agent_name, total_amount, taxable_amount, tax_rate, tax_amount, withholding_amount, net_payable
    writer.writerow([
        'booking_id', 'booking_number', 'invoice_no', 'invoice_date', 'service_type', 'organization', 'branch',
        'agent_name', 'total_amount', 'taxable_amount', 'tax_rate', 'tax_amount', 'withholding_amount', 'net_payable'
    ])

    # Simple tax mapping placeholder (service_type -> tax rate). Replace with real rules as required.
    tax_rate_map = {
        'hotel': Decimal('0.15'),
        'ticket': Decimal('0.05'),
        'transport': Decimal('0.10'),
        'visa': Decimal('0.00'),
        'umrah': Decimal('0.10'),
        'other': Decimal('0.10')
    }

    for fr in qs.order_by('-created_at'):
        booking_number = None
        invoice_no = fr.reference_no or ''
        invoice_date = fr.created_at.date().isoformat() if fr.created_at else ''
        agent_name = fr.agent.name if fr.agent else ''
        total_amount = fr.income_amount or Decimal('0.00')

        # taxable_amount heuristic: income - purchase_cost - expenses
        taxable_amount = (total_amount - (fr.purchase_cost or Decimal('0.00')) - (fr.expenses_amount or Decimal('0.00')))
        if taxable_amount < 0:
            taxable_amount = Decimal('0.00')

        tax_rate = tax_rate_map.get(fr.service_type, Decimal('0.10'))
        tax_amount = (taxable_amount * tax_rate).quantize(Decimal('0.01'))

        # withholding placeholder: 2% of taxable amount (replace with local rules)
        withholding_amount = (taxable_amount * Decimal('0.02')).quantize(Decimal('0.01'))
        net_payable = (total_amount - tax_amount - withholding_amount).quantize(Decimal('0.01'))

        writer.writerow([
            fr.booking_id or '',
            booking_number or '',
            invoice_no,
            invoice_date,
            fr.service_type,
            org or '',
            (fr.branch.name if fr.branch else '') if fr.branch else '',
            agent_name,
            str(total_amount),
            str(taxable_amount),
            str(tax_rate),
            str(tax_amount),
            str(withholding_amount),
            str(net_payable),
        ])

    # Summary row (total) appended for convenience
    writer.writerow([])
    writer.writerow(['organization', 'year', 'total_income', 'total_expenses', 'total_profit'])
    writer.writerow([org or '', year or '', str(total_income), str(total_expenses), str(total_profit)])

    buffer.seek(0)
    resp = StreamingHttpResponse(buffer, content_type='text/csv')
    resp['Content-Disposition'] = f'attachment; filename="fbr_summary_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
    return resp


@extend_schema(summary="Dashboard metrics (period)")
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_period(request):
    """Return aggregated P&L for a period. Query param 'period' may be 'today', 'week', 'month'."""
    period = request.query_params.get('period', 'today')
    org = request.query_params.get('organization')
    now = datetime.now()
    if period == 'today':
        start = datetime(now.year, now.month, now.day)
    elif period == 'week':
        start = now - timedelta(days=now.weekday())
        start = datetime(start.year, start.month, start.day)
    elif period == 'month':
        start = datetime(now.year, now.month, 1)
    else:
        return Response({'detail': 'invalid period'}, status=400)

    qs = FinancialRecord.objects.filter(created_at__gte=start)
    if org:
        qs = qs.filter(organization_id=org)

    # Filter: Only Approved Bookings (or non-booking records)
    approved_ids = Booking.objects.filter(status='Approved').values('id')
    qs = qs.filter(Q(booking_id__isnull=True) | Q(booking_id__in=approved_ids))

    total_income = sum([fr.income_amount for fr in qs])
    # User Request: "Total Expense is Total Purchase"
    total_expenses = sum([fr.purchase_cost or Decimal('0.00') for fr in qs])
    # Recalculate profit based on new expense definition
    total_profit = total_income - total_expenses

    # breakdown by module
    breakdown = {}
    for svc in ['hotel', 'visa', 'transport', 'ticket', 'umrah', 'other']:
        svc_qs = qs.filter(service_type=svc)
        if not svc_qs.exists():
            continue
        breakdown[svc] = {
            'income': sum([fr.income_amount for fr in svc_qs]),
            'expenses': sum([fr.expenses_amount for fr in svc_qs]),
            'profit': sum([fr.profit_loss or Decimal('0.00') for fr in svc_qs]),
        }

    return Response({
        'period': period,
        'start': start.isoformat(),
        'total_income': total_income,
        'total_expenses': total_expenses,
        'total_profit': total_profit,
        'breakdown_by_module': breakdown,
    })


@extend_schema(summary="Compact dashboard metrics")
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def compact_dashboard(request):
    """Compact dashboard suitable for embedding in Sweegar/Swagger UI.
    Returns totals and a small list of top services and pending journals count.
    Query params: period=today|week|month (optional), organization (optional)
    """
    period = request.query_params.get('period', 'today')
    org = request.query_params.get('organization')
    now = datetime.now()
    if period == 'today':
        start = datetime(now.year, now.month, now.day)
    elif period == 'week':
        start = now - timedelta(days=now.weekday())
        start = datetime(start.year, start.month, start.day)
    elif period == 'month':
        start = datetime(now.year, now.month, 1)
    else:
        # default to today if unrecognized
        start = datetime(now.year, now.month, now.day)

    qs = FinancialRecord.objects.filter(created_at__gte=start)
    if org:
        qs = qs.filter(organization_id=org)

    # Filter: Only Approved Bookings (or non-booking records)
    approved_ids = Booking.objects.filter(status='Approved').values('id')
    qs = qs.filter(Q(booking_id__isnull=True) | Q(booking_id__in=approved_ids))

    total_income = sum([fr.income_amount for fr in qs])
    # User Request: "Total Expense is Total Purchase"
    total_expenses = sum([fr.purchase_cost or Decimal('0.00') for fr in qs])
    # Recalculate profit based on new expense definition
    total_profit = total_income - total_expenses

    # top services by profit
    svc_totals = {}
    for fr in qs:
        svc = fr.service_type or 'other'
        svc_totals.setdefault(svc, Decimal('0.00'))
        svc_totals[svc] += (fr.profit_loss or Decimal('0.00'))

    top_services = sorted(svc_totals.items(), key=lambda x: x[1], reverse=True)[:5]
    top_services = [{'service_type': s, 'profit': p} for s, p in top_services]

    # pending journals (not posted)
    pending_count = TransactionJournal.objects.filter(posted=False).count()

    return Response({
        'period': period,
        'start': start.isoformat(),
        'total_income': total_income,
        'total_expenses': total_expenses,
        'total_profit': total_profit,
        'top_services': top_services,
        'pending_journals': pending_count,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@csrf_exempt
def manual_posting(request):
    """Manual posting endpoint. Accepts a TransactionJournal-like payload and posts to ledger.

    Only users in group 'finance_managers' or superusers are allowed.
    Payload example:
    {
      "organization": 1,
      "branch": 1,
      "reference": "MAN-123",
      "narration": "Adjustment",
      "entries": [{"account_id": 10, "debit": "100.00", "credit": "0.00"}, {"account_id": 20, "debit": "0.00", "credit": "100.00"}]
    }
    """

    user = request.user

    # permission check
    if not (user.is_superuser or user.groups.filter(name='finance_managers').exists()):
        return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    data = request.data
    entries = data.get('entries') or []
    if not entries:
        return Response({'detail': 'entries required'}, status=status.HTTP_400_BAD_REQUEST)

    # create TransactionJournal
    tj = TransactionJournal.objects.create(
        organization_id=data.get('organization'),
        branch_id=data.get('branch'),
        reference=data.get('reference'),
        narration=data.get('narration'),
        created_by=user,
        entries=entries,
    )

    try:
        ledger_entry = post_journal_to_ledger(tj, actor=user)
    except Exception as e:
        return Response({'detail': f'Failed to post journal: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    return Response({'journal_id': tj.id, 'ledger_entry_id': ledger_entry.id}, status=status.HTTP_201_CREATED)


@extend_schema(summary="Balance Sheet")
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def balance_sheet(request):
    """
    Return Balance Sheet data dynamically calculated from Ledger Accounts.
    Assets = Liabilities + Equity
    """
    from ledger.models import Account
    from django.db.models import Sum
    
    org_id = request.query_params.get('organization')
    
    # 1. Fetch all Accounts
    accounts = Account.objects.all()
    if org_id:
        accounts = accounts.filter(organization_id=org_id)
        
    # 2. Group by Type (Standard Accounting from Ledger)
    # Assets: Cash, Bank, Receivable
    assets_qs = accounts.filter(account_type__in=['CASH', 'BANK', 'RECEIVABLE', 'ASSET']) 
    # Liabilities: Payable
    liabilities_qs = accounts.filter(account_type__in=['PAYABLE', 'LIABILITY'])
    # Equity: Equity Accounts (Capital)
    equity_qs = accounts.filter(account_type__in=['EQUITY'])

    # 3. Calculate Totals (Balances)
    # Assets (Debit Normal -> Positive Balance)
    total_assets = assets_qs.aggregate(t=Sum('balance'))['t'] or Decimal(0)
    
    # Liabilities (Credit Normal -> Negative Balance -> Abs for Reporting)
    total_liabilities = abs(liabilities_qs.aggregate(t=Sum('balance'))['t'] or Decimal(0))
    
    # Equity (Credit Normal -> Negative Balance -> Abs for Reporting)
    total_equity_accounts = abs(equity_qs.aggregate(t=Sum('balance'))['t'] or Decimal(0))
    
    # 4. Calculate Retained Earnings (Net Income)
    # Retained Earnings = Sum(Income Accounts) + Sum(Expense Accounts)
    # Income (Credit/Neg) + Expense (Debit/Pos).
    # If Result < 0 (Credit Balance) -> Profit.
    # If Result > 0 (Debit Balance) -> Loss.
    
    income_val = accounts.filter(account_type__in=['INCOME', 'SALES', 'COMMISSION']).aggregate(t=Sum('balance'))['t'] or Decimal(0)
    expense_val = accounts.filter(account_type__in=['EXPENSE']).aggregate(t=Sum('balance'))['t'] or Decimal(0)
    
    net_income_balance = income_val + expense_val
    # We display Profit as positive number in Equity section
    retained_earnings = -net_income_balance

    total_equity = total_equity_accounts + retained_earnings

    return Response({
        'assets': {
            'cash': assets_qs.filter(account_type='CASH').aggregate(t=Sum('balance'))['t'] or 0,
            'bank': assets_qs.filter(account_type='BANK').aggregate(t=Sum('balance'))['t'] or 0,
            'receivables': assets_qs.filter(account_type='RECEIVABLE').aggregate(t=Sum('balance'))['t'] or 0,
            'total': total_assets,
            # Inventory removed as per request
        },
        'liabilities': {
            'payables': total_liabilities,
            'total': total_liabilities,
             # Loans removed as per request
        },
        'equity': {
            'capital': total_equity_accounts,
            'retained_earnings': retained_earnings,
            'total': total_equity,
        },
        'total_assets': total_assets,
        'total_liabilities_equity': total_liabilities + total_equity,
    })


@extend_schema(summary="Audit Trail")
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def audit_trail(request):
    """Return audit trail entries with filtering options.
    
    Query params:
    - action: filter by action (create/update/delete)
    - object_type: filter by object type
    - from_date: filter from date (YYYY-MM-DD)
    - to_date: filter to date (YYYY-MM-DD)
    - limit: number of records to return (default 100)
    """
    from .models import AuditLog
    
    action = request.query_params.get('action')
    object_type = request.query_params.get('object_type')
    from_date = request.query_params.get('from_date')
    to_date = request.query_params.get('to_date')
    limit = int(request.query_params.get('limit', 100))
    
    qs = AuditLog.objects.all().order_by('-timestamp')
    
    if action:
        qs = qs.filter(action=action)
    if object_type:
        qs = qs.filter(object_type=object_type)
    if from_date:
        try:
            qs = qs.filter(timestamp__gte=from_date)
        except Exception:
            pass
    if to_date:
        try:
            qs = qs.filter(timestamp__lte=to_date)
        except Exception:
            pass
    
    # Limit results
    qs = qs[:limit]
    
    logs = []
    for log in qs:
        logs.append({
            'id': log.id,
            'timestamp': log.timestamp.isoformat() if log.timestamp else None,
            'actor': log.actor.username if log.actor else 'System',
            'action': log.action,
            'object_type': log.object_type,
            'object_id': log.object_id,
            'before': log.before,
            'after': log.after,
            'reason': log.reason,
        })
    
    return Response({
        'logs': logs,
        'count': len(logs),
    })


@extend_schema(summary="Booking Profit & Loss (Strict Package Calculation)")
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def booking_pnl_view(request, booking_id):
    """
    Get strict P&L for a booking based on package prices.
    Calculates on-the-fly and updates FinancialRecord.
    """
    from .utils import calculate_booking_pnl
    
    result = calculate_booking_pnl(booking_id)
    
    if result is None:
        return Response({'error': 'Booking not found or Package missing'}, status=404)
        
    return Response(result)

@extend_schema(request=None, responses=None)
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manual_posting(request):
    """
    Unified API for Manual Postings.
    GET: List manual postings.
    POST: Create a new manual posting (expense, income, transfer, journal, etc.)
    """
    if request.method == 'GET':
        # List manual postings

        try:
            # Determine organization context
            org_id = request.query_params.get('organization')
            if not org_id and hasattr(request.user, 'employee_profile'):
                 org_id = request.user.employee_profile.organization_id
            
            # Base QuerySet
            # Base QuerySet - Correctly using field names
            qs = LedgerEntry.objects.filter(is_manual=True).order_by('-created_at')
            
            if org_id:
                 # LedgerEntry has direct organization link
                 qs = qs.filter(organization_id=org_id)

            # Serialize
            data = []
            for entry in qs[:100]: # Limit for performance
                lines = entry.lines.select_related('account').all()
                data.append({
                    'id': entry.id,
                    'date': entry.created_at.date(), # Use created_at if date field missing, or check if 'date' field exists (it does not based on model view)
                    # Actually, check if 'date' exists? No, models.py didn't show it. Use created_at.
                    'description': entry.narration,
                    'amount': entry.transaction_amount,
                    'posting_type': entry.service_type, 
                    'reference_no': entry.reference_no,
                    'lines': [{
                        'account_name': l.account.name,
                        'debit': l.debit,
                        'credit': l.credit,
                        'description': l.remarks
                    } for l in lines],
                    'is_manual': entry.is_manual,
                    'locked': entry.locked,
                    # Add approval status if needed
                    'approval_status': getattr(entry, 'approval_status', 'approved')
                })
            return Response(data)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    # POST Handling (Existing Login)
    user = request.user
    data = request.data
    
    posting_type = data.get('posting_type')
    date_val = data.get('date', timezone.now().date())
    description = data.get('description', '')
    branch_id = data.get('branch_id')
    amount_raw = data.get('amount', '0.00')
    amount = Decimal(str(amount_raw)) if amount_raw else Decimal('0.00')
    
    # Audit fields
    reference_type = data.get('reference_type') # e.g., 'vendor', 'employee'
    reference_id = data.get('reference_id')
    
    # Resolve Organization
    org_id_input = data.get('organization')
    org = None
    
    if org_id_input:
        from organization.models import Organization
        try:
            org = Organization.objects.get(id=org_id_input)
        except Organization.DoesNotExist:
            pass

    if not org:
        org = getattr(user, 'active_organization', None)
        
    if not org and hasattr(user, 'employee_profile'):
        org = user.employee_profile.organization
    
    if not org and user.is_superuser:
        from organization.models import Organization
        org = Organization.objects.first()
        
    if not org:
        return Response({'detail': 'User must belong to an organization to post entries.'}, status=400)

    try:
        with transaction.atomic():
            # 1. Create Ledger Entry Header
            entry = LedgerEntry.objects.create(
                organization=org,
                branch_id=branch_id,
                transaction_type='debit', # Default, neutral container
                service_type=posting_type,
                narration=description,
                transaction_amount=amount,
                created_by=user,
                creation_datetime=date_val if isinstance(date_val, (datetime, str)) else timezone.now(),
                is_manual=True,
                reference_type=reference_type,
                reference_id=reference_id
            )
            
            lines_payload = []
            
            # Helper to add line
            def add_line(acc_id, dr=0, cr=0, remarks=None):
                if not acc_id:
                     raise ValueError(f"Account ID missing for line with Dr:{dr} Cr:{cr}")
                lines_payload.append({
                    'account_id': acc_id, 
                    'debit': Decimal(str(dr)), 
                    'credit': Decimal(str(cr)),
                    'remarks': remarks or description
                })

            # --- LOGIC PER POSTING TYPE ---
            
            # CASE 1: EXPENSE (Dr Expense, Cr Asset)
            if posting_type in ['expense', 'expense (manual)']:
                debit_acc = data.get('debit_account') # Expense Account
                credit_acc = data.get('credit_account') # Bank/Cash
                add_line(debit_acc, dr=amount, cr=0)
                add_line(credit_acc, dr=0, cr=amount)

            # CASE 2: INCOME (Dr Asset, Cr Income)
            elif posting_type in ['income', 'income (manual)']:
                debit_acc = data.get('debit_account') # Bank/Cash
                credit_acc = data.get('credit_account') # Income Account
                add_line(debit_acc, dr=amount, cr=0)
                add_line(credit_acc, dr=0, cr=amount)

            # CASE 3: TRANSFERS (Dr Receiver, Cr Sender)
            elif posting_type in ['cash_transfer', 'bank_transfer', 'bank_to_cash', 'cash_to_bank']:
                from_acc = data.get('credit_account') # Sender
                to_acc = data.get('debit_account')    # Receiver
                add_line(to_acc, dr=amount, cr=0, remarks=f"Transfer In from {from_acc}")
                add_line(from_acc, dr=0, cr=amount, remarks=f"Transfer Out to {to_acc}")

            # CASE 4: CAPITAL IN (Dr Asset, Cr Equity)
            elif posting_type == 'capital_in':
                asset_acc = data.get('debit_account') # Bank/Cash
                equity_acc = data.get('credit_account') # Owner Equity
                add_line(asset_acc, dr=amount, cr=0)
                add_line(equity_acc, dr=0, cr=amount)

            # CASE 5: CAPITAL OUT (Dr Equity/Drawings, Cr Asset)
            elif posting_type == 'capital_out':
                drawings_acc = data.get('debit_account') # Owner Drawings
                asset_acc = data.get('credit_account')   # Bank/Cash
                add_line(drawings_acc, dr=amount, cr=0)
                add_line(asset_acc, dr=0, cr=amount)

            # CASE 6: SALARY PAYMENT (Dr Expense, Cr Asset)
            elif posting_type == 'salary':
                expense_acc = data.get('debit_account') # Salary Expense
                asset_acc = data.get('credit_account')  # Bank/Cash
                employee_id = reference_id
                add_line(expense_acc, dr=amount, cr=0, remarks=f"Salary Payment (Emp #{employee_id})")
                add_line(asset_acc, dr=0, cr=amount, remarks=f"Salary Paid (Emp #{employee_id})")

            # CASE 7: CREDIT PURCHASE (Dr Expense/Asset, Cr Payable)
            elif posting_type == 'credit_purchase':
                expense_acc = data.get('debit_account') # Purchase/Expense
                payable_acc = data.get('credit_account') # Vendor Payable
                vendor_id = reference_id
                add_line(expense_acc, dr=amount, cr=0)
                add_line(payable_acc, dr=0, cr=amount, remarks=f"Credit Purchase from Vendor #{vendor_id}")

            # CASE 8: VENDOR PAYMENT (Dr Payable, Cr Asset)
            elif posting_type == 'vendor_payment':
                payable_acc = data.get('debit_account') # Vendor Payable
                asset_acc = data.get('credit_account')  # Bank/Cash
                vendor_id = reference_id
                add_line(payable_acc, dr=amount, cr=0, remarks=f"Payment to Vendor #{vendor_id}")
                add_line(asset_acc, dr=0, cr=amount)

            # CASE 9: JOURNAL / ADJUSTMENT / OPENING BALANCE (Free form)
            elif posting_type in ['journal', 'adjustment', 'opening_balance', 'ledger_adjustment']:
                raw_lines = data.get('lines', [])
                total_dr = sum(Decimal(str(l.get('debit', 0))) for l in raw_lines)
                total_cr = sum(Decimal(str(l.get('credit', 0))) for l in raw_lines)
                
                if abs(total_dr - total_cr) > Decimal('0.01'): # Allow float tolerance
                    raise ValueError(f"Unbalanced Journal! Dr: {total_dr}, Cr: {total_cr}")
                
                for l in raw_lines:
                    add_line(
                        l['account_id'], 
                        dr=l.get('debit', 0), 
                        cr=l.get('credit', 0), 
                        remarks=l.get('remarks')
                    )

            else:
                 return Response({'detail': f"Unsupported posting type: {posting_type}"}, status=400)

            # --- EXECUTE LINE CREATION ---
            if not lines_payload:
                 raise ValueError("No ledger lines generated from request data")

            for line_data in lines_payload:
                acc = Account.objects.get(id=line_data['account_id'])
                dr = line_data['debit']
                cr = line_data['credit']
                
                # Update Account Balance
                # Asset/Expense/Drawings: Dr increases (+), Cr decreases (-)
                # Liability/Equity/Income: Cr increases (+), Dr decreases (-)
                # However, typically 'balance' in DB is often kept signed or absolute based on convention.
                # Assuming Standard: 
                # ASSET, EXPENSE: Balance = Dr - Cr
                # LIABILITY, INCOME, EQUITY: Balance = Cr - Dr
                
                if acc.account_type in ['ASSET', 'EXPENSE', 'CASH', 'BANK', 'RECEIVABLE']:
                     acc.balance += (dr - cr)
                else: 
                     acc.balance += (cr - dr)
                
                acc.save()

                LedgerLine.objects.create(
                    ledger_entry=entry,
                    account=acc,
                    debit=dr,
                    credit=cr,
                    balance_after=acc.balance,
                    remarks=line_data.get('remarks') or description
                )

        return Response({
            'message': 'Manual posting created successfully', 
            'id': entry.id,
            'reference_no': entry.reference_no
        }, status=201)

    except Account.DoesNotExist:
         return Response({'detail': 'One or more accounts not found'}, status=400)
    except Exception as e:
        return Response({'detail': str(e)}, status=400)


@extend_schema(request=None, responses=None)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reverse_manual_posting(request, pk):
    """
    Reverse a manual posting entry.
    Creates a new reversing entry and marks the original as reversed.
    """
    try:
        entry = LedgerEntry.objects.get(pk=pk, organization=request.user.active_organization)
        
        if entry.reversed:
             return Response({'detail': 'Entry already reversed'}, status=400)
             
        # Check lock status (if not admin)
        if entry.locked and not request.user.is_superuser:
             return Response({'detail': 'Entry is locked and cannot be reversed by current user'}, status=403)

        with transaction.atomic():
            reversal_entry = entry.reverse(user=request.user, remarks=request.data.get('remarks'))
            if not reversal_entry:
                return Response({'detail': 'Reversal failed'}, status=400)
                
        return Response({'message': 'Entry reversed successfully', 'reversal_id': reversal_entry.id})

    except LedgerEntry.DoesNotExist:
        return Response({'detail': 'Entry not found'}, status=404)
    except Exception as e:
        return Response({'detail': str(e)}, status=400)


@extend_schema(request=None, responses=None)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_account_list(request):
    """
    Get list of all accounts for dropdowns.
    """
    org = request.user.active_organization if hasattr(request.user, 'active_organization') else None
    
    if not org:
        # Fallback: return all accounts? Or empty?
        # Usually for a multi-tenant system, returning nothing is safer.
        # But for testing, maybe we want to see something?
        # Let's try to get the first organization if user is superuser
        if request.user.is_superuser:
            from organization.models import Organization
            org = Organization.objects.first()
            
    if not org:
        return Response([])

    accounts = Account.objects.filter(
        organization=org
    ).values('id', 'name', 'account_type', 'balance', 'bank_name', 'account_number', 'iban', 'branch_id')
    
    return Response(list(accounts))

@extend_schema(summary="Create a new Ledger Account")
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_account(request):
    """
    Create a new Chart of Accounts entry.
    Supports Bank fields (bank_name, account_number, iban) if account_type='BANK'.
    """
    user = request.user
    data = request.data
    
    # 1. Basic Validation
    name = data.get('name')
    account_type = data.get('account_type', 'CASH').upper()
    
    if not name:
        return Response({'detail': 'Account name is required'}, status=400)
    
    # Validate Type
    valid_types = [c[0] for c in Account.ACCOUNT_TYPE_CHOICES]
    if account_type not in valid_types:
        return Response({'detail': f'Invalid account type. Choices: {valid_types}'}, status=400)

    # 2. Resolve Organization/Branch
    # Resolve Organization
    org = getattr(user, 'active_organization', None)
    if not org and hasattr(user, 'employee_profile'):
        org = user.employee_profile.organization
    
    if not org and user.is_superuser:
        from organization.models import Organization
        org = Organization.objects.first()
        
    if not org:
        return Response({'detail': 'User must belong to an organization to create accounts.'}, status=400)

    branch = None
    branch_id = data.get('branch_id')
    if branch_id:
        try:
            branch = Branch.objects.get(id=branch_id)
        except Branch.DoesNotExist:
            pass 

    # 2. Create Account
    try:
        acc = Account.objects.create(
            name=name,
            account_type=account_type,
            organization=org,
            branch=branch,
            # Map Bank Fields
            bank_name = data.get('bank_name') if account_type == 'BANK' else None,
            account_number = data.get('account_number') if account_type == 'BANK' else None,
            iban = data.get('iban') if account_type == 'BANK' else None,
        )
        
        # 3. Handle Opening Balance (Optional)
        opening_balance = Decimal(str(data.get('opening_balance', '0.00')))
        balance_type = data.get('opening_balance_type', 'debit') # debit or credit
        
        if opening_balance > 0:
            # Create "Opening Balance" Ledger Entry
            # We need a generic "Capital" or "Suspense" account for the other side if not specified? 
            # Ideally, Opening Balance is a single-sided entry in some systems, but effectively double-entry vs Equity/Suspense.
            # Here, we will just CREATE the entry record with one line for this account and let the user balance it or auto-balance against Equity.
            # Simplified: Just set the logic to create a proper Manual Posting of type 'opening_balance'
            
            # Setup Transaction
            with transaction.atomic():
                entry = LedgerEntry.objects.create(
                    organization=acc.organization,
                    branch=branch,
                    transaction_type='debit', # placeholder
                    service_type='opening_balance',
                    narration=f"Opening Balance for {acc.name}",
                    transaction_amount=opening_balance,
                    created_by=user,
                    is_manual=True,
                    locked=True # Opening balances usually locked after creation
                )
                
                # Debit or Credit THIS account
                dr = opening_balance if balance_type == 'debit' else 0
                cr = opening_balance if balance_type == 'credit' else 0
                
                LedgerLine.objects.create(
                    entry=entry,
                    account=acc,
                    debit=dr,
                    credit=cr,
                    description="Opening Balance"
                )
                
                # Contra Entry? 
                # Usually Opening Balance is balanced against "Retained Earnings" or "Opening Balance Equity".
                # For now, we leave it unbalanced or create a Suspense line if requested. 
                # To avoid complex logic errors, we will leave it single-sided implementation-wise or assume user balances it later?
                # BETTER APPROACH for User Fairness: Auto-create a "Suspense/Equity" line if they didn't provide one.
                # Let's search for an Equity account.
                equity_acc = Account.objects.filter(organization=acc.organization, account_type='EQUITY').first()
                if equity_acc:
                     LedgerLine.objects.create(
                        entry=entry,
                        account=equity_acc,
                        debit=cr, # Swap
                        credit=dr,
                        description="Opening Balance Offset"
                    )

        return Response({
            'id': acc.id, 
            'name': acc.name, 
            'account_type': acc.account_type,
            'detail': 'Account Created Successfully'
        }, status=201)

    except Exception as e:
        return Response({'detail': str(e)}, status=500)


@extend_schema(summary="Update Account Details")
@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_account(request, pk):
    try:
        acc = Account.objects.get(pk=pk)
    except Account.DoesNotExist:
        return Response({'detail': 'Account not found'}, status=404)
        
    data = request.data
    
    # Update Fields
    if 'name' in data: acc.name = data['name']
    if 'bank_name' in data: acc.bank_name = data['bank_name']
    if 'account_number' in data: acc.account_number = data['account_number']
    if 'iban' in data: acc.iban = data['iban']
    if 'branch_id' in data:
         try:
             acc.branch = Branch.objects.get(id=data['branch_id'])
         except:
             pass
             
    acc.save()
    return Response({'id': acc.id, 'detail': 'Account Updated'}, status=200)


@extend_schema(summary="Get Balance Sheet Report")
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def balance_sheet(request):
    """
    Returns Balance Sheet data: Assets, Liabilities, Equity.
    Calculates Retained Earnings dynamically from Income - Expense.
    """
    org = request.user.active_organization if hasattr(request.user, 'active_organization') else None
    if not org and hasattr(request.user, 'employee_profile'):
        org = request.user.employee_profile.organization
    
    # Optional: Allow superuser to see all or filter
    if not org and request.user.is_superuser:
        org_id = request.query_params.get('organization')
        if org_id:
             from organization.models import Organization
             try:
                 org = Organization.objects.get(id=org_id)
             except:
                 pass
                 
    if not org:
         return Response({'detail': 'Organization context required'}, status=400)

    accounts = Account.objects.filter(organization=org)
    
    # 1. Assets
    assets = accounts.filter(account_type__in=['ASSET', 'CASH', 'BANK', 'RECEIVABLE'])
    total_assets = sum([a.balance for a in assets])
    
    # 2. Liabilities
    liabilities = accounts.filter(account_type__in=['LIABILITY', 'PAYABLE', 'CREDIT_CARD'])
    total_liabilities = sum([a.balance for a in liabilities])
    
    # 3. Equity
    equity = accounts.filter(account_type__in=['EQUITY', 'CAPITAL'])
    total_equity_declared = sum([a.balance for a in equity])
    
    # 4. Retained Earnings (Income - Expense)
    income = accounts.filter(account_type__in=['INCOME', 'SALES', 'COMMISSION', 'REVENUE'])
    total_income = sum([a.balance for a in income])
    
    expenses = accounts.filter(account_type__in=['EXPENSE', 'COST_OF_SALES'])
    total_expense = sum([a.balance for a in expenses])
    
    retained_earnings = total_income - total_expense
    
    total_equity = total_equity_declared + retained_earnings
    
    return Response({
        'organization': org.name,
        'date': timezone.now().date(),
        'assets': {
            'total': total_assets,
            'accounts': [{'name': a.name, 'balance': a.balance, 'type': a.account_type, 'bank_details': f"{a.bank_name or ''} {a.account_number or ''}".strip()} for a in assets]
        },
        'liabilities': {
            'total': total_liabilities,
            'accounts': [{'name': a.name, 'balance': a.balance, 'type': a.account_type} for a in liabilities]
        },
        'equity': {
            'total': total_equity,
            'accounts': [{'name': a.name, 'balance': a.balance, 'type': a.account_type} for a in equity],
            'retained_earnings': retained_earnings,
            'breakdown': {
                'total_income': total_income,
                'total_expense': total_expense
            }
        },
        'summary': {
             'total_assets': total_assets,
             'total_liabilities_and_equity': total_liabilities + total_equity,
             'is_balanced': abs(total_assets - (total_liabilities + total_equity)) < Decimal('0.1')
        }
    })
