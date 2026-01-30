from django.db.models.signals import pre_save, post_save, post_delete
from django.dispatch import receiver
from django.db import transaction
from django.db.transaction import TransactionManagementError
from django.utils import timezone
from django.db.models import F

from .models import Booking, BookingTicketDetails, Payment
from tickets.models import Ticket
from packages.models import UmrahPackage


def _apply_ticket_changes(ticket_id, booked_delta=0, confirmed_delta=0, left_delta=0):
    """Apply deltas to a Ticket using F expressions inside a transaction for safety."""
    with transaction.atomic():
        qs = Ticket.objects.select_for_update().filter(pk=ticket_id)
        if not qs.exists():
            return
        ticket = qs.first()
        if booked_delta:
            ticket.booked_tickets = F('booked_tickets') + booked_delta
        if confirmed_delta:
            ticket.confirmed_tickets = F('confirmed_tickets') + confirmed_delta
        if left_delta:
            ticket.left_seats = F('left_seats') + left_delta
        ticket.save()


def _apply_package_changes(package_id, booked_delta=0, confirmed_delta=0, left_delta=0):
    with transaction.atomic():
        qs = UmrahPackage.objects.select_for_update().filter(pk=package_id)
        if not qs.exists():
            return
        pkg = qs.first()
        if booked_delta:
            pkg.booked_seats = F('booked_seats') + booked_delta
        if confirmed_delta:
            pkg.confirmed_seats = F('confirmed_seats') + confirmed_delta
        if left_delta:
            pkg.left_seats = F('left_seats') + left_delta
        pkg.save()


@receiver(pre_save, sender=Booking)
def booking_pre_save(sender, instance, **kwargs):
    """Cache previous booking state so post_save can compute diffs."""
    if not instance.pk:
        instance._old_booking = None
        # Set expiry_time for new bookings - ALWAYS override
        if instance.organization_id:
            print(f"[DEBUG] NEW BOOKING DETECTED - org_id: {instance.organization_id}, booking_type: {instance.booking_type}")
            try:
                from packages.models import BookingExpiry
                from datetime import timedelta
                
                # Get booking expiry settings for this organization
                expiry_settings = BookingExpiry.objects.filter(
                    organization_id=instance.organization_id
                ).first()
                
                print(f"[DEBUG] Expiry settings found: {expiry_settings}")
                
                if expiry_settings:
                    # Determine which expiry time to use based on booking_type
                    expiry_minutes = 0
                    booking_type = str(instance.booking_type or '').strip().upper()
                    
                    # Check database values (TICKET, UMRAH, CUSTOM_PACKAGE, PACKAGE)
                    if booking_type in ['TICKET', 'GROUP TICKET']:
                        expiry_minutes = expiry_settings.ticket_expiry_time or 0
                    elif booking_type in ['UMRAH', 'PACKAGE', 'UMRAH PACKAGE']:
                        expiry_minutes = expiry_settings.umrah_expiry_time or 0
                    elif booking_type in ['CUSTOM_PACKAGE', 'CUSTOM PACKAGE']:
                        expiry_minutes = expiry_settings.custom_umrah_expiry_time or 0
                    elif instance.is_public_booking:
                        # Public/customer bookings
                        expiry_minutes = expiry_settings.customer_expiry_time or 0
                    else:
                        # Default fallback
                        expiry_minutes = expiry_settings.ticket_expiry_time or 0
                    
                    print(f"[DEBUG] Calculated expiry_minutes: {expiry_minutes}")
                    
                    # Calculate expiry_time - ALWAYS SET IT
                    if expiry_minutes > 0:
                        instance.expiry_time = timezone.now() + timedelta(minutes=expiry_minutes)
                        print(f"[SUCCESS] Set expiry_time for booking: {expiry_minutes} minutes from now = {instance.expiry_time}")
                    else:
                        print(f"[WARNING] expiry_minutes is 0, not setting expiry_time")
                else:
                    print(f"[WARNING] No expiry settings found for org {instance.organization_id}")
            except Exception as e:
                print(f"[ERROR] ERROR setting expiry_time: {e}")
                import traceback
                traceback.print_exc()
        else:
            print(f"[WARNING] No organization_id on booking")
        return
    try:
        old = Booking.objects.get(pk=instance.pk)
        # cache relevant fields
        instance._old_booking = {
            'status': old.status,
            'total_pax': old.total_pax,
            'ticket_details': list(old.ticket_details.values('ticket_id', 'seats', 'status')),
            'umrah_package_id': old.umrah_package_id,
        }
    except Booking.DoesNotExist:
        instance._old_booking = None


