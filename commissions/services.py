from typing import List, Tuple

from .models import CommissionRule
from decimal import Decimal
from django.db import transaction
from logs.models import SystemLog


def redeem_commission(earning, created_by=None):
    """
    Redeem a CommissionEarning by creating a LedgerEntry and LedgerLines.

    This function is intentionally conservative:
    - It's idempotent: if earning.redeemed is True, it returns existing ledger_tx_ref.
    - It attempts to find appropriate accounts (COMMISSION and CASH/BANK) within
      the earning's organization/branch/agency scope. Falls back to any account.

    Returns: ledger_entry.id (int) on success, None on failure.
    """
    from ledger.models import LedgerEntry, LedgerLine, Account
    from django.utils import timezone

    # Use an atomic transaction and row-level locks where possible to make this
    # operation safe under concurrent runs. We reload the earning with
    # select_for_update to ensure only one worker redeems it.
    if not getattr(earning, "pk", None):
        # ensure we have a persisted earning object
        raise ValueError("earning must be a saved CommissionEarning instance")

    amount = Decimal(earning.commission_amount or 0)
    if amount <= 0:
        return None

    with transaction.atomic():
        # Lock the earning row to prevent concurrent redemption
        EarningModel = earning.__class__
        locked_earning = EarningModel.objects.select_for_update().get(pk=earning.pk)

        # Idempotency: if already redeemed, return existing ref
        if getattr(locked_earning, "redeemed", False):
            return locked_earning.ledger_tx_ref

        # Try to locate accounts using select_for_update where supported
        commission_account = None
        payment_account = None

        e_branch = getattr(locked_earning, "branch_id", None)
        e_agency = getattr(locked_earning, "agency_id", None)
        e_org = getattr(locked_earning, "organization_id", None)

        # Helper to query with locking
        def _first_account(qs):
            try:
                return qs.select_for_update().first()
            except Exception:
                # Some DB backends (SQLite) ignore select_for_update; fallback
                return qs.first()

        if e_branch:
            commission_account = _first_account(Account.objects.filter(branch_id=e_branch, account_type="COMMISSION"))
            payment_account = _first_account(Account.objects.filter(branch_id=e_branch, account_type__in=("CASH", "BANK")))
        if not commission_account and e_agency:
            commission_account = _first_account(Account.objects.filter(agency_id=e_agency, account_type="COMMISSION"))
            payment_account = payment_account or _first_account(Account.objects.filter(agency_id=e_agency, account_type__in=("CASH", "BANK")))
        if not commission_account and e_org is not None:
            commission_account = _first_account(Account.objects.filter(organization_id=e_org, account_type="COMMISSION"))
            payment_account = payment_account or _first_account(Account.objects.filter(organization_id=e_org, account_type__in=("CASH", "BANK")))

        # Final fallback: any commission account / cash account
        commission_account = commission_account or _first_account(Account.objects.filter(account_type="COMMISSION"))
        payment_account = payment_account or _first_account(Account.objects.filter(account_type__in=("CASH", "BANK")))

        if not commission_account or not payment_account:
            # Nothing we can do here; let caller handle None
            return None

        # Create ledger entry
        ledger_entry = LedgerEntry.objects.create(
            booking_no=str(locked_earning.booking_id) if locked_earning.booking_id else None,
            service_type="commission",
            narration=f"Commission payout for earning {locked_earning.id}",
            created_by=created_by,
            creation_datetime=timezone.now(),
            metadata={"commission_earning_id": locked_earning.id},
        )

        # Debit payment_account, Credit commission_account and update balances
        LedgerLine.objects.create(
            ledger_entry=ledger_entry,
            account=payment_account,
            debit=amount,
            credit=Decimal("0.00"),
            final_balance=payment_account.balance - amount,
        )
        LedgerLine.objects.create(
            ledger_entry=ledger_entry,
            account=commission_account,
            debit=Decimal("0.00"),
            credit=amount,
            final_balance=commission_account.balance + amount,
        )

        # persist account balance changes
        payment_account.balance = payment_account.balance - amount
        commission_account.balance = commission_account.balance + amount
        payment_account.save()
        commission_account.save()

        # Update earning
        locked_earning.redeemed = True
        locked_earning.redeemed_date = timezone.now()
        locked_earning.status = getattr(locked_earning, "status", "paid")
        locked_earning.ledger_tx_ref = f"ledger:{ledger_entry.id}"
        locked_earning.save()

        # Create system log for redemption
        try:
            SystemLog.objects.create(
                action_type="commission:redeem",
                model_name="CommissionEarning",
                record_id=locked_earning.id,
                organization_id=getattr(locked_earning, "organization_id", None),
                branch_id=getattr(locked_earning, "branch_id", None),
                agency_id=getattr(locked_earning, "agency_id", None),
                user_id=getattr(created_by, "id", None) if created_by is not None else None,
                description=f"Redeemed commission earning {locked_earning.id} via ledger {ledger_entry.id}",
                status="success",
                new_data={"ledger_entry_id": ledger_entry.id, "amount": str(amount)},
            )
        except Exception:
            # Do not fail the transaction for logging issues
            pass

        return ledger_entry.id


def evaluate_rules_for_booking(booking) -> List[Tuple[CommissionRule, float]]:
    """
    Given a booking instance, return a list of (rule, commission_amount) tuples
    that should be created for this booking.

    This is a simple implementation:
    - Find active rules
    - Match by product_id or inventory_item_id if present on booking
    - If rule is percent, compute percentage of booking.total_amount (fallback to 0)
    - If rule is flat, use rule.commission_amount

    Returns an empty list if no rules match.
    """
    matches = []
    try:
        total_amount = float(getattr(booking, "total_amount", 0) or 0)
        product_id = getattr(booking, "product_id", None)
        inventory_item_id = getattr(booking, "inventory_item_id", None)

        qs = CommissionRule.objects.filter(active=True)

        for rule in qs:
            # Match by product or inventory if rule specifies them
            if rule.product_id and product_id is not None and int(rule.product_id) != int(product_id):
                continue
            if rule.inventory_item_id and inventory_item_id is not None and int(rule.inventory_item_id) != int(inventory_item_id):
                continue

            # Check min/max thresholds
            if rule.min_amount is not None and total_amount < float(rule.min_amount):
                continue
            if rule.max_amount is not None and total_amount > float(rule.max_amount):
                continue

            # commission_type is expected to be 'percentage' or 'flat'
            if (rule.commission_type or "").lower() == "percentage":
                # commission_value stores the percent (e.g. 5.0 means 5%)
                amount = (float(rule.commission_value) / 100.0) * total_amount
            else:
                amount = float(rule.commission_value)

            # Allow zero amounts to be ignored
            if amount > 0:
                matches.append((rule, amount))
    except Exception:
        # keep evaluation non-fatal
        import traceback

        traceback.print_exc()

    return matches
