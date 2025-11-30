from rest_framework import serializers
from . import models


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Employee
        fields = ['id', 'first_name', 'last_name', 'email', 'phone', 'role', 'joining_date', 'salary', 'currency', 'is_active']


class SalaryHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.SalaryHistory
        fields = '__all__'


class CommissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Commission
        fields = '__all__'


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Attendance
        fields = '__all__'


class MovementLogSerializer(serializers.ModelSerializer):
    duration = serializers.ReadOnlyField()

    class Meta:
        model = models.MovementLog
        fields = ['id', 'employee', 'start_time', 'end_time', 'reason', 'duration']


class PunctualitySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.PunctualityRecord
        fields = '__all__'
