"""
Ledger utility functions for inter-organizational transactions.
Handles dual ledger entry creation for reseller bookings.
"""

from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from organization.models import Organization
from ledger.models import LedgerEntry, LedgerLine, Account


def get_or_create_interorg_account(organization, contra_org, account_type):
    """
    Get or create an inter-organizational account.
    
    Args:
        organization: The organization that owns this account
        contra_org: The other organization (reseller or owner)
        account_type: 'PAYABLE' or 'RECEIVABLE'
    
    Returns:
        Account object
    """
    if account_type == 'PAYABLE':
        account_name = f"Accounts Payable - {contra_org.name}"
    elif account_type == 'RECEIVABLE':
        account_name = f"Accounts Receivable - {contra_org.name}"
    else:
        raise ValueError(f"Invalid account_type: {account_type}")
    
    account, created = Account.objects.get_or_create(
        organization=organization,
        name=account_name,
        account_type=account_type,
        defaults={
            'balance': Decimal('0.00')
        }
    )
    
    return account


def get_or_create_account(organization, account_name, account_type):
    """
    Get or create a simple account for an organization.
    
    Args:
        organization: Organization object
        account_name: Name of the account
        account_type: Type from Account.ACCOUNT_TYPE_CHOICES
    
    Returns:
        Account object
    """
    account, created = Account.objects.get_or_create(
        organization=organization,
        name=account_name,
        account_type=account_type,
        defaults={
            'balance': Decimal('0.00')
        }
    )
    
    return account


@transaction.atomic
def create_interorg_ledger_entries(booking, reseller_org_id, owner_org_id, amount, service_type='hotel'):
    """
    Create dual ledger entries for inter-organizational reseller transactions.
    
    When Org 44 (reseller) books Org 11's (owner) inventory:
    
    Reseller's Books (Org 44):
        DR: Customer Receivable        X
        CR: Accounts Payable - Org 11        X
    
    Owner's Books (Org 11):
        DR: Accounts Receivable - Org 44     X
        CR: Revenue - Reseller Sales          X
    
    Args:
        booking: Booking object
        reseller_org_id: ID of reseller organization (e.g., 44)
        owner_org_id: ID of owner organization (e.g., 11)
        amount: Transaction amount
        service_type: 'hotel', 'ticket', 'package', etc.
    
    Returns:
        tuple: (reseller_ledger_entry, owner_ledger_entry)
    """
    
    # Get organizations
    try:
        reseller_org = Organization.objects.get(id=reseller_org_id)
        owner_org = Organization.objects.get(id=owner_org_id)
    except Organization.DoesNotExist as e:
        raise ValueError(f"Invalid organization ID: {e}")
    
    amount = Decimal(str(amount))
    
    # === RESELLER'S LEDGER ENTRY ===
    reseller_entry = LedgerEntry.objects.create(
        reference_no=booking.booking_number,
        booking_no=booking.booking_number,
        booking=booking,
        transaction_type='debit',
        service_type=service_type,
        narration=f"Reselling {owner_org.name}'s {service_type} package - {booking.booking_number}",
        remarks=f"Inter-org: Payable to {owner_org.name} (credit purchase)",
        organization=reseller_org,
        branch=getattr(booking, 'branch', None),
        agency=getattr(booking, 'agency', None),
        seller_organization=reseller_org,
        inventory_owner_organization=owner_org,
        transaction_amount=amount,
        created_by=getattr(booking, 'created_by', None),
    )
    
    # Reseller's accounts
    customer_receivable = get_or_create_account(
        reseller_org,
        "Customer Receivable",
        "RECEIVABLE"
    )
    
    payable_to_owner = get_or_create_interorg_account(
        reseller_org,
        owner_org,
        "PAYABLE"
    )
    
    # Create ledger lines for reseller
    # DR: Customer Receivable
    customer_receivable.balance += amount
    LedgerLine.objects.create(
        ledger_entry=reseller_entry,
        account=customer_receivable,
        debit=amount,
        credit=Decimal('0.00'),
        balance_after=customer_receivable.balance,
        remarks=f"Customer booking via reseller - {booking.booking_number}"
    )
    customer_receivable.save()
    
    # CR: Accounts Payable - Owner Org
    payable_to_owner.balance -= amount  # Payable increases by crediting (negative balance)
    LedgerLine.objects.create(
        ledger_entry=reseller_entry,
        account=payable_to_owner,
        debit=Decimal('0.00'),
        credit=amount,
        balance_after=payable_to_owner.balance,
        remarks=f"Liability to {owner_org.name} for inventory"
    )
    payable_to_owner.save()
    
    # === OWNER'S LEDGER ENTRY ===
    owner_entry = LedgerEntry.objects.create(
        reference_no=booking.booking_number,
        booking_no=booking.booking_number,
        booking=booking,
        transaction_type='credit',
        service_type=service_type,
        narration=f"Sold {service_type} package to {reseller_org.name} - {booking.booking_number}",
        remarks=f"Inter-org: Receivable from {reseller_org.name} (credit sale)",
        organization=owner_org,
        seller_organization=reseller_org,
        inventory_owner_organization=owner_org,
        transaction_amount=amount,
        created_by=getattr(booking, 'created_by', None),
    )
    
    # Owner's accounts
    receivable_from_reseller = get_or_create_interorg_account(
        owner_org,
        reseller_org,
        "RECEIVABLE"
    )
    
    revenue_reseller_sales = get_or_create_account(
        owner_org,
        "Revenue - Reseller Sales",
        "SALES"
    )
    
    # Create ledger lines for owner
    # DR: Accounts Receivable - Reseller Org
    receivable_from_reseller.balance += amount  # Receivable increases by debiting
    LedgerLine.objects.create(
        ledger_entry=owner_entry,
        account=receivable_from_reseller,
        debit=amount,
        credit=Decimal('0.00'),
        balance_after=receivable_from_reseller.balance,
        remarks=f"Receivable from {reseller_org.name} for inventory resale"
    )
    receivable_from_reseller.save()
    
    # CR: Revenue - Reseller Sales
    revenue_reseller_sales.balance -= amount  # Revenue increases by crediting (negative balance)
    LedgerLine.objects.create(
        ledger_entry=owner_entry,
        account=revenue_reseller_sales,
        debit=Decimal('0.00'),
        credit=amount,
        balance_after=revenue_reseller_sales.balance,
        remarks=f"Revenue from {reseller_org.name} reselling our inventory"
    )
    revenue_reseller_sales.save()
    
    return (reseller_entry, owner_entry)


