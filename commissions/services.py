from typing import List, Tuple

from .models import CommissionRule
from decimal import Decimal
from django.db import transaction
from logs.models import SystemLog


def redeem_commission(earning, created_by=None):
    """
    Redeem a CommissionEarning by creating a LedgerEntry and LedgerLines.
    Modified to handle Payouts (Dr Commission Expense, Cr Cash/Bank) and properly context bookings.
    Now includes SAFE FALLBACK for Organization ID to prevent 500 errors.
    """
    from ledger.models import LedgerEntry, LedgerLine, Account
    from organization.models import Organization
    from django.utils import timezone
    try:
        from booking.models import Booking
    except ImportError:
         Booking = None

    if not getattr(earning, "pk", None):
        raise ValueError("earning must be a saved CommissionEarning instance")

    amount = Decimal(earning.commission_amount or 0)
    if amount <= 0:
        return None

    with transaction.atomic():
        EarningModel = earning.__class__
        try:
            locked_earning = EarningModel.objects.select_for_update().get(pk=earning.pk)
        except EarningModel.DoesNotExist:
            return None

        if getattr(locked_earning, "redeemed", False):
            return locked_earning.ledger_tx_ref

        # 1. Determine Context
        booking = None
        if locked_earning.booking_id and Booking:
            try:
                booking = Booking.objects.get(pk=locked_earning.booking_id)
            except Booking.DoesNotExist:
                pass
        
        e_branch_id = getattr(booking, 'branch_id', None) if booking else None
        e_org_id = getattr(booking, 'organization_id', None) if booking else None
        
        # 2. Find Accounts
        commission_account = None
        payment_account = None

        def _first_account(qs):
            try:
                return qs.select_for_update().first()
            except Exception:
                return qs.first()

        scope_kwargs = {}
        if e_branch_id:
            scope_kwargs['branch_id'] = e_branch_id
        elif e_org_id:
            scope_kwargs['organization_id'] = e_org_id

        # Determine Organization ID early for creating accounts if needed
        if not e_org_id:
             first_org = Organization.objects.first()
             if first_org:
                 e_org_id = first_org.id
        
        # Find Commission Account (Expense)
        # Try scoped first
        commission_account = _first_account(Account.objects.filter(account_type="COMMISSION", **scope_kwargs))
        if not commission_account and e_org_id:
             # Try Org scope if branch failed
             commission_account = _first_account(Account.objects.filter(account_type="COMMISSION", organization_id=e_org_id))
        if not commission_account:
             # Global fallback
             commission_account = _first_account(Account.objects.filter(account_type="COMMISSION"))

        # AUTO-CREATE if missing
        if not commission_account:
             if not e_org_id:
                  # Critical if no org
                  print("[Commission Redeem] Cannot create account without Organization.")
                  return None
                  
             commission_account = Account.objects.create(
                 name="Default Commission Expense",
                 account_type="COMMISSION",
                 organization_id=e_org_id,
                 balance=Decimal("0.00")
             )
             print(f"[Commission Redeem] Created default Commission Account: {commission_account}")

        # Find Payment Account (Cash/Bank) - Source of Funds
        payment_account = _first_account(Account.objects.filter(account_type__in=("CASH", "BANK"), **scope_kwargs))
        if not payment_account and e_org_id:
             payment_account = _first_account(Account.objects.filter(account_type__in=("CASH", "BANK"), organization_id=e_org_id))
        if not payment_account:
             payment_account = _first_account(Account.objects.filter(account_type__in=("CASH", "BANK")))
             
        # AUTO-CREATE if missing
        if not payment_account:
             if not e_org_id:
                  return None
                  
             payment_account = Account.objects.create(
                 name="Office Cash",
                 account_type="CASH",
                 organization_id=e_org_id,
                 balance=Decimal("0.00")
             )
             print(f"[Commission Redeem] Created default Payment Account: {payment_account}")

        if not commission_account or not payment_account:
             # Should be impossible now unless org is missing
             print(f"[Commission Redeem] Failed to get accounts even after creation attempt.")
             return None
            
        # SAFETY CHECK: Ensure we have an Organization ID (Mandatory for LedgerEntry)
        if not e_org_id:
            e_org_id = getattr(commission_account, 'organization_id', None)
        
        if not e_org_id:
             e_org_id = getattr(payment_account, 'organization_id', None)
             
        if not e_org_id:
            # Fallback to first available organization (Head Office)
            first_org = Organization.objects.first()
            if first_org:
                e_org_id = first_org.id
                
        if not e_org_id:
            # Cannot proceed without an organization
            print("[Commission Redeem] CRITICAL FAULT: No Organization found for LedgerEntry.")
            return None

        # 3. Create Ledger Entry
        ledger_entry = LedgerEntry.objects.create(
            organization_id=e_org_id, # Explicitly provided
            booking_no=str(locked_earning.booking_id) if locked_earning.booking_id else None,
            service_type="commission",
            transaction_type="debit",
            narration=f"Commission Payout ({locked_earning.earned_by_type})",
            created_by=created_by,
            creation_datetime=timezone.now(),
            metadata={"commission_earning_id": locked_earning.id},
        )

        # Debit Commission Account
        LedgerLine.objects.create(
            ledger_entry=ledger_entry,
            account=commission_account,
            debit=amount,
            credit=Decimal("0.00"),
            final_balance=commission_account.balance + amount,
        )
        
        # Credit Payment Account
        LedgerLine.objects.create(
            ledger_entry=ledger_entry,
            account=payment_account,
            debit=Decimal("0.00"),
            credit=amount,
            final_balance=payment_account.balance - amount,
        )

        commission_account.balance += amount
        payment_account.balance -= amount
        commission_account.save()
        payment_account.save()

        # Update earning
        locked_earning.redeemed = True
        locked_earning.redeemed_date = timezone.now()
        locked_earning.status = 'paid'
        locked_earning.ledger_tx_ref = f"ledger:{ledger_entry.id}"
        locked_earning.save()

        # SYNC TO HR MODULE: Update HrCommission status to 'paid'
        # The Frontend "My Commissions" tab reads from HR Commission model, so we must sync status.
        if locked_earning.earned_by_type == 'employee':
            try:
                from hr.models import Commission as HrCommission
                from django.contrib.auth import get_user_model
                
                # Resolve Booking Reference
                booking_ref_str = str(locked_earning.booking_id) if locked_earning.booking_id else None
                if booking and booking.booking_number:
                     booking_ref_str = booking.booking_number
                
                if booking_ref_str:
                     # Resolve Employee via User ID
                     User = get_user_model()
                     user_obj = User.objects.filter(pk=locked_earning.earned_by_id).first()
                     
                     if user_obj and user_obj.email:
                          # Update all matching HR commissions (should be 1)
                          updated_count = HrCommission.objects.filter(
                              booking_id=booking_ref_str, 
                              employee__email=user_obj.email
                          ).update(status='paid')
                          
                          if updated_count > 0:
                               print(f"[Commission Redeem] Synced HR Commission status to PAID for {user_obj.email} (Ref: {booking_ref_str})")
                          else:
                               print(f"[Commission Redeem] No matching HR Commission found to sync for {user_obj.email} (Ref: {booking_ref_str})")
            except Exception as e:
                print(f"[Commission Redeem] Failed to sync HR status: {e}")

        try:
            SystemLog.objects.create(
                action_type="commission:redeem",
                model_name="CommissionEarning",
                record_id=locked_earning.id,
                organization_id=e_org_id,
                user_id=getattr(created_by, "id", None) if created_by is not None else None,
                description=f"Paid commission {amount}",
                status="success",
                new_data={"ledger_entry_id": ledger_entry.id},
            )
        except Exception:
            pass

        return ledger_entry.id



