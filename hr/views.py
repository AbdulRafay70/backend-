from rest_framework import viewsets, filters, status, permissions
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime, time, timedelta, date
from drf_spectacular.utils import extend_schema, OpenApiExample
from . import models, serializers
from django.db import transaction
from django.db.models import Count, Q, Sum, Avg
import pytz
from users.permissions import PermissionByAction



@extend_schema(tags=['HR'], description='CRUD operations for employees')
class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = models.Employee.objects.all()
    serializer_class = serializers.EmployeeSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['first_name', 'last_name', 'role', 'phone', 'whatsapp']

    def perform_update(self, serializer):
        super().perform_update(serializer)
        instance = serializer.instance
        
        # Sync commission_group to UserProfile
        try:
            from django.contrib.auth import get_user_model
            from users.models import UserProfile
            User = get_user_model()
            
            if instance.email:
                user = User.objects.filter(email=instance.email).first()
                if user:
                    # Get or create profile
                    profile, created = UserProfile.objects.get_or_create(user=user)
                    
                    # Update commission_id
                    new_commission_id = str(instance.commission_group.id) if instance.commission_group else None
                    if profile.commission_id != new_commission_id:
                        profile.commission_id = new_commission_id
                        profile.save()
                        print(f"✅ [HR SYNC] Synced Employee {instance.first_name} commission group to User {user.email} profile. Commission ID: {new_commission_id}")
                    else:
                         print(f"ℹ️ [HR SYNC] User {user.email} profile already has correct commission ID: {new_commission_id}")
                else:
                    print(f"⚠️ [HR SYNC] No User found with email {instance.email} to sync commission group")
        except Exception as e:
            print(f"❌ [HR SYNC] Failed to sync commission group to UserProfile: {e}")
            import traceback
            traceback.print_exc()

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Return comprehensive dashboard statistics"""
        today = date.today()
        pkt = pytz.timezone('Asia/Karachi')
        now = timezone.now().astimezone(pkt)
        
        # Current month for salary calculations
        current_month = today.month
        current_year = today.year
        
        # Basic counts
        total_employees = models.Employee.objects.filter(is_active=True).count()
        present_today = models.Attendance.objects.filter(date=today, check_in__isnull=False).count()
        
        # Late and absent counts
        late_today = models.Attendance.objects.filter(date=today, status__in=['late']).count()
        absent_today = total_employees - present_today  # Simple calculation
        
        # Movements
        total_movements = models.MovementLog.objects.filter(start_time__date=today).count()
        open_movements = models.MovementLog.objects.filter(end_time__isnull=True).count()
        
        # Commissions
        total_commissions = models.Commission.objects.filter(
            date__month=current_month, 
            date__year=current_year
        ).aggregate(total=Sum('amount'))['total'] or 0
        unpaid_commissions = models.Commission.objects.filter(status='unpaid').aggregate(total=Sum('amount'))['total'] or 0
        
        # Salaries
        total_salaries_paid_this_month = models.SalaryPayment.objects.filter(
            month=current_month,
            year=current_year,
            status='paid'
        ).aggregate(total=Sum('net_amount'))['total'] or 0
        
        total_salary_pending = models.SalaryPayment.objects.filter(
            month=current_month,
            year=current_year,
            status='pending'
        ).aggregate(total=Sum('net_amount'))['total'] or 0
        
        # Pending approvals (leave requests + unapproved attendance)
        pending_leaves = models.LeaveRequest.objects.filter(status='pending').count()
        pending_attendance = models.Attendance.objects.filter(is_approved=False, check_out__isnull=False).count()
        pending_approvals = pending_leaves + pending_attendance
        
        # Average check-in time calculation
        today_attendances = models.Attendance.objects.filter(date=today, check_in__isnull=False)
        if today_attendances.exists():
            # Calculate average manually by converting to seconds since midnight
            total_seconds = 0
            count = 0
            for att in today_attendances:
                check_in_time = att.check_in.astimezone(pkt).time()
                seconds = check_in_time.hour * 3600 + check_in_time.minute * 60 + check_in_time.second
                total_seconds += seconds
                count += 1
            
            if count > 0:
                avg_seconds = total_seconds // count
                avg_hour = avg_seconds // 3600
                avg_minute = (avg_seconds % 3600) // 60
                average_checkin_time = f"{avg_hour:02d}:{avg_minute:02d}"
            else:
                average_checkin_time = '--:--'
        else:
            average_checkin_time = '--:--'
        
        return Response({
            'total_employees': total_employees,
            'total_active_employees': total_employees,  # Legacy compatibility
            'present_today': present_today,
            'late_today': late_today,
            'absent_today': absent_today,
            'total_movements': total_movements,
            'open_movements_today': open_movements,
            'total_commissions': float(total_commissions),
            'unpaid_commissions_amount': float(unpaid_commissions),
            'total_salaries_paid_this_month': float(total_salaries_paid_this_month),
            'total_salary_pending': float(total_salary_pending),
            'pending_approvals': pending_approvals,
            'average_checkin_time': average_checkin_time
        })

    @action(detail=True, methods=['post'])
    def check_in(self, request, pk=None):
        """Check in employee with PKT time validation (on_time, grace, late)"""
        employee = self.get_object()
        pkt = pytz.timezone('Asia/Karachi')
        when = timezone.now().astimezone(pkt)
        date_only = when.date()
        
        # Determine status based on check_in_time and grace_minutes
        status_val = 'present'
        if employee.check_in_time and employee.grace_minutes is not None:
            expected_time = datetime.combine(date_only, employee.check_in_time)
            grace_end = expected_time + timedelta(minutes=employee.grace_minutes)
            actual_time = when.replace(tzinfo=None)
            
            if actual_time <= expected_time:
                status_val = 'on_time'
            elif actual_time <= grace_end:
                status_val = 'grace'
            else:
                status_val = 'late'
        
        att, created = models.Attendance.objects.get_or_create(
            employee=employee,
            date=date_only,
            defaults={'check_in': when, 'status': status_val}
        )
        if not created:
            att.check_in = when
            att.status = status_val
            att.save()
        
        return Response(serializers.AttendanceSerializer(att).data)

    @action(detail=True, methods=['post'])
    def check_out(self, request, pk=None):
        """Check out employee - creates LeaveRequest if before expected checkout time"""
        employee = self.get_object()
        pkt = pytz.timezone('Asia/Karachi')
        when = timezone.now().astimezone(pkt)
        date_only = when.date()
        reason = request.data.get('reason', '')
        
        try:
            att = models.Attendance.objects.get(employee=employee, date=date_only)
        except models.Attendance.DoesNotExist:
            return Response({'detail': 'No check-in found for today'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if early checkout requires approval
        needs_approval = False
        if employee.check_out_time:
            expected_time = datetime.combine(date_only, employee.check_out_time)
            actual_time = when.replace(tzinfo=None)
            if actual_time < expected_time:
                needs_approval = True
        
        if needs_approval:
            # Check if there's already a pending request
            existing_request = models.LeaveRequest.objects.filter(
                employee=employee,
                request_type='early_checkout',
                date=date_only,
                status='pending'
            ).first()
            
            if existing_request:
                return Response({
                    'detail': 'Early checkout request already pending approval',
                    'requires_approval': True,
                    'request_id': existing_request.id
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create leave request for early checkout
            leave_request = models.LeaveRequest.objects.create(
                employee=employee,
                request_type='early_checkout',
                date=date_only,
                reason=reason or 'Early checkout request',
                status='pending'
            )
            
            return Response({
                'detail': 'Early checkout request submitted for approval',
                'requires_approval': True,
                'request_id': leave_request.id,
                'message': 'Your early checkout request has been submitted and is pending manager approval.'
            })
        
        # Normal checkout - no approval needed
        att.check_out = when
        if att.check_in:
            att.working_hours = att.check_out - att.check_in
        att.save()
        
        response_data = serializers.AttendanceSerializer(att).data
        response_data['requires_approval'] = False
        response_data['message'] = 'Successfully checked out'
        
    @action(detail=True, methods=['post'])
    def sync_commissions(self, request, pk=None):
        """Force sync commission status from Agent module to HR module"""
        employee = self.get_object()
        from django.contrib.auth import get_user_model
        from commissions.models import CommissionEarning
        User = get_user_model()
        
        user = User.objects.filter(email=employee.email).first()
        if not user:
            return Response({'detail': 'No user linked to this employee'}, status=400)
            
        # Find all PAID earnings for this user
        paid_earnings = CommissionEarning.objects.filter(
            earned_by_type='employee',
            earned_by_id=user.id,
            status='paid'
        )
        
        updated_count = 0
        from .models import Commission as HrCommission
        from booking.models import Booking
        
        for earning in paid_earnings:
            # Resolve booking ref
            booking_ref = None
            if earning.booking_id:
                try:
                    bk = Booking.objects.get(pk=earning.booking_id)
                    booking_ref = bk.booking_number
                except Booking.DoesNotExist:
                    booking_ref = str(earning.booking_id)
            
            if booking_ref:
                # Update HR commission
                cnt = HrCommission.objects.filter(
                    booking_id=booking_ref,
                    employee=employee
                ).update(status='paid')
                updated_count += cnt
        
        return Response({'detail': f'Synced {updated_count} commissions to PAID status', 'count': updated_count})


class EmployeeLedgerView(APIView):
    """
    Virtual Ledger for Employees.
    Aggregates:
    - Commissions (Credit)
    - Salary Accruals (Credit) - Base Salary portion
    - Payments (Debit) - Salary Payments / Commission Redemptions
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, employee_id=None):
        if not employee_id:
            return Response({'detail': 'Employee ID required'}, status=400)
        
        try:
            employee = models.Employee.objects.get(pk=employee_id)
        except models.Employee.DoesNotExist:
            return Response({'detail': 'Employee not found'}, status=404)

        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.filter(email=employee.email).first()

        transactions = []

        # 1. Commissions (Credit) - Only when PAID
        from commissions.models import CommissionEarning
        
        # Try finding by Employee ID first (Standard)
        earnings = CommissionEarning.objects.filter(
            earned_by_type='employee', 
            earned_by_id=employee.id,
            status='paid'
        )
        
        # Fallback: Check by User ID if linked, just in case commissions were booked against User
        if not earnings.exists() and user:
             earnings_user = CommissionEarning.objects.filter(
                earned_by_type='employee', 
                earned_by_id=user.id,
                status='paid'
            )
             if earnings_user.exists():
                 earnings = earnings_user

        for e in earnings:
                # Use redeemed_date if available, otherwise updated/created
                tx_date = e.redeemed_date or e.updated_at or e.created_at
                
                transactions.append({
                    'date': tx_date,
                    'order_number': str(e.booking_id or e.booking_number or '-'),
                    'type': f"Commission ({e.service_type or 'General'})",
                    'debit': 0,
                    'credit': float(e.commission_amount or 0),
                    'timestamp': tx_date.timestamp()
                })

        # 2. Salary Payments (Credit for Base, Debit for Payment)
        payments = models.SalaryPayment.objects.filter(employee=employee)
        for p in payments:
            # Credit: Base Salary Accrual (on creation)
            transactions.append({
                'date': p.created_at,
                'order_number': f"SAL-{p.month}/{p.year}",
                'type': "Salary Accrual",
                'debit': 0,
                'credit': float(p.base_salary or 0),
                'timestamp': p.created_at.timestamp()
            })
            
            # Debit: Payment Made
            if p.status == 'paid' and p.paid_date:
                # Typically SalaryPayment.net_amount includes commissions, so we shouldn't double count if we listed commissions separately?
                # Ah, SalaryPayment logic in `generate_monthly_salaries`:
                # net_amount = base_salary + comm_total - fine_total
                # If we list individual commissions above as Credits, and Salary Accrual as Credit (Base), 
                # then Payment (Debit) of Net Amount effectively clears both.
                # HOWEVER, `comm_total` is calculated from `models.Commission`. 
                # Does `CommissionEarning` sync to `models.Commission`?
                # YES! In `signals.py`, I saw "SYNC TO HR MODULE".
                # So `models.Commission` records exist.
                # If I query `CommissionEarning` (Agent module) AND `SalaryPayment` (HR module), am I duplicating?
                # `signals.py` creates `HrCommission` when `CommissionEarning` is created.
                # `SalaryPayment` aggregates `HrCommission`.
                # If I show `CommissionEarning` credits here, and `SalaryPayment` credits...
                # Actually, `SalaryPayment` creation DOES NOT create a Ledger Credit for Commissions. It just sums them up.
                # So if I show `CommissionEarning` as Credit, and `SalaryAccrual` (Base) as Credit.
                # And `SalaryPayment` (Net Amount) as Debit.
                # Then Balance = (Comm + Base) - (Net Paid).
                # This should balance out.
                # So yes, it is correct to show separate credits.
                pass
            
            if p.status == 'paid' and p.paid_date:
                 transactions.append({
                    'date': p.paid_date,
                    'order_number': f"PMT-{p.month}/{p.year}",
                    'type': "Salary Payment",
                    'debit': float(p.net_amount or 0),
                    'credit': 0,
                    'timestamp': p.paid_date.timestamp()
                })
        
        # Sort by date
        transactions.sort(key=lambda x: x['timestamp'])

        # Calculate Running Balance
        balance = 0
        result = []
        for t in transactions:
            balance += (t['credit'] - t['debit'])
            result.append({
                'date': t['date'],
                'order_number': t['order_number'],
                'type': t['type'],
                'debit': t['debit'],
                'credit': t['credit'],
                'balance': balance
            })
            
        # Return reversed (newest first)
        return Response(result[::-1])


