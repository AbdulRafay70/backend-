from django.contrib import admin
from . import models


class SalaryHistoryInline(admin.TabularInline):
    model = models.SalaryHistory
    extra = 0
    readonly_fields = ('changed_on',)


class CommissionInline(admin.TabularInline):
    model = models.Commission
    extra = 0
    readonly_fields = ('created_at',)


class AttendanceInline(admin.TabularInline):
    model = models.Attendance
    extra = 0
    readonly_fields = ('working_hours',)


class MovementInline(admin.TabularInline):
    model = models.MovementLog
    extra = 0
    readonly_fields = ('duration', 'created_at')


class PunctualityInline(admin.TabularInline):
    model = models.PunctualityRecord
    extra = 0


@admin.register(models.Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('id', 'first_name', 'last_name', 'role', 'salary', 'is_active')
    list_filter = ('role', 'is_active')
    search_fields = ('first_name', 'last_name', 'role')
    list_editable = ('is_active',)
    inlines = (SalaryHistoryInline, CommissionInline, AttendanceInline, MovementInline, PunctualityInline)


@admin.register(models.SalaryHistory)
class SalaryHistoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'employee', 'previous_salary', 'new_salary', 'changed_on')
    search_fields = ('employee__first_name', 'employee__last_name')


@admin.register(models.Commission)
class CommissionAdmin(admin.ModelAdmin):
    list_display = ('id', 'employee', 'booking_id', 'amount', 'status', 'date')
    list_filter = ('status',)
    search_fields = ('employee__first_name', 'employee__last_name', 'booking_id')


@admin.register(models.Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('id', 'employee', 'date', 'status', 'check_in', 'check_out', 'working_hours')
    list_filter = ('status',)
    search_fields = ('employee__first_name', 'employee__last_name')


@admin.register(models.MovementLog)
class MovementLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'employee', 'start_time', 'end_time', 'reason')
    search_fields = ('employee__first_name', 'employee__last_name', 'reason')


@admin.register(models.PunctualityRecord)
class PunctualityAdmin(admin.ModelAdmin):
    list_display = ('id', 'employee', 'date', 'record_type', 'minutes')
    list_filter = ('record_type',)
    search_fields = ('employee__first_name', 'employee__last_name')