def calculate_hotel_commission(booking, rule):
    """
    Calculate commission based on hotel nights and room types configured in the rule.
    """
    total_commission = 0
    hotel_configs = getattr(rule, 'hotel_night_commission', []) or []
    
    if not hotel_configs:
        return 0

    # Check if booking has hotel details
    if not hasattr(booking, 'hotel_details'):
        return 0

    # Iterate over booking hotels
    for hotel_detail in booking.hotel_details.all():
        hotel_id = hotel_detail.hotel_id
        nights = hotel_detail.number_of_nights or 0
        qty = hotel_detail.quantity or 1
        room_type = str(hotel_detail.room_type or '').split()[0].lower() # Handle 'Sharing Room' -> 'sharing'
        
        # Find matching config for this hotel
        matched_config = None
        for config in hotel_configs:
            # Check if hotel_id is in the list of commission_hotels (which are IDs)
            if hotel_id in (config.get('commission_hotels') or []):
                matched_config = config
                break
        
        if matched_config:
            # Map room_type to config key
            config_key = f"{room_type}_per_night_commission"
            
            # Try to get rate using constructed key (e.g. quint_per_night_commission)
            rate = float(matched_config.get(config_key, 0) or 0)
            
            # If rate is 0, try 'other'
            if rate == 0:
                 rate = float(matched_config.get('other_per_night_commission', 0) or 0)
            
            item_comm = rate * nights * qty
            total_commission += item_comm
            print(f"[HOTEL COMM] Hotel {hotel_id}, Room {room_type}, Nights {nights}, Qty {qty}, Rate {rate} -> {item_comm}")

    return total_commission