@extend_schema(tags=['HR'], description='Salary history records for employees')
class SalaryHistoryViewSet(viewsets.ModelViewSet):
    queryset = models.SalaryHistory.objects.all()
    serializer_class = serializers.SalaryHistorySerializer

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        employee_id = data.get('employee')
        if not employee_id:
            return Response({'detail': 'employee is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            emp = models.Employee.objects.get(pk=employee_id)
        except models.Employee.DoesNotExist:
            return Response({'detail': 'employee not found'}, status=status.HTTP_404_NOT_FOUND)

        new_salary = data.get('new_salary')
        if new_salary is None:
            return Response({'detail': 'new_salary is required'}, status=status.HTTP_400_BAD_REQUEST)

        # fill previous_salary from employee if not provided
        if not data.get('previous_salary'):
            data['previous_salary'] = str(emp.salary) if emp.salary is not None else '0.00'

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            self.perform_create(serializer)
            # update employee current salary to new_salary
            emp.salary = serializer.validated_data.get('new_salary')
            emp.save(update_fields=['salary'])

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


@extend_schema(tags=['HR'], description='Commission records and helpers')
class CommissionViewSet(viewsets.ModelViewSet):
    queryset = models.Commission.objects.all()
    serializer_class = serializers.CommissionSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        employee = self.request.query_params.get('employee')
        status_q = self.request.query_params.get('status')
        if employee:
            qs = qs.filter(employee_id=employee)
        if status_q:
            qs = qs.filter(status=status_q)
        return qs

    @extend_schema(
        responses={200: serializers.CommissionSerializer(many=True)},
        examples=[
            OpenApiExample(
                'UnpaidCommissions',
                summary='Unpaid commissions for an employee',
                description='Returns unpaid commissions for the given employee id',
                value=[{"id": 1, "employee": 1, "booking_id": "B123", "amount": "100.00", "status": "unpaid"}],
            )
        ],
    )
    @action(detail=False, methods=['get'], url_path='unpaid-by-employee')
    def unpaid_by_employee(self, request):
        emp = request.query_params.get('employee')
        if not emp:
            return Response({'detail': 'employee query param required'}, status=status.HTTP_400_BAD_REQUEST)
        qs = self.get_queryset().filter(employee_id=emp, status='unpaid')
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


@extend_schema(tags=['HR'], description='Attendance endpoints: check-in, check-out and queries')
class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = models.Attendance.objects.all()
    serializer_class = serializers.AttendanceSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        emp = self.request.query_params.get('employee')
        date_q = self.request.query_params.get('date')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if emp:
            qs = qs.filter(employee_id=emp)
        if date_q:
            qs = qs.filter(date=date_q)
        if start_date:
            qs = qs.filter(date__gte=start_date)
        if end_date:
            qs = qs.filter(date__lte=end_date)
        return qs

    @extend_schema(
        request={"application/json": serializers.AttendanceSerializer},
        responses={200: serializers.AttendanceSerializer},
        examples=[
            OpenApiExample(
                'CheckInExample',
                summary='Employee check-in',
                description='Minimal payload to check-in an employee (time optional).',
                value={"employee": 1, "time": "2025-11-25T09:00:00Z"},
            ),
        ],
    )
    @action(detail=False, methods=['post'])
    def check_in(self, request):
        employee_id = request.data.get('employee')
        if not employee_id:
            return Response({'detail': 'employee is required'}, status=status.HTTP_400_BAD_REQUEST)
        when = request.data.get('time')
        if when:
            try:
                when = datetime.fromisoformat(when)
            except Exception:
                return Response({'detail': 'time must be ISO datetime'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            when = timezone.now()

        date_only = when.date()
        att, created = models.Attendance.objects.get_or_create(employee_id=employee_id, date=date_only,
                                                               defaults={'check_in': when, 'status': 'present'})
        if not created:
            att.check_in = when
            if att.check_out and att.check_in:
                att.working_hours = att.check_out - att.check_in
            att.save()
        serializer = self.get_serializer(att)
        return Response(serializer.data)

    @extend_schema(
        request={"application/json": serializers.AttendanceSerializer},
        responses={200: serializers.AttendanceSerializer},
        examples=[
            OpenApiExample(
                'CheckOutExample',
                summary='Employee check-out',
                description='Minimal payload to check-out an employee (time optional).',
                value={"employee": 1, "time": "2025-11-25T18:00:00Z"},
            ),
        ],
    )
    @action(detail=False, methods=['post'])
    def check_out(self, request):
        employee_id = request.data.get('employee')
        if not employee_id:
            return Response({'detail': 'employee is required'}, status=status.HTTP_400_BAD_REQUEST)
        when = request.data.get('time')
        if when:
            try:
                when = datetime.fromisoformat(when)
            except Exception:
                return Response({'detail': 'time must be ISO datetime'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            when = timezone.now()

        date_only = when.date()
        try:
            att = models.Attendance.objects.get(employee_id=employee_id, date=date_only)
        except models.Attendance.DoesNotExist:
            return Response({'detail': 'attendance record not found for today'}, status=status.HTTP_404_NOT_FOUND)
        att.check_out = when
        if att.check_in:
            att.working_hours = att.check_out - att.check_in
            # Mark late/half-day based on simple rules (example)
            if att.working_hours < timezone.timedelta(hours=4):
                att.status = 'half_day'
        att.save()
        serializer = self.get_serializer(att)
        return Response(serializer.data)


@extend_schema(tags=['HR'], description='Movement logs: start and end movements')
class MovementLogViewSet(viewsets.ModelViewSet):
    queryset = models.MovementLog.objects.all()
    serializer_class = serializers.MovementLogSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['employee__first_name', 'employee__last_name', 'employee__phone']

    @action(detail=False, methods=['post'])
    def start_movement(self, request):
        """Start a movement with automatic PKT timestamp"""
        employee_id = request.data.get('employee')
        if not employee_id:
            return Response({'detail': 'employee is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        pkt = pytz.timezone('Asia/Karachi')
        when = timezone.now().astimezone(pkt)
        
        m = models.MovementLog.objects.create(
            employee_id=employee_id,
            start_time=when,
            reason=request.data.get('reason', '')
        )
        return Response(serializers.MovementLogSerializer(m).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def end_movement(self, request, pk=None):
        """End a movement with automatic PKT timestamp"""
        try:
            m = models.MovementLog.objects.get(pk=pk)
        except models.MovementLog.DoesNotExist:
            return Response({'detail': 'movement not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if m.end_time:
            return Response({'detail': 'movement already ended'}, status=status.HTTP_400_BAD_REQUEST)
        
        pkt = pytz.timezone('Asia/Karachi')
        when = timezone.now().astimezone(pkt)
        m.end_time = when
        m.save()
        
        return Response(serializers.MovementLogSerializer(m).data)


@extend_schema(tags=['HR'], description='Punctuality records (late, early leave, absence)')
class PunctualityViewSet(viewsets.ModelViewSet):
    queryset = models.PunctualityRecord.objects.all()
    serializer_class = serializers.PunctualitySerializer


@extend_schema(tags=['HR'], description='Commission groups for employee categorization')
class CommissionGroupViewSet(viewsets.ModelViewSet):
    queryset = models.CommissionGroup.objects.all()
    serializer_class = serializers.CommissionGroupSerializer


@extend_schema(tags=['HR'], description='Leave requests with approval workflow')
class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = models.LeaveRequest.objects.all()
    serializer_class = serializers.LeaveRequestSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        employee = self.request.query_params.get('employee')
        status_filter = self.request.query_params.get('status')
        if employee:
            qs = qs.filter(employee_id=employee)
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a leave request and complete early checkout if applicable"""
        leave_request = self.get_object()
        if leave_request.status != 'pending':
            return Response({'detail': 'Leave request is not pending'}, status=status.HTTP_400_BAD_REQUEST)
        
        leave_request.status = 'approved'
        leave_request.approved_by = request.user
        leave_request.approval_notes = request.data.get('notes', '')
        leave_request.save()
        
        # If this is an early checkout request, complete the checkout
        if leave_request.request_type == 'early_checkout':
            pkt = pytz.timezone('Asia/Karachi')
            try:
                att = models.Attendance.objects.get(
                    employee=leave_request.employee,
                    date=leave_request.date
                )
                # Use current time for checkout
                att.check_out = timezone.now().astimezone(pkt)
                if att.check_in:
                    att.working_hours = att.check_out - att.check_in
                att.is_approved = True
                att.approved_by = request.user
                att.approval_notes = f"Early checkout approved: {leave_request.approval_notes}"
                att.save()
            except models.Attendance.DoesNotExist:
                pass  # Attendance record not found, just approve the request
        
        return Response(serializers.LeaveRequestSerializer(leave_request).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a leave request"""
        leave_request = self.get_object()
        if leave_request.status != 'pending':
            return Response({'detail': 'Leave request is not pending'}, status=status.HTTP_400_BAD_REQUEST)
        
        leave_request.status = 'rejected'
        leave_request.approved_by = request.user
        leave_request.approval_notes = request.data.get('notes', '')
        leave_request.save()
        
        return Response(serializers.LeaveRequestSerializer(leave_request).data)


@extend_schema(tags=['HR'], description='Fines for attendance violations')
class FineViewSet(viewsets.ModelViewSet):
    queryset = models.Fine.objects.all()
    serializer_class = serializers.FineSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        employee = self.request.query_params.get('employee')
        if employee:
            qs = qs.filter(employee_id=employee)
        return qs


@extend_schema(tags=['HR'], description='Monthly salary payments (salary + commissions - fines)')
class SalaryPaymentViewSet(viewsets.ModelViewSet):
    queryset = models.SalaryPayment.objects.all()
    serializer_class = serializers.SalaryPaymentSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        employee = self.request.query_params.get('employee')
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        status_filter = self.request.query_params.get('status')
        
        if employee:
            qs = qs.filter(employee_id=employee)
        if month:
            qs = qs.filter(month=month)
        if year:
            qs = qs.filter(year=year)
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark salary payment as paid and calculate late payment if applicable"""
        from datetime import date
        
        payment = self.get_object()
        if payment.status == 'paid':
            return Response({'detail': 'Payment already marked as paid'}, status=status.HTTP_400_BAD_REQUEST)
        
        payment.status = 'paid'
        payment.paid_date = timezone.now()
        payment.actual_payment_date = date.today()
        payment.notes = request.data.get('notes', '')
        
        # Calculate days late if expected_payment_date is set
        if payment.expected_payment_date:
            days_diff = (payment.actual_payment_date - payment.expected_payment_date).days
            if days_diff > 0:
                payment.days_late = days_diff
                payment.is_late = True
            else:
                payment.days_late = 0
                payment.is_late = False
        
        payment.save()
        
        return Response(serializers.SalaryPaymentSerializer(payment).data)
    
    @action(detail=False, methods=['post'])
    def generate_monthly_salaries(self, request):
        """Generate salary payments for all active employees for a specific month/year"""
        month = request.data.get('month')
        year = request.data.get('year')
        
        if not month or not year:
            return Response(
                {'detail': 'month and year are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            month = int(month)
            year = int(year)
            if month < 1 or month > 12:
                raise ValueError("Invalid month")
        except (ValueError, TypeError):
            return Response(
                {'detail': 'Invalid month or year'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if salaries already exist for this month/year
        existing = models.SalaryPayment.objects.filter(month=month, year=year)
        if existing.exists():
            return Response(
                {
                    'detail': f'Salary payments already exist for {month}/{year}',
                    'existing_count': existing.count(),
                    'can_regenerate': False
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get all active employees
        employees = models.Employee.objects.filter(is_active=True)
        if not employees.exists():
            return Response(
                {'detail': 'No active employees found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        created_payments = []
        errors = []
        
        for emp in employees:
            try:
                # Calculate commission total for the month
                comm_total = models.Commission.objects.filter(
                    employee=emp,
                    date__month=month,
                    date__year=year
                ).aggregate(total=Sum('amount'))['total'] or 0
                
                # Calculate fine deductions for the month
                fine_total = models.Fine.objects.filter(
                    employee=emp,
                    date__month=month,
                    date__year=year
                ).aggregate(total=Sum('amount'))['total'] or 0
                
                base_salary = emp.salary or 0
                net_amount = float(base_salary) + float(comm_total) - float(fine_total)
                
                # Calculate expected payment date based on employee's salary_payment_date
                from datetime import date
                expected_date = None
                if emp.salary_payment_date:
                    try:
                        # Handle months with fewer days (e.g., Feb 30 -> Feb 28/29)
                        import calendar
                        last_day = calendar.monthrange(year, month)[1]
                        payment_day = min(emp.salary_payment_date, last_day)
                        expected_date = date(year, month, payment_day)
                    except (ValueError, TypeError):
                        pass
                
                # Create salary payment
                payment = models.SalaryPayment.objects.create(
                    employee=emp,
                    month=month,
                    year=year,
                    base_salary=base_salary,
                    commission_total=comm_total,
                    fine_deductions=fine_total,
                    net_amount=net_amount,
                    expected_payment_date=expected_date,
                    status='pending'
                )
                created_payments.append(payment)
                
            except Exception as e:
                errors.append({
                    'employee': f"{emp.first_name} {emp.last_name}",
                    'error': str(e)
                })
        
        return Response({
            'message': f'Successfully generated {len(created_payments)} salary payments',
            'month': month,
            'year': year,
            'created_count': len(created_payments),
            'errors': errors,
            'payments': serializers.SalaryPaymentSerializer(created_payments, many=True).data
        }, status=status.HTTP_201_CREATED)
