from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime
from drf_spectacular.utils import extend_schema, OpenApiExample
from . import models, serializers
from django.db import transaction


@extend_schema(tags=['HR'], description='CRUD operations for employees')
class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = models.Employee.objects.all()
    serializer_class = serializers.EmployeeSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['first_name', 'last_name', 'role']


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
        if emp:
            qs = qs.filter(employee_id=emp)
        if date_q:
            qs = qs.filter(date=date_q)
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

    @action(detail=False, methods=['post'])
    def start(self, request):
        employee_id = request.data.get('employee')
        if not employee_id:
            return Response({'detail': 'employee is required'}, status=status.HTTP_400_BAD_REQUEST)
        when = request.data.get('start_time')
        if when:
            try:
                when = datetime.fromisoformat(when)
            except Exception:
                return Response({'detail': 'start_time must be ISO datetime'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            when = timezone.now()
        m = models.MovementLog.objects.create(employee_id=employee_id, start_time=when, reason=request.data.get('reason',''))
        serializer = self.get_serializer(m)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(
        request={"application/json": serializers.MovementLogSerializer},
        responses={200: serializers.MovementLogSerializer},
        examples=[
            OpenApiExample(
                'MovementEnd',
                summary='End movement',
                description='Close a movement log by providing end_time (optional).',
                value={"end_time": "2025-11-25T16:30:00Z"},
            ),
        ],
    )
    @action(detail=True, methods=['post'])
    def end(self, request, pk=None):
        try:
            m = models.MovementLog.objects.get(pk=pk)
        except models.MovementLog.DoesNotExist:
            return Response({'detail': 'movement not found'}, status=status.HTTP_404_NOT_FOUND)
        when = request.data.get('end_time')
        if when:
            try:
                when = datetime.fromisoformat(when)
            except Exception:
                return Response({'detail': 'end_time must be ISO datetime'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            when = timezone.now()
        m.end_time = when
        m.save()
        serializer = self.get_serializer(m)
        return Response(serializer.data)


@extend_schema(tags=['HR'], description='Punctuality records (late, early leave, absence)')
class PunctualityViewSet(viewsets.ModelViewSet):
    queryset = models.PunctualityRecord.objects.all()
    serializer_class = serializers.PunctualitySerializer
