
from django.db.models.signals import post_save
from django.dispatch import receiver
from booking.models import Payment
from .models import Account, LedgerEntry, LedgerLine
from decimal import Decimal
from django.db import transaction
from ledger.currency_utils import convert_sar_to_pkr


@receiver(post_save, sender=Payment)
def auto_post_payment(sender, instance: Payment, created, **kwargs):
    """
    Auto-post a simple ledger entry for completed payments.
    This is a conservative default: only posts when Payment.status == 'Completed'
    and both a payer account (agent) and receiver account (organization) exist.
    """
    # only post for completed payments
    try:
        if not instance.status or instance.status.lower() != "completed":
            return
    except Exception:
        return

    # idempotency: if we've already posted this payment, skip
    try:
        if LedgerEntry.objects.filter(metadata__contains={"payment_id": instance.id}).exists():
            return
    except Exception:
        # if metadata query fails for some DB backends, continue and rely on later checks
        pass

    # Multi-org atomic posting: group booking items by inventory_owner_organization
    booking = instance.booking
    if not booking:
        return

    # Collect all booking items with inventory_owner_organization
    hotel_items = list(getattr(booking, "hotel_details", []).all())
    transport_items = list(getattr(booking, "transport_details", []).all())
    ticket_items = list(getattr(booking, "ticket_details", []).all())
    # Add more item types as needed
    all_items = hotel_items + transport_items + ticket_items
    # Group by owner org
    from collections import defaultdict
    org_items = defaultdict(list)
    for item in all_items:
        if item.inventory_owner_organization_id:
            org_items[item.inventory_owner_organization_id].append(item)

    # If no items with owner org, fallback to posting full payment to booking.organization
    if not org_items:
        # If booking has an organization, post the full payment amount to that org
        if getattr(booking, 'organization_id', None):
            org_items[int(booking.organization_id)] = None
        else:
            return

    # Agent / Agency account (payer)
    agent_account = None
    if instance.agency_id:
        agent_account = Account.objects.filter(agency_id=instance.agency_id).first()
        if not agent_account:
            try:
                agent_account = Account.objects.create(
                    name=f"Agent - agency {instance.agency_id}",
                    account_type="AGENT",
                    agency_id=instance.agency_id,
                    balance=Decimal("0.00"),
                )
            except Exception:
                agent_account = None

    # If no agency specified, attempt to use a global AGENT account (agency__isnull)
    if not agent_account:
        agent_account = Account.objects.filter(account_type="AGENT", agency__isnull=True).first()

    if not agent_account:
        return

    # Calculate total per owner org (sum item total_price or price fields)
    def get_item_amount(item):
        # If item has is_price_pkr and it's False, convert from SAR to PKR
        amount = getattr(item, "total_price", None) or getattr(item, "price", 0)
        is_price_pkr = getattr(item, "is_price_pkr", True)
        # Try to get organization from item or booking
        org = None
        if hasattr(item, "inventory_owner_organization") and getattr(item, "inventory_owner_organization", None):
            org = item.inventory_owner_organization
        elif hasattr(booking, "organization"):
            org = booking.organization
        if not is_price_pkr and org:
            try:
                amount = convert_sar_to_pkr(amount, org)
            except Exception:
                pass
        return amount

    with transaction.atomic():
        involved_accounts = [agent_account.pk]
        for owner_org_id, items in org_items.items():
            org_account = Account.objects.filter(organization_id=owner_org_id).first()
            if not org_account:
                try:
                    org_account = Account.objects.create(
                        name=f"Sales - org {owner_org_id}",
                        account_type="SALES",
                        organization_id=owner_org_id,
                        balance=Decimal("0.00"),
                    )
                except Exception:
                    continue
            involved_accounts.append(org_account.pk)

        # Lock all involved accounts
        Account.objects.select_for_update().filter(pk__in=involved_accounts)

        for owner_org_id, items in org_items.items():
            org_account = Account.objects.filter(organization_id=owner_org_id).first()
            if not org_account:
                continue
            # Sum all item amounts for this owner org. If items is None (fallback), use payment amount.
            if not items:
                amount = Decimal(str(getattr(instance, 'amount', 0) or 0))
            else:
                amount = sum(Decimal(str(get_item_amount(item) or 0)) for item in items)
            if amount <= 0:
                continue
            # Create ledger entry
            # Compose audit note
            # Use 'date' field from Payment instead of non-existent 'created_at'
            payment_time = getattr(instance, 'date', None)
            payment_time_str = payment_time.strftime('%Y-%m-%d %H:%M:%S') if payment_time else 'N/A'
            audit_note = f"Auto-posted payment for org {owner_org_id} via Payment id {instance.id} by agent {instance.agent_id} at {payment_time_str}"
            entry = LedgerEntry.objects.create(
                booking_no=(booking.booking_number if booking else None),
                service_type="payment",
                narration=f"Payment for inventory owner org {owner_org_id}",
                metadata={"payment_id": instance.id, "owner_org_id": owner_org_id},
                internal_notes=[audit_note],
            )
            # Debit agent (payer)
            agent_account.balance = agent_account.balance + amount
            agent_account.save()
            LedgerLine.objects.create(
                ledger_entry=entry,
                account=agent_account,
                debit=amount,
                credit=Decimal("0.00"),
                final_balance=agent_account.balance,
            )
            # Credit owner org (receiver)
            org_account.balance = org_account.balance - amount
            org_account.save()
            LedgerLine.objects.create(
                ledger_entry=entry,
                account=org_account,
                debit=Decimal("0.00"),
                credit=amount,
                final_balance=org_account.balance,
            )