@receiver(post_save, sender=Booking)
def booking_post_save(sender, instance, created, **kwargs):
    """Handle seat updates on booking create/update."""
    # helper to sum seats from booking.ticket_details
    def _sum_ticket_seats(details_qs):
        return sum(d.get('seats', 0) for d in details_qs)

    new_status = instance.status
    new_total_pax = instance.total_pax or 0
    # For ticket seat accounting, count only person_details with ticket_included=True
    try:
        ticket_included_count = instance.person_details.filter(ticket_included=True).count()
    except Exception:
        ticket_included_count = None

    old = getattr(instance, '_old_booking', None)

    # On creation: if pending/unpaid -> mark booked seats
    if created:
        if str(new_status).lower() in ['pending', 'unpaid']:
            # tickets: deduplicate by ticket_id and take max seats
            ticket_seat_map = {}
            # effective pax count fallback if td.seats is missing
            eff_pax = (ticket_included_count if ticket_included_count is not None and ticket_included_count > 0 else 0)
            if eff_pax == 0:
                eff_pax = (instance.total_adult or 0) + (instance.total_child or 0)
            if eff_pax == 0:
                eff_pax = instance.total_pax or 0

            for td in instance.ticket_details.all():
                seats = td.seats if (td.seats and td.seats > 0) else eff_pax
                if seats > 0:
                    curr = ticket_seat_map.get(td.ticket_id, 0)
                    ticket_seat_map[td.ticket_id] = max(curr, seats)
            
            for tid, quantity in ticket_seat_map.items():
                _apply_ticket_changes(tid, booked_delta=quantity, left_delta=-quantity)
            # umrah package: always apply using total_pax
            if instance.umrah_package_id:
                _apply_package_changes(instance.umrah_package_id, booked_delta=new_total_pax, left_delta=-new_total_pax)
        return

    # On update: compare old vs new
    if old:
        old_status = old.get('status')
        old_total_pax = old.get('total_pax') or 0
        old_ticket_details = {d['ticket_id']: d for d in old.get('ticket_details', [])}

        # 2️⃣ Payment / Confirmation: pending/unpaid -> paid/confirmed
        if (str(old_status).lower() in ['pending', 'unpaid']) and (str(new_status).lower() in ['paid', 'confirmed']):
            # for tickets, use ticket_included_count if available
            if ticket_included_count is not None:
                tds = list(instance.ticket_details.all())
                if tds and ticket_included_count > 0:
                    remaining = ticket_included_count
                    for td in tds:
                        assign = min(remaining, td.seats or 0)
                        if assign > 0:
                            _apply_ticket_changes(td.ticket_id, booked_delta=-assign, confirmed_delta=assign)
                            remaining -= assign
                        if remaining <= 0:
                            break
            else:
                for td in instance.ticket_details.all():
                    seats = td.seats or 0
                    if seats > 0:
                        _apply_ticket_changes(td.ticket_id, booked_delta=-seats, confirmed_delta=seats)
            if instance.umrah_package_id:
                _apply_package_changes(instance.umrah_package_id, booked_delta=-new_total_pax, confirmed_delta=new_total_pax)

        # 3️⃣ Cancellation / Expiry
        if str(new_status).lower() in ['cancelled', 'expired']:
            # For tickets: restore left_seats and decrement booked/confirmed depending on old status
            if ticket_included_count is not None:
                tds = list(instance.ticket_details.all())
                if tds and ticket_included_count > 0:
                    remaining = ticket_included_count
                    for td in tds:
                        assign = min(remaining, td.seats or 0)
                        if assign > 0:
                            _apply_ticket_changes(td.ticket_id, left_delta=assign)
                            if str(old_status).lower() in ['pending', 'unpaid']:
                                _apply_ticket_changes(td.ticket_id, booked_delta=-assign)
                            elif str(old_status).lower() in ['paid', 'confirmed']:
                                _apply_ticket_changes(td.ticket_id, confirmed_delta=-assign)
                            remaining -= assign
                        if remaining <= 0:
                            break
            else:
                for td in instance.ticket_details.all():
                    seats = td.seats or 0
                    if seats <= 0:
                        continue
                    # restore availability
                    _apply_ticket_changes(td.ticket_id, left_delta=seats)
                    if str(old_status).lower() in ['pending', 'unpaid']:
                        _apply_ticket_changes(td.ticket_id, booked_delta=-seats)
                    elif str(old_status).lower() in ['paid', 'confirmed']:
                        _apply_ticket_changes(td.ticket_id, confirmed_delta=-seats)
            # Umrah package
            if instance.umrah_package_id:
                _apply_package_changes(instance.umrah_package_id, left_delta=new_total_pax)
                if str(old_status).lower() in ['pending', 'unpaid']:
                    _apply_package_changes(instance.umrah_package_id, booked_delta=-new_total_pax)
                elif str(old_status).lower() in ['paid', 'confirmed']:
                    _apply_package_changes(instance.umrah_package_id, confirmed_delta=-new_total_pax)

        # 4️⃣ Passenger count change (total_pax diff)
        # Check if total_pax is actually being updated
        update_fields = kwargs.get('update_fields')
        should_process_pax = update_fields is None or 'total_pax' in update_fields
        
        pax_diff = new_total_pax - old_total_pax
        if should_process_pax and pax_diff != 0:
            # Positive diff -> reserve more seats (booked +, left -)
            if pax_diff > 0:
                # distribute across umrah package (if exists) and tickets proportionally is complex
                # Simpler: apply to umrah_package if present, else to tickets' first detail
                if instance.umrah_package_id:
                    _apply_package_changes(instance.umrah_package_id, booked_delta=pax_diff, left_delta=-pax_diff)
                else:
                    # allocate to ticket details: add to the first ticket detail
                    td = instance.ticket_details.first()
                    if td:
                        _apply_ticket_changes(td.ticket_id, booked_delta=pax_diff, left_delta=-pax_diff)
            else:
                # reduce reservations
                dec = abs(pax_diff)
                if instance.umrah_package_id:
                    _apply_package_changes(instance.umrah_package_id, booked_delta=-dec, left_delta=dec)
                else:
                    td = instance.ticket_details.first()
                    if td:
                        _apply_ticket_changes(td.ticket_id, booked_delta=-dec, left_delta=dec)


