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
from ledger.models import Account
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
                # fallback: keep original amount
                amount_pkr = Decimal(str(expense.amount))

        # Determine credit account (cash/bank) and debit account (expense or suspense)
        credit_account = Account.objects.filter(organization=expense.organization, account_type__in=['CASH','BANK']).first()
        if not credit_account:
            credit_account = Account.objects.filter(organization=expense.organization).first()

        # debit: prefer linked COA -> find account with same name; fallback to SUSPENSE
        debit_account = None
        if expense.coa:
            # try to find ledger Account with similar name
            debit_account = Account.objects.filter(organization=expense.organization, name__icontains=expense.coa.name).first()
        if not debit_account:
            debit_account = Account.objects.filter(organization=expense.organization, account_type='SUSPENSE').first()
        if not debit_account:
            debit_account = Account.objects.filter(organization=expense.organization).first()

        # Build journal entries (two-way double entry)
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
            narration=expense.notes or f"Expense {expense.category}",
            created_by=request.user,
            entries=entries,
        )

        # attempt posting to ledger
        try:
            ledger_entry = post_journal_to_ledger(journal, actor=request.user)
            expense.ledger_entry_id = ledger_entry.id
            expense.save()
        except Exception as e:
            # leave journal unposted but return expense created; include warning
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

    records = []
    for fr in qs.order_by('-created_at'):
        records.append({
            'booking_id': fr.booking_id,
            'reference_no': fr.reference_no or (fr.metadata.get('booking_number') if fr.metadata else None),
            'income_amount': fr.income_amount,
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

    # group by service_type
    summary = {}
    for svc, _ in FinancialRecord._meta.get_field('service_type').choices:
        svc_qs = qs.filter(service_type=svc)
        if not svc_qs.exists():
            continue
        summary[svc] = {
            'income': sum([fr.income_amount for fr in svc_qs]),
            'expenses': sum([fr.expenses_amount for fr in svc_qs]),
            'profit': sum([fr.profit_loss or Decimal('0.00') for fr in svc_qs]),
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

    total_income = sum([fr.income_amount for fr in qs])
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

    total_income = sum([fr.income_amount for fr in qs])
    total_expenses = sum([fr.expenses_amount for fr in qs])
    total_profit = sum([fr.profit_loss or Decimal('0.00') for fr in qs])

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
