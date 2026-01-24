from django.dispatch import receiver
from django.db.models.signals import post_save
from django.conf import settings
from django.utils import timezone

from booking.models import Booking
from .models import CommissionEarning, CommissionRule
from .services import evaluate_rules_for_booking
from logs.models import SystemLog


@receiver(post_save, sender=Booking)
def booking_post_save_create_commissions(sender, instance, created, **kwargs):
    """
    On booking creation (or update where status/payment occurs), evaluate commission
    rules and create CommissionEarning records as necessary.
    
    Business Rules:
    - Commissions are ONLY created when booking status is "approved"
    - Check who made the sale (Area Agent, Full Agency, Employee, Branch)
    - Create commission for the direct seller (if eligible)
    - ALSO create commission for the Branch (if seller is Area Agent)
    - Never create commission for Full Agency agents
    """
    try:
        print(f"🔔 [SIGNAL FIRED] Booking post_save signal called for booking ID: {instance.id if instance else 'None'}")
        from organization.models import Agency
        
        booking_id = instance.id
        
        # CRITICAL: Only create commissions when booking status is "Approved" (capital A)
        booking_status = getattr(instance, "status", None)
        if booking_status != "Approved":
            # Skip commission creation for non-approved bookings
            print(f"⏭️ [COMMISSION SKIP] Booking {booking_id} status is '{booking_status}', not 'Approved'")
            return
        
        # CRITICAL: Prevent duplicate commissions
        # Check if commissions already exist for this booking
        existing_commissions = CommissionEarning.objects.filter(booking_id=booking_id)
        if existing_commissions.exists():
            print(f"⏭️ [COMMISSION SKIP] Commissions already exist for booking {booking_id} (count: {existing_commissions.count()})")
            return
        
        # Determine who made the sale and their eligibility
        # Note: agency, employee, and branch are already ForeignKey objects, not IDs
        agency = instance.agency
        employee = instance.employee
        branch = instance.branch
        
        # Check if this is a Full Agency agent (they NEVER earn commissions)
        is_full_agency = False
        if agency:
            # agency is already the Agency object, just check its agency_type
            is_full_agency = getattr(agency, 'agency_type', None) == "Full Agency"
        
        
        # Evaluate matching rules
        print(f"[COMMISSION DEBUG] Booking {booking_id} - Status: {booking_status}")
        print(f"[COMMISSION DEBUG] Agency: {agency}, Is Full Agency: {is_full_agency}")
        print(f"[COMMISSION DEBUG] Employee: {employee}, Branch: {branch}")
        
        matches = evaluate_rules_for_booking(instance)
        print(f"[COMMISSION DEBUG] Matches found: {len(matches)}")
        for rule, amount in matches:
            print(f"[COMMISSION DEBUG] Rule ID: {rule.id}, Amount: {amount}, Receiver Type: {rule.receiver_type}")
        
        created_earnings = []
        
        # Check if booking was made by an employee (via UserProfile)
        user = instance.user
        is_employee_booking = False
        employee_commission_id = None
        
        if user and hasattr(user, 'profile'):
            try:
                profile = user.profile
                print(f"[COMMISSION DEBUG] Checking User Profile - Type: '{profile.type}', Commission ID: '{profile.commission_id}'")
                
                # Allow if type is employee OR if they have a commission_id set (e.g. admins acting as employees)
                if profile.type == 'employee' or profile.commission_id:
                    is_employee_booking = True
                    if profile.commission_id:
                        employee_commission_id = profile.commission_id
                        print(f"[COMMISSION DEBUG] ✅ VALID Employee/Agent booking - User ID: {user.id}, Type: {profile.type}, Commission ID: {employee_commission_id}")
                    else:
                        if profile.type == 'employee':
                            print(f"[COMMISSION DEBUG] ❌ Employee detected but NO Commission ID set")
                        else:
                             print(f"[COMMISSION DEBUG] ℹ️ Non-employee with no commission ID (Type: {profile.type}) - Skipping")
                             is_employee_booking = False
                else:
                    print(f"[COMMISSION DEBUG] ℹ️ User type '{profile.type}' ignored (not employee and no commission_id)")
                    
            except Exception as e:
                print(f"[COMMISSION DEBUG] Error checking user profile: {e}")
        else:
             print(f"[COMMISSION DEBUG] ❌ User has no profile or user is None: {user}")

        print(f"[COMMISSION DEBUG] Booking Agency: {agency} (ID: {agency.id if agency else 'None'})")
        print(f"[COMMISSION DEBUG] is_employee_booking: {is_employee_booking}")
        
        # Scenario 1: Employee made the sale (via UserProfile commission_id)
        if is_employee_booking:
            if employee_commission_id:
                try:
                    # Fetch the commission rule by ID
                    commission_rule = CommissionRule.objects.get(id=int(employee_commission_id), active=True)
                    
                    # Calculate commission amount based on booking type
                    booking_type = getattr(instance, "booking_type", None)
                    total_amount = float(getattr(instance, "total_amount", 0) or 0)
                    commission_data = getattr(commission_rule, 'commission', None) or {}
                    
                    commission_amount = 0
                    # Normalize booking type
                    b_type_str = str(booking_type).lower() if booking_type else ''
                    
                    if b_type_str in ['group_ticket', 'ticket']:
                        commission_amount = float(commission_data.get('group_ticket_commission_amount', 0) or 0)
                    elif b_type_str == 'custom_package':
                        try:
                            from .services import calculate_hotel_commission
                            commission_amount = calculate_hotel_commission(instance, commission_rule)
                            print(f"[COMMISSION DEBUG] Custom Package (Hotel) commission: {commission_amount}")
                        except Exception as e:
                            print(f"[COMMISSION DEBUG] Error calc hotel comm: {e}")
                            commission_amount = 0
                    elif b_type_str in ['umrah_package', 'umrah']:
                        commission_amount = float(commission_data.get('umrah_package_commission_amount', 0) or 0)
                    
                    # Fallback to legacy commission_value if needed
                    if commission_amount == 0:
                        commission_type = getattr(commission_rule, 'commission_type', None)
                        commission_value = float(getattr(commission_rule, 'commission_value', 0) or 0)
                        if commission_type and commission_type.lower() == 'percentage':
                            commission_amount = (commission_value / 100.0) * total_amount
                        else:
                            commission_amount = commission_value
                    
                    if commission_amount > 0:
                        # Create commission for the employee (using user.id)
                        # Use booking_number for display if available, else ID
                        booking_ref = instance.booking_number or str(instance.id)
                        
                        earning = CommissionEarning.objects.create(
                            booking_id=instance.id,
                            service_type=booking_type,
                            earned_by_type="employee",
                            earned_by_id=user.id,
                            commission_amount=commission_amount,
                            status="pending",
                            extra={"rule_id": commission_rule.id, "user_id": user.id, "booking_ref": booking_ref},
                        )
                        created_earnings.append(earning.id)
                        print(f"[COMMISSION DEBUG] Created employee commission: ID {earning.id}, Amount: {commission_amount}, Ref: {booking_ref}")

                        # SYNC TO HR MODULE (For Salary Calculation & Profile Display)
                        try:
                            from hr.models import Commission as HrCommission, Employee as HrEmployee
                            # Find employee by email (best effort sync)
                            if user.email:
                                hr_employee = HrEmployee.objects.filter(email=user.email).first()
                                if hr_employee:
                                    HrCommission.objects.create(
                                        employee=hr_employee,
                                        booking_id=booking_ref,
                                        service_type=booking_type or 'booking',
                                        amount=commission_amount,
                                        date=timezone.now().date(),
                                        status='unpaid'
                                    )
                                    print(f"[COMMISSION DEBUG] Synced to HR Commission for {hr_employee}")
                                else:
                                     print(f"[COMMISSION DEBUG] Skipped HR sync: No HR Employee found for email {user.email}")
                        except Exception as e:
                            print(f"[COMMISSION DEBUG] Failed to sync to HR: {e}")
                    else:
                        print(f"[COMMISSION DEBUG] Employee commission amount is 0, skipping")
                        
                except CommissionRule.DoesNotExist:
                    print(f"[COMMISSION DEBUG] Commission rule {employee_commission_id} not found or inactive")
                except Exception as e:
                    import traceback
                    print(f"[COMMISSION DEBUG] Error creating employee commission: {e}")
                    traceback.print_exc()
            else:
                 print(f"[COMMISSION DEBUG] ⚠️ Employee booking but no commission_id configured for user {user.id}. Skipping commission.")
        
        # Process Agency/Branch/Generic commissions
        # We run this for everyone (including employees now), but handle logic per type
        for rule, amount in matches:
            receiver_type = getattr(rule, "receiver_type", None)
            
            # Scenario: Employee Booking -> Create Branch Commission (Dual Commission)
            if is_employee_booking:
                if branch:
                    branch_earning = CommissionEarning.objects.create(
                        booking_id=booking_id,
                        service_type=getattr(instance, "booking_type", None),
                        earned_by_type="branch",
                        earned_by_id=branch.id,
                        commission_amount=amount,
                        status="pending",
                        extra={
                            "rule_id": getattr(rule, "id", None),
                            "from_employee_booking": user.id
                        },
                    )
                    created_earnings.append(branch_earning.id)
                # Skip the rest of the loop for this rule (don't create agent commissions)
                continue

            # Scenario 2: Area Agent made the sale
            if agency and not is_full_agency:
                # Create commission for the Area Agent
                earning = CommissionEarning.objects.create(
                    booking_id=booking_id,
                    service_type=getattr(instance, "booking_type", None),
                    earned_by_type="area_agent",
                    earned_by_id=agency.id,
                    commission_amount=amount,
                    status="pending",
                    extra={"rule_id": getattr(rule, "id", None)},
                )
                created_earnings.append(earning.id)
                
                # ALSO create commission for the Branch
                if branch:
                    branch_earning = CommissionEarning.objects.create(
                        booking_id=booking_id,
                        service_type=getattr(instance, "booking_type", None),
                        earned_by_type="branch",
                        earned_by_id=branch.id,
                        commission_amount=amount,
                        status="pending",
                        extra={
                            "rule_id": getattr(rule, "id", None),
                            "from_area_agent": agency.id
                        },
                    )
                    created_earnings.append(branch_earning.id)
        
            # Scenario 3: Full Agency agent made the sale (NO commission for agent)
            elif agency and is_full_agency:
                # Full Agency agents don't earn commission, but Branch still earns
                if branch:
                    branch_earning = CommissionEarning.objects.create(
                        booking_id=booking_id,
                        service_type=getattr(instance, "booking_type", None),
                        earned_by_type="branch",
                        earned_by_id=branch.id,
                        commission_amount=amount,
                        status="pending",
                        extra={
                            "rule_id": getattr(rule, "id", None),
                            "from_full_agency": agency.id
                        },
                    )
                    created_earnings.append(branch_earning.id)
        
            # Scenario 4: Direct branch sale (no agent/employee)
            elif branch and not agency and not employee:
                earning = CommissionEarning.objects.create(
                    booking_id=booking_id,
                    service_type=getattr(instance, "booking_type", None),
                    earned_by_type="branch",
                    earned_by_id=branch.id,
                    commission_amount=amount,
                    status="pending",
                    extra={"rule_id": getattr(rule, "id", None)},
                )
                created_earnings.append(earning.id)

        # Log created earnings in SystemLog
        if created_earnings:
            SystemLog.objects.create(
                action_type="commission:create",
                model_name="CommissionEarning",
                record_id=None,
                organization_id=getattr(instance, "organization_id", None),
                branch_id=getattr(instance, "branch_id", None),
                agency_id=getattr(instance, "agency_id", None),
                user_id=getattr(instance, "created_by_id", None),
                description=f"Auto-created commission earnings for booking {booking_id}: {created_earnings}",
                status="success",
                new_data={"created_earnings": created_earnings},
            )
    except Exception:
        # avoid crashing booking save; errors should be visible in logs
        import traceback

        traceback.print_exc()