@receiver(post_delete, sender=Booking)
def booking_post_delete(sender, instance, **kwargs):
    """When a booking is deleted, restore seats depending on its status."""
    status = instance.status
    total_pax = instance.total_pax or 0
    # Umrah package
    if instance.umrah_package_id:
        _apply_package_changes(instance.umrah_package_id, left_delta=total_pax)
        if str(status).lower() in ['pending', 'unpaid']:
            _apply_package_changes(instance.umrah_package_id, booked_delta=-total_pax)
        elif str(status).lower() in ['paid', 'confirmed']:
            _apply_package_changes(instance.umrah_package_id, confirmed_delta=-total_pax)



@receiver(post_delete, sender=BookingTicketDetails)
def booking_ticketdetails_post_delete(sender, instance, **kwargs):
    """Adjust ticket counters when a BookingTicketDetails row is deleted (covers cascade deletes)."""
    seats = instance.seats or 0
    if seats <= 0:
        return
    # restore availability
    _apply_ticket_changes(instance.ticket_id, left_delta=seats)
    # prefer booking status (parent) to decide which counters to decrement
    booking_status = getattr(getattr(instance, 'booking', None), 'status', None)
    if booking_status and str(booking_status).lower() in ['pending', 'unpaid']:
        _apply_ticket_changes(instance.ticket_id, booked_delta=-seats)
    elif booking_status and str(booking_status).lower() in ['paid', 'confirmed']:
        _apply_ticket_changes(instance.ticket_id, confirmed_delta=-seats)
    else:
        # fallback: decrement booked_tickets (safer default)
        _apply_ticket_changes(instance.ticket_id, booked_delta=-seats)