def evaluate_rules_for_booking(booking) -> List[Tuple[CommissionRule, float]]:
    """
    Given a booking instance, return a list of (rule, commission_amount) tuples
    that should be created for this booking.
    
    New logic:
    - Check if the booking's branch has a commission_group assigned
    - If yes, use that commission rule
    - If no, find active rules with receiver_type='branch'
    - Calculate commission based on the rule's commission JSON structure
    
    Returns an empty list if no rules match.
    """
    matches = []
    try:
        total_amount = float(getattr(booking, "total_amount", 0) or 0)
        booking_type = getattr(booking, "booking_type", None)
        branch = getattr(booking, "branch", None)
        
        print(f"[EVAL DEBUG] Booking Type: {booking_type}, Total Amount: {total_amount}")
        print(f"[EVAL DEBUG] Branch: {branch}")
        
        # Get the branch's assigned commission group
        commission_rule = None
        if branch and hasattr(branch, 'commission_group') and branch.commission_group:
            commission_rule = branch.commission_group
            print(f"[EVAL DEBUG] Found commission_group from branch: Rule ID {commission_rule.id}")
        else:
            # Fallback: Find active rules with receiver_type='branch'
            commission_rule = CommissionRule.objects.filter(
                active=True,
                receiver_type='branch'
            ).first()
            print(f"[EVAL DEBUG] No commission_group on branch, fallback rule: {commission_rule}")
        
        if not commission_rule:
            # No commission rule found
            print(f"[EVAL DEBUG] No commission rule found!")
            return matches
        
        # Calculate commission amount based on the rule's commission JSON structure
        commission_data = getattr(commission_rule, 'commission', None) or {}
        print(f"[EVAL DEBUG] Commission data from rule: {commission_data}")
        
        # Determine which commission field to use based on booking_type
        commission_amount = 0
        
        # Normalize booking type
        b_type_str = str(booking_type).lower() if booking_type else ''
        
        if b_type_str == 'custom_package':
             # Use HOTEL logic only for Custom Package as per requirement
             commission_amount = calculate_hotel_commission(booking, commission_rule)
             print(f"[EVAL DEBUG] Custom Package (Hotel) commission: {commission_amount}")
             
        elif b_type_str in ['umrah_package', 'umrah']:
            # Use umrah_package_commission_amount from the commission JSON
            commission_amount = float(commission_data.get('umrah_package_commission_amount', 0) or 0)
            print(f"[EVAL DEBUG] Umrah package commission: {commission_amount}")
            
        elif b_type_str in ['group_ticket', 'ticket']:
            # Use group_ticket_commission_amount from the commission JSON
            # Handle both 'group_ticket' and 'TICKET' booking types
            commission_amount = float(commission_data.get('group_ticket_commission_amount', 0) or 0)
            print(f"[EVAL DEBUG] Group ticket/TICKET commission: {commission_amount}")
        else:
            # For other booking types, try to use a generic commission_value
            # or fall back to legacy commission_value field
            commission_amount = float(getattr(commission_rule, 'commission_value', 0) or 0)
            print(f"[EVAL DEBUG] Other booking type '{booking_type}', using commission_value: {commission_amount}")
        
        # If commission_amount is still 0, try legacy percentage calculation
        if commission_amount == 0 and b_type_str != 'custom_package': 
             # Only fallback for non-custom types to avoid double dipping or wrong logic
            commission_type = getattr(commission_rule, 'commission_type', None)
            commission_value = float(getattr(commission_rule, 'commission_value', 0) or 0)
            
            print(f"[EVAL DEBUG] Commission still 0, trying legacy: type={commission_type}, value={commission_value}")
            
            if commission_type and commission_type.lower() == 'percentage':
                commission_amount = (commission_value / 100.0) * total_amount
            else:
                commission_amount = commission_value
            
            print(f"[EVAL DEBUG] Legacy calculation result: {commission_amount}")
        
        # Only add if amount > 0
        if commission_amount > 0:
            matches.append((commission_rule, commission_amount))
            print(f"[EVAL DEBUG] Added match: Rule {commission_rule.id}, Amount {commission_amount}")
        else:
            print(f"[EVAL DEBUG] Commission amount is 0, not adding to matches")
            
    except Exception:
        # keep evaluation non-fatal
        import traceback
        traceback.print_exc()

    return matches
