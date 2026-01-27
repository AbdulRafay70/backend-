from decimal import Decimal
from django.db import transaction
from django.utils import timezone

from ledger.models import LedgerEntry, LedgerLine, Account
from .models import TransactionJournal, AuditLog
from ledger.currency_utils import convert_sar_to_pkr
from booking.models import Booking
from packages.models import UmrahPackage
from .models import FinancialRecord, Expense
from django.db.models import Sum


def post_journal_to_ledger(journal: TransactionJournal, actor=None):
    """
    Post a TransactionJournal into the ledger as a LedgerEntry with LedgerLines.
    Expects journal.entries as a list of dicts: {'account_id': int, 'debit': Decimal, 'credit': Decimal}
    Returns the created LedgerEntry or raises ValueError on invalid input.
    """
    if journal.posted:
        raise ValueError("Journal already posted")

    entries = journal.entries or []
    if not entries:
        raise ValueError("Journal has no entries")

    # Validate accounts exist
    account_ids = [e.get("account_id") for e in entries if e.get("account_id")]
    if not account_ids:
        raise ValueError("Entries must contain 'account_id' fields")

    accounts = Account.objects.select_for_update().filter(pk__in=account_ids)
    account_map = {a.id: a for a in accounts}

    # Create LedgerEntry + lines atomically
    with transaction.atomic():
        # Re-select accounts with locks
        Account.objects.select_for_update().filter(pk__in=account_ids)

        ledger_entry = LedgerEntry.objects.create(
            booking_no=journal.reference,
            service_type="other",
            narration=journal.narration,
            created_by=journal.created_by,
            creation_datetime=timezone.now(),
            metadata={"journal_id": journal.id},
            internal_notes=[f"Posted from TransactionJournal {journal.id} by user {actor.id if actor else 'system'}"],
        )

        # apply each line and update account balances
        for ent in entries:
            acc_id = ent.get("account_id")
            debit = Decimal(str(ent.get("debit" or 0))) if ent.get("debit") else Decimal("0.00")
            credit = Decimal(str(ent.get("credit" or 0))) if ent.get("credit") else Decimal("0.00")

            if acc_id not in account_map:
                raise ValueError(f"Account {acc_id} not found for journal posting")

            account = account_map[acc_id]

            # update account balance: balance = balance + debit - credit
            account.balance = account.balance + debit - credit
            account.save()

            LedgerLine.objects.create(
                ledger_entry=ledger_entry,
                account=account,
                debit=debit,
                credit=credit,
                final_balance=account.balance,
            )

        journal.ledger_entry_id = ledger_entry.id
        journal.posted = True
        journal.save()

        # Audit log
        try:
            AuditLog.objects.create(
                actor=actor,
                action="post",
                object_type="TransactionJournal",
                object_id=str(journal.id),
                before=None,
                after={"posted": True, "ledger_entry_id": ledger_entry.id},
                reason="Auto-post from expense creation",
            )
        except Exception:
            # non-fatal
            pass

    return ledger_entry


