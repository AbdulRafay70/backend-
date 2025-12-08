from rest_framework import serializers
from . import models


class CommissionGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.CommissionGroup
        fields = '__all__'


class EmployeeSerializer(serializers.ModelSerializer):
    commission_group_name = serializers.CharField(source='commission_group.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    
    class Meta:
        model = models.Employee
        fields = [
            'id', 'first_name', 'last_name', 'email', 'phone', 'whatsapp',
            'address', 'other_contact_number', 'contact_name', 'role',
            'branch', 'branch_name', 'commission_group', 'commission_group_name',
            'check_in_time', 'check_out_time', 'grace_minutes',
            'salary', 'currency', 'salary_account_number', 'salary_account_title',
            'salary_bank_name', 'salary_payment_date', 'joining_date',
            'is_active', 'created_at', 'updated_at'
        ]


class SalaryHistorySerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.first_name', read_only=True)
    
    class Meta:
        model = models.SalaryHistory
        fields = '__all__'


class CommissionSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.first_name', read_only=True)
    
    class Meta:
        model = models.Commission
        fields = '__all__'


class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.first_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True)
    
    class Meta:
        model = models.Attendance
        fields = '__all__'


class MovementLogSerializer(serializers.ModelSerializer):
    duration = serializers.ReadOnlyField()
    employee_name = serializers.CharField(source='employee.first_name', read_only=True)

    class Meta:
        model = models.MovementLog
        fields = ['id', 'employee', 'employee_name', 'start_time', 'end_time', 'reason', 'duration', 'created_at']


class PunctualitySerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.first_name', read_only=True)
    
    class Meta:
        model = models.PunctualityRecord
        fields = '__all__'


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.first_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True)
    
    class Meta:
        model = models.LeaveRequest
        fields = '__all__'


class FineSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.first_name', read_only=True)
    
    class Meta:
        model = models.Fine
        fields = '__all__'


class SalaryPaymentSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.first_name', read_only=True)
    
    class Meta:
        model = models.SalaryPayment
        fields = '__all__'