@transaction.atomic
def create_interorg_payment_ledger_entries(payment):
    """
    Create ledger entries for an inter-organizational payment settlement.
    
    When Org 44 pays Org 11:
    
    Reseller's Books (Org 44):
        DR: Accounts Payable - Org 11    X
        CR: Bank/Cash                     X
    
    Owner's Books (Org 11):
        DR: Bank/Cash                     X
        CR: Accounts Receivable - Org 44  X
    
    Args:
        payment: InterOrgPayment object
    
    Returns:
        tuple: (reseller_ledger_entry, owner_ledger_entry)
    """
    from ledger.models import InterOrgPayment
    
    if not isinstance(payment, InterOrgPayment):
        raise TypeError("payment must be an InterOrgPayment instance")
    
    amount = payment.amount
    reseller_org = payment.from_organization
    owner_org = payment.to_organization
    
    # === RESELLER'S LEDGER ENTRY (Org 44) ===
    reseller_entry = LedgerEntry.objects.create(
        reference_no=payment.payment_number,
        transaction_type='debit',
        service_type='payment',
        narration=f"Payment to {owner_org.name} - {payment.payment_number}",
        remarks=f"Inter-org payment settlement ({payment.payment_method})",
        organization=reseller_org,
        transaction_amount=amount,
        created_by=payment.created_by,
    )
    
    # Reseller's accounts
    payable_to_owner = get_or_create_interorg_account(
        reseller_org,
        owner_org,
        "PAYABLE"
    )
    
    bank_account = get_or_create_account(
        reseller_org,
        "Bank Account" if payment.payment_method == 'bank_transfer' else "Cash",
        "BANK" if payment.payment_method == 'bank_transfer' else "CASH"
    )
    
    # DR: Accounts Payable (reduces liability)
    payable_to_owner.balance += amount  # Debit increases balance (reduces the negative payable)
    LedgerLine.objects.create(
        ledger_entry=reseller_entry,
        account=payable_to_owner,
        debit=amount,
        credit=Decimal('0.00'),
        balance_after=payable_to_owner.balance,
        remarks=f"Payment to {owner_org.name} - {payment.reference_number}"
    )
    payable_to_owner.save()
    
    # CR: Bank/Cash (reduces asset)
    bank_account.balance -= amount  # Credit reduces bank balance
    LedgerLine.objects.create(
        ledger_entry=reseller_entry,
        account=bank_account,
        debit=Decimal('0.00'),
        credit=amount,
        balance_after=bank_account.balance,
        remarks=f"Payment via {payment.payment_method} - {payment.reference_number}"
    )
    bank_account.save()
    
    # === OWNER'S LEDGER ENTRY (Org 11) ===
    owner_entry = LedgerEntry.objects.create(
        reference_no=payment.payment_number,
        transaction_type='credit',
        service_type='payment',
        narration=f"Payment received from {reseller_org.name} - {payment.payment_number}",
        remarks=f"Inter-org payment settlement ({payment.payment_method})",
        organization=owner_org,
        transaction_amount=amount,
        created_by=payment.created_by,
    )
    
    # Owner's accounts
    receivable_from_reseller = get_or_create_interorg_account(
        owner_org,
        reseller_org,
        "RECEIVABLE"
    )
    
    owner_bank_account = get_or_create_account(
        owner_org,
        "Bank Account" if payment.payment_method == 'bank_transfer' else "Cash",
        "BANK" if payment.payment_method == 'bank_transfer' else "CASH"
    )
    
    # DR: Bank/Cash (increases asset)
    owner_bank_account.balance += amount  # Debit increases bank balance
    LedgerLine.objects.create(
        ledger_entry=owner_entry,
        account=owner_bank_account,
        debit=amount,
        credit=Decimal('0.00'),
        balance_after=owner_bank_account.balance,
        remarks=f"Payment received from {reseller_org.name} - {payment.reference_number}"
    )
    owner_bank_account.save()
    
    # CR: Accounts Receivable (reduces receivable)
    receivable_from_reseller.balance -= amount  # Credit reduces receivable balance
    LedgerLine.objects.create(
        ledger_entry=owner_entry,
        account=receivable_from_reseller,
        debit=Decimal('0.00'),
        credit=amount,
        balance_after=receivable_from_reseller.balance,
        remarks=f"Payment from {reseller_org.name} - {payment.reference_number}"
    )
    receivable_from_reseller.save()
    
    # Link the ledger entry to the payment
    payment.ledger_entry = reseller_entry
    payment.save()
    
    return (reseller_entry, owner_entry)