def calculate_profit_loss(booking_id: int):
    """Calculate and persist FinancialRecord for a booking.

    Simple logic:
    - income_amount: use booking.total_in_pkr if set, else booking.total_amount
    - purchase_cost: sum of item costs (hotel, transport, ticket) converted to PKR where needed
    - expenses_amount: sum of Expense entries linked to booking
    - profit_loss = income - purchase_cost - expenses
    """
    try:
        booking = Booking.objects.get(pk=booking_id)
    except Booking.DoesNotExist:
        return None

    # NEW: Check if this is a Package Booking? If so, use STRICT logic.
    if getattr(booking, 'umrah_package', None):
        return calculate_booking_pnl(booking_id)

    # income
    income = Decimal(str(getattr(booking, 'total_in_pkr', None) or getattr(booking, 'total_amount', 0) or 0))

    # purchase cost calculation from booking details
    purchase = Decimal("0.00")

    # hotels
    for h in getattr(booking, 'hotel_details', []).all():
        amt = getattr(h, 'total_in_pkr', None) if getattr(h, 'total_in_pkr', None) is not None else getattr(h, 'total_price', 0)
        if not getattr(h, 'is_price_pkr', True) and getattr(h, 'inventory_owner_organization', None):
            try:
                amt = Decimal(str(convert_sar_to_pkr(amt, h.inventory_owner_organization)))
            except Exception:
                amt = Decimal(str(amt))
        purchase += Decimal(str(amt or 0))

    # transport
    for t in getattr(booking, 'transport_details', []).all():
        amt = getattr(t, 'price_in_pkr', None) if getattr(t, 'price_in_pkr', None) is not None else getattr(t, 'price', 0)
        if not getattr(t, 'is_price_pkr', True) and getattr(t, 'inventory_owner_organization', None):
            try:
                amt = Decimal(str(convert_sar_to_pkr(amt, t.inventory_owner_organization)))
            except Exception:
                amt = Decimal(str(amt))
        purchase += Decimal(str(amt or 0))

    # tickets
    for tk in getattr(booking, 'ticket_details', []).all():
        seats = getattr(tk, 'seats', 0) or 0
        price = getattr(tk, 'adult_price', None) if getattr(tk, 'adult_price', None) is not None else getattr(tk, 'adult_price', 0)
        amt = Decimal(str((price or 0) * seats))
        purchase += amt

    # expenses linked to booking
    exp_qs = Expense.objects.filter(booking_id=booking_id)
    expenses_sum = exp_qs.aggregate(total=Sum('amount'))['total'] or 0
    # convert any SAR expenses — assume Expense.currency set
    expenses_total = Decimal('0.00')
    for e in exp_qs:
        if e.currency and e.currency.upper() == 'SAR':
            try:
                amt = Decimal(str(convert_sar_to_pkr(e.amount, e.organization)))
            except Exception:
                amt = Decimal(str(e.amount))
        else:
            amt = Decimal(str(e.amount))
        expenses_total += amt

    profit = income - purchase - expenses_total

    # Determine service type intelligently - prioritize actual booking contents over booking_type field
    service_type = 'other'
    
    # Check what items exist in the booking
    has_hotel = getattr(booking, 'hotel_details', Booking.objects.none()).exists()
    has_transport = getattr(booking, 'transport_details', Booking.objects.none()).exists()
    has_ticket = getattr(booking, 'ticket_details', Booking.objects.none()).exists()
    has_umrah = getattr(booking, 'umrah_package_id', None) is not None
    
    # Auto-detect from actual booking contents (most accurate)
    if has_umrah:
        service_type = 'umrah'
    elif has_hotel and has_ticket:
        service_type = 'umrah'  # Hotel + ticket usually means Umrah/Hajj package
    elif has_hotel and has_transport:
        service_type = 'hotel'  # Hotel with transport
    elif has_hotel:
        service_type = 'hotel'
    elif has_ticket:
        service_type = 'ticket'
    elif has_transport:
        service_type = 'transport'
    else:
        # Fallback to booking_type field if no items found
        booking_type = getattr(booking, 'booking_type', None)
        if booking_type:
            service_type = str(booking_type).lower()
    
    # Validate service_type is valid
    valid_types = ['hotel', 'visa', 'transport', 'ticket', 'umrah', 'other']
    if service_type not in valid_types:
        service_type = 'other'

    fr, created = FinancialRecord.objects.update_or_create(
        booking_id=booking_id,
        defaults={
            'organization': booking.organization,
            'branch': booking.branch,
            'agent': booking.agency,
            'service_type': service_type,
            'reference_no': booking.booking_number,
            'income_amount': income,
            'purchase_cost': purchase,
            'expenses_amount': expenses_total,
            'profit_loss': profit,
            'currency': 'PKR',
            'metadata': {
                'booking_number': booking.booking_number,
                'linked_booking_id': getattr(booking, 'linked_booking_id', None),
                'has_hotel': getattr(booking, 'hotel_details', []).exists(),
                'has_transport': getattr(booking, 'transport_details', []).exists(),
                'has_ticket': getattr(booking, 'ticket_details', []).exists(),
                'has_umrah_package': getattr(booking, 'umrah_package_id', None) is not None,
            },
        }
    )

    return fr


def aggregate_financials_for_booking(booking_id: int):
    """Return aggregated totals for a booking including any FinancialRecords
    whose metadata.linked_booking_id references this booking.

    Returns a dict: { income_amount, purchase_cost, expenses_amount, profit_loss, count }
    This is a read-time aggregation only and does not modify persisted FinancialRecords.
    """
    from django.db.models import Sum
    qs_main = FinancialRecord.objects.filter(booking_id=booking_id)
    # FRs for walk-ins may reference linked_booking_id in metadata
    qs_linked = FinancialRecord.objects.filter(metadata__linked_booking_id=booking_id)

    agg_main = qs_main.aggregate(
        income=Sum('income_amount'),
        purchase=Sum('purchase_cost'),
        expenses=Sum('expenses_amount'),
        profit=Sum('profit_loss')
    )
    agg_linked = qs_linked.aggregate(
        income=Sum('income_amount'),
        purchase=Sum('purchase_cost'),
        expenses=Sum('expenses_amount'),
        profit=Sum('profit_loss')
    )

    def _val(d, k):
        v = d.get(k) if d else None
        return v or 0

    income = _val(agg_main, 'income') + _val(agg_linked, 'income')
    purchase = _val(agg_main, 'purchase') + _val(agg_linked, 'purchase')
    expenses = _val(agg_main, 'expenses') + _val(agg_linked, 'expenses')
    profit = _val(agg_main, 'profit') + _val(agg_linked, 'profit')

    count = qs_main.count() + qs_linked.count()

    return {
        'income_amount': income,
        'purchase_cost': purchase,
        'expenses_amount': expenses,
        'profit_loss': profit,
        'count': count,

    }


