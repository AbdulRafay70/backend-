from decimal import Decimal


def _lazy_models():
    """Lazy import ledger models to avoid app registry /circular import issues."""
    try:
        from ledger.models import Account, LedgerEntry, LedgerLine
        return Account, LedgerEntry, LedgerLine
    except Exception:
        return None, None, None


def find_account(org_id, account_type_choices):
    """Return first Account matching organization scope then global fallback.

    org_id may be None to prefer global scoped accounts.
    """
    Account, LedgerEntry, LedgerLine = _lazy_models()
    if not Account:
        return None

    if org_id is not None:
        acc = Account.objects.filter(organization_id=org_id, account_type__in=account_type_choices).first()
        if acc:
            return acc

    # fallback to global (organization__isnull=True)
    return Account.objects.filter(organization__isnull=True, account_type__in=account_type_choices).first()


def create_entry_with_lines(booking_no, service_type, narration, metadata, internal_notes, created_by, lines, organization=None):
    """Create a LedgerEntry and LedgerLines, update account balances.

    `lines` is an iterable of dicts: {'account': Account, 'debit': Decimal, 'credit': Decimal}
    `organization` is the Organization instance for this entry (optional, will be inferred from accounts if not provided)

    Returns the created LedgerEntry or None if ledger models unavailable.
    """
    Account, LedgerEntry, LedgerLine = _lazy_models()
    if not LedgerEntry:
        return None

    # If organization not provided, try to infer from the first account
    if organization is None and lines:
        first_account = lines[0].get('account')
        if first_account and hasattr(first_account, 'organization'):
            organization = first_account.organization

    entry = LedgerEntry.objects.create(
        booking_no=booking_no,
        service_type=service_type,
        narration=narration,
        metadata=metadata or {},
        internal_notes=internal_notes or [],
        created_by=created_by,
        organization=organization,
    )

    for l in lines:
        acc = l.get('account')
        debit = Decimal(str(l.get('debit') or 0))
        credit = Decimal(str(l.get('credit') or 0))

        # compute final balance as previous + debit - credit (matches existing conventions)
        prev = acc.balance or Decimal('0')
        final = prev + debit - credit

        LedgerLine.objects.create(
            ledger_entry=entry,
            account=acc,
            debit=debit,
            credit=credit,
            final_balance=final,
        )

        acc.balance = final
        acc.save()

    return entry


def mark_entry_settled(entry_id, by_user=None, settled=True):
    """Mark a LedgerEntry's metadata settled flag to True/False."""
    Account, LedgerEntry, LedgerLine = _lazy_models()
    if not LedgerEntry:
        return None
    le = LedgerEntry.objects.filter(pk=entry_id).first()
    if not le:
        return None
    meta = le.metadata or {}
    meta['settled'] = bool(settled)
    if by_user:
        meta['settled_by'] = getattr(by_user, 'id', by_user)
    le.metadata = meta
    le.save()
    return le


def create_settlement_entry(source_entry, amount, booking=None, org=None, branch=None, trn_type='credit', created_by=None):
    """Create a settlement ledger entry that settles a payable.

    Creates a LedgerEntry that debits Payable and credits Cash/Bank for `amount`.
    Links metadata to the source_entry id for traceability.
    Returns the created LedgerEntry or None.
    """
    from decimal import Decimal
    Account, LedgerEntry, LedgerLine = _lazy_models()
    if not LedgerEntry or not Account:
        return None

    amt = Decimal(str(amount or 0))
    if amt == 0:
        return None

    # find payable account and prefer cash then bank for credit
    payable_acc = find_account(org, ['PAYABLE'])
    cash_acc = find_account(org, ['CASH']) or find_account(org, ['BANK'])
    if not payable_acc or not cash_acc:
        return None

    narration = f"Settlement for LedgerEntry #{getattr(source_entry, 'id', source_entry)}"
    metadata = {'settlement_of': getattr(source_entry, 'id', source_entry), 'organization': org, 'branch': branch}

    lines = [
        {'account': payable_acc, 'debit': amt, 'credit': Decimal('0')},
        {'account': cash_acc, 'debit': Decimal('0'), 'credit': amt},
    ]

    le = create_entry_with_lines(
        booking_no=getattr(booking, 'booking_number', None) if booking else None,
        service_type='settlement',
        narration=narration,
        metadata=metadata,
        internal_notes=[f"Settlement for outsourcing {getattr(source_entry, 'id', source_entry)}"],
        created_by=created_by,
        lines=lines,
    )

    # mark source entry metadata as settled
    try:
        if le:
            src = LedgerEntry.objects.filter(pk=getattr(source_entry, 'id', source_entry)).first()
            if src:
                meta = src.metadata or {}
                meta['settled'] = True
                src.metadata = meta
                src.save()
    except Exception:
        pass

    return le


def create_reversal_entry(source_entry, reason='Reversal'):
    """Create a reversing LedgerEntry for the provided source entry (mirror lines).

    Returns the reversal entry or None.
    """
    Account, LedgerEntry, LedgerLine = _lazy_models()
    if not LedgerEntry:
        return None

    src = LedgerEntry.objects.filter(pk=getattr(source_entry, 'id', source_entry)).first()
    if not src:
        return None

    rev = LedgerEntry.objects.create(
        booking_no=src.booking_no,
        service_type=src.service_type,
        narration=f"Reversal: {reason} for entry #{src.id}",
        metadata={'reversal_of': src.id},
        created_by=None,
    )

    # mirror lines reversed
    for l in src.lines.all():
        LedgerLine.objects.create(
            ledger_entry=rev,
            account=l.account,
            debit=l.credit,
            credit=l.debit,
            final_balance=l.final_balance,
        )

    src.reversed = True
    src.reversed_of = rev
    src.save()
    return rev