# --- Hotel Outsourcing signals ---
@receiver(post_save, sender='booking.HotelOutsourcing')
def hotel_outsourcing_post_save(sender, instance, created, **kwargs):
    """When a HotelOutsourcing is created, create a ledger entry and notify agent."""
    try:
        from organization.ledger_utils import find_account, create_entry_with_lines
        from decimal import Decimal
        # compute amount: price * quantity * nights
        amount = Decimal(str(instance.outsource_cost or 0))

        # find accounts: debit -> SUSPENSE (fallback), credit -> PAYABLE
        debit_acc = find_account(instance.booking.organization_id, ['SUSPENSE'])
        credit_acc = find_account(instance.booking.organization_id, ['PAYABLE'])

        lines = []
        if debit_acc:
            lines.append({'account': debit_acc, 'debit': amount, 'credit': Decimal('0')})
        if credit_acc:
            lines.append({'account': credit_acc, 'debit': Decimal('0'), 'credit': amount})

        # create ledger entry if we have at least one account
        if lines:
            le = create_entry_with_lines(
                booking_no=instance.booking.booking_number,
                service_type='hotel',
                narration=f"Outsourced Hotel for Booking #{instance.booking.booking_number}",
                metadata={'outsourcing_id': instance.id, 'organization': instance.booking.organization_id, 'branch': instance.booking.branch_id},
                internal_notes=[f"Hotel Outsource created by {getattr(instance.created_by, 'username', None)}"],
                created_by=getattr(instance, 'created_by', None),
                lines=lines,
            )
            if le:
                # avoid recursion / nested signal side-effects by updating via queryset
                # this performs a direct UPDATE and does not emit model signals
                instance.__class__.objects.filter(pk=instance.pk).update(
                    ledger_entry_id=le.id,
                    updated_at=timezone.now(),
                )

        # mark booking hotel detail as outsourced already handled by serializer; ensure booking flag set
        try:
            instance.booking.is_outsourced = True
            instance.booking.save(update_fields=['is_outsourced'])
        except Exception:
            pass

        # Agent notification and SystemLog: schedule after transaction commits to
        # avoid performing DB writes inside a broken/ongoing atomic block.
        try:
            agent_id = getattr(instance.booking, 'user_id', None)
            booking_pk = getattr(instance.booking, 'id', None)
            org_id = getattr(instance.booking, 'organization_id', None)
            branch_id = getattr(instance.booking, 'branch_id', None)
            hotel_name = instance.hotel_name

            def _notify_and_log():
                try:
                    # lazy import to avoid circulars
                    from notifications.utils import send_agent_message
                    from logs.models import SystemLog

                    message = f"Your passenger’s hotel has been assigned from an external source: {hotel_name}."
                    sent = send_agent_message(agent_id, message, booking_id=booking_pk)

                    SystemLog.objects.create(
                        action_type="OUTSOURCED_HOTEL_ASSIGNED",
                        model_name="HotelOutsourcing",
                        record_id=instance.id,
                        organization_id=org_id,
                        branch_id=branch_id,
                        user_id=agent_id,
                        description=message,
                        status="success" if sent else "failed",
                    )

                    # mark agent_notified via queryset update to avoid another signal
                    if not instance.agent_notified:
                        instance.__class__.objects.filter(pk=instance.pk).update(agent_notified=True)
                except Exception:
                    # best-effort — do not raise from on_commit callbacks
                    return

            # Try to run immediately. If we are inside a broken/ongoing
            # atomic block, TransactionManagementError will be raised and
            # we schedule the callback to run after commit instead.
            try:
                _notify_and_log()
            except TransactionManagementError:
                try:
                    transaction.on_commit(_notify_and_log)
                except Exception:
                    # last-resort: swallow
                    pass
        except Exception:
            # best-effort — do not block
            pass
    except Exception:
        # swallow to avoid breaking save during migrations
        pass


@receiver(post_delete, sender='booking.HotelOutsourcing')
def hotel_outsourcing_post_delete(sender, instance, **kwargs):
    """When outsourcing is deleted, try to mark ledger as reversed/zeroed (best-effort)."""
    try:
        from organization.ledger_utils import _lazy_models
        Account, LedgerEntry, LedgerLine = _lazy_models()
        if instance.ledger_entry_id and LedgerEntry:
            le = LedgerEntry.objects.filter(pk=instance.ledger_entry_id).first()
            if le and not le.reversed:
                # create a reversing entry
                rev = LedgerEntry.objects.create(
                    booking_no=le.booking_no,
                    service_type=le.service_type,
                    narration=f"Reversal for Outsourcing #{instance.id}",
                    metadata={'reversal_of': le.id},
                    created_by=None,
                )
                # mirror lines reversed
                for l in le.lines.all():
                    LedgerLine.objects.create(
                        ledger_entry=rev,
                        account=l.account,
                        debit=l.credit,
                        credit=l.debit,
                        final_balance=l.final_balance, # best-effort
                    )
                le.reversed = True
                le.reversed_of = rev
                le.save()
    except Exception:
        pass
    

@receiver(post_save, sender=Payment)
def update_booking_paid_status(sender, instance, created, **kwargs):
    """
    Automatically update booking.is_paid when a payment status changes to Completed.
    This ensures the is_paid field is always accurate based on payment status.
    """
    if not instance.booking_id:
        return
    
    try:
        booking = Booking.objects.get(id=instance.booking_id)
        
        # Check if booking has any completed payments
        has_completed_payment = booking.payment_details.filter(status='Completed').exists()
        
        # Update is_paid if it's different
        if booking.is_paid != has_completed_payment:
            booking.is_paid = has_completed_payment
            booking.save(update_fields=['is_paid'])
            
            print(f"[SUCCESS] Updated booking {booking.booking_number} is_paid to {has_completed_payment}")
    except Booking.DoesNotExist:
        pass
    except Exception as e:
        print(f"[ERROR] Error updating booking paid status: {e}")