def calculate_booking_pnl(booking_id):
    """
    Calculate Selling Price, Purchase Price, Profit, and Loss for a booking 
    STRICTLY from package prices (per user requirement).
    
    Rules:
      - Source of Truth: UmrahPackage prices only.
      - Pax Logic:
        - Adults: 
             If adult_count == 1 -> use sharing price. 
             If adult_count > 1 -> use room_type price.
        - Children:
             Rule: "use flate prices" -> interpreted as child_without_bed (flat) pricing per instruction.
        - Infants: Use infant_package_selling_price (flat).
      - No add-ons included.
    """
    try:
        # Simplified query to avoid potential relation resolution errors with prefetch
        booking = Booking.objects.get(id=booking_id)
        pkg = booking.umrah_package
        if not pkg:
            return None

        # 1. Classify Pax
        adults = 0
        children = 0
        infants = 0
        
        # Count based on age_group
        for person in booking.person_details.all():
            age = (person.age_group or "").lower()
            if age == 'adult':
                adults += 1
            elif age == 'child':
                children += 1
            elif age == 'infant':
                infants += 1
            else:
                # Default to adult if unspecified
                adults += 1 

        # 2. Determine Room Type
        # Get representative room type from first hotel detail
        room_type = 'sharing'
        first_hotel = booking.hotel_details.first()
        if first_hotel and first_hotel.room_type:
            room_type = first_hotel.room_type.lower()
        
        # 3. Calculate Prices
        
        # Income Source: Direct from Booking Total (per user request)
        total_selling = Decimal(str(booking.total_amount or 0))
        
        # Purchase Cost: Calculated from Package Base Prices
        total_purchase = Decimal('0.00')
        
        # --- ADULTS ---
        # Rule: If adult_count == 1 -> use sharing price
        # Rule: If adult_count > 1 -> use price based on room_type
        
        target_room_type = room_type
        if adults == 1:
            target_room_type = 'sharing' # Force sharing for single pax
        
        # Normalize room type string to match model fields
        # Model fields: sharing_selling_price, double_selling_price, etc.
        valid_types = ['sharing', 'double', 'triple', 'quad', 'quaint']
        if target_room_type not in valid_types:
            # try to map typical variations
            if 'shar' in target_room_type: target_room_type = 'sharing'
            elif 'doub' in target_room_type: target_room_type = 'double'
            elif 'trip' in target_room_type: target_room_type = 'triple'
            elif 'quad' in target_room_type: target_room_type = 'quad'
            elif 'quaint' in target_room_type or 'quint' in target_room_type: target_room_type = 'quaint'
            else: target_room_type = 'sharing' # final fallback
            
        adult_selling_unit = Decimal(getattr(pkg, f"{target_room_type}_selling_price", 0) or 0)
        adult_purchase_unit = Decimal(getattr(pkg, f"{target_room_type}_purchase_price", 0) or 0)
        
        # total_selling is fixed from booking.total_amount
        total_purchase += (adult_purchase_unit * adults)
        
        # --- CHILDREN ---
        # Rule: "use flate prices" -> interpreted as child_without_bed (Extras Only) logic
        # per "child_without_bed -> use flat child price" instruction
        
        child_selling_unit = Decimal(getattr(pkg, "child_without_bed_selling_price", 0) or 0)
        child_purchase_unit = Decimal(getattr(pkg, "child_without_bed_purchase_price", 0) or 0)
        
        total_purchase += (child_purchase_unit * children)
        
        # --- INFANTS ---
        # Rule: Infant flat price
        infant_selling_unit = Decimal(getattr(pkg, "infant_package_selling_price", 0) or 0)
        infant_purchase_unit = Decimal(getattr(pkg, "infant_package_purchase_price", 0) or 0)
        
        total_purchase += (infant_purchase_unit * infants)
        
        # 4. Result
        profit = total_selling - total_purchase
        loss = abs(profit) if profit < 0 else Decimal('0.00')
        
        # JSON Result
        result_json = {
            "booking_id": booking.id,
            "package_id": pkg.id,
            "room_type": target_room_type,
            "adult_count": adults,
            "child_count": children,
            "infant_count": infants,
            "total_selling_price": float(total_selling),
            "total_purchase_price": float(total_purchase),
            "profit": float(profit),
            "loss": float(loss)
        }
        
        # 5. Save to Database (FinancialRecord)
        # We store the "Net Profit" in profit_loss field (can be negative)
        # income definition: total_selling
        # purchase_cost definition: total_purchase
        # expenses: 0 (since we are strictly using package prices, expenses are implicit in purchase cost or ignored per rule "No add-ons")
        
        FinancialRecord.objects.update_or_create(
            booking_id=booking.id,
            defaults={
                'organization_id': booking.organization_id,
                'branch_id': booking.branch_id,
                'agent_id': booking.agency_id,
                'income_amount': total_selling,
                'purchase_cost': total_purchase,
                'expenses_amount': 0, 
                'profit_loss': profit, 
                'metadata': result_json,
                'status': 'active',
                'description': f"Auto-calculated Package P&L for Booking #{booking.booking_number}",
                'service_type': 'umrah'
            }
        )
        
        return result_json

    except Exception as e:
        print(f"Error calculating P&L: {e}")
        return None