@receiver(pre_save, sender=Booking)
def capture_old_booking_state(sender, instance, **kwargs):
    """
    Capture the old booking state before saving to detect status changes.
    """
    if instance.pk:
        try:
            old_booking = Booking.objects.get(pk=instance.pk)
            instance._old_booking = {
                'status': old_booking.status,
                'payment_method': old_booking.payment_method,
            }
        except Booking.DoesNotExist:
            instance._old_booking = None
    else:
        instance._old_booking = None


@receiver(post_save, sender=Booking)
def handle_credit_payment_approval(sender, instance, created, **kwargs):
    """
    When a booking with credit payment is approved, deduct from agency credit and create ledger entry.
    """
    # Skip if this is a new booking
    if created:
        return
    
    # Get old booking state
    old = getattr(instance, '_old_booking', None)
    if not old:
        return
    
    old_status = old.get('status')
    new_status = instance.status
    
    # Check if status changed to "Approved"
    if str(old_status).lower() != 'approved' and str(new_status).lower() == 'approved':
        # Check if payment method is credit
        payment_method = getattr(instance, 'payment_method', '')
        if str(payment_method).lower() == 'credit':
            print(f"[CREDIT] Processing credit deduction for booking {instance.booking_number}")
            
            try:
                from organization.models import Agency
                from organization.ledger_utils import find_account, create_entry_with_lines
                from decimal import Decimal
                
                # Get agency
                if not instance.agency_id:
                    print(f"[ERROR] No agency associated with booking {instance.booking_number}")
                    return
                
                agency = Agency.objects.get(id=instance.agency_id)
                booking_amount = Decimal(str(instance.total_amount or 0))
                
                # Validate credit limit
                credit_limit = Decimal(str(agency.credit_limit or 0))
                credit_used = Decimal(str(agency.credit_used or 0))
                available_credit = credit_limit - credit_used
                
                if available_credit < booking_amount:
                    print(f"[ERROR] Insufficient credit for booking {instance.booking_number}. Available: {available_credit}, Required: {booking_amount}")
                    return
                
                # Deduct from agency credit using atomic transaction
                with transaction.atomic():
                    # Update agency credit_used
                    Agency.objects.filter(id=agency.id).update(
                        credit_used=F('credit_used') + booking_amount
                    )
                    
                    # Create ledger entry
                    # Debit: RECEIVABLE (agency owes us)
                    # Credit: SALES (revenue from booking)
                    debit_acc = find_account(instance.organization_id, ['RECEIVABLE'])
                    credit_acc = find_account(instance.organization_id, ['SALES'])
                    
                    lines = []
                    if debit_acc:
                        lines.append({
                            'account': debit_acc,
                            'debit': booking_amount,
                            'credit': Decimal('0'),
                            'agency_id': agency.id
                        })
                    if credit_acc:
                        lines.append({
                            'account': credit_acc,
                            'debit': Decimal('0'),
                            'credit': booking_amount
                        })
                    
                    if lines:
                        service_type = 'ticket' if instance.ticket_details.exists() else (
                            'umrah_package' if instance.umrah_package_id else 'other'
                        )
                        
                        le = create_entry_with_lines(
                            booking_no=instance.booking_number,
                            service_type=service_type,
                            narration=f"Credit Payment for Booking #{instance.booking_number} - {agency.name}",
                            metadata={
                                'booking_id': instance.id,
                                'agency_id': agency.id,
                                'organization': instance.organization_id,
                                'branch': instance.branch_id,
                                'payment_method': 'credit',
                                'credit_limit_days': agency.credit_limit_days
                            },
                            internal_notes=[f"Credit payment approved. Amount: PKR {booking_amount}"],
                            created_by=None,
                            lines=lines,
                        )
                        
                        if le:
                            print(f"[SUCCESS] Credit deducted and ledger entry created for booking {instance.booking_number}")
                            print(f"   Amount: PKR {booking_amount}")
                            print(f"   New credit used: PKR {credit_used + booking_amount}")
                            print(f"   Remaining credit: PKR {available_credit - booking_amount}")
                    else:
                        print(f"[WARNING] Could not find RECEIVABLE or SALES accounts for ledger entry")
                        
            except Agency.DoesNotExist:
                print(f"[ERROR] Agency not found for booking {instance.booking_number}")
            except Exception as e:
                print(f"[ERROR] Error processing credit deduction: {e}")
                import traceback
                traceback.print_exc()

