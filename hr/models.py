from django.conf import settings
from django.db import models


class Employee(models.Model):
    first_name = models.CharField(max_length=150)
    email = models.EmailField(max_length=254, blank=True, null=True)
    phone = models.CharField(max_length=32, blank=True, null=True)
    last_name = models.CharField(max_length=150, blank=True)
    role = models.CharField(max_length=100, blank=True)
    joining_date = models.DateField(null=True, blank=True)
    salary = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, default='USD')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-id']

    def __str__(self):
        if self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name


class SalaryHistory(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='salary_history')
    previous_salary = models.DecimalField(max_digits=12, decimal_places=2)
    new_salary = models.DecimalField(max_digits=12, decimal_places=2)
    changed_on = models.DateTimeField(auto_now_add=True)
    reason = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['-changed_on']


class Commission(models.Model):
    STATUS_CHOICES = (('unpaid', 'Unpaid'), ('paid', 'Paid'), ('reversed', 'Reversed'))

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='commissions')
    booking_id = models.CharField(max_length=128, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unpaid')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']


class Attendance(models.Model):
    STATUS = (('present', 'Present'), ('absent', 'Absent'), ('half_day', 'Half Day'), ('late', 'Late'))

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendance')
    date = models.DateField()
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    working_hours = models.DurationField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default='present')
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ('employee', 'date')
        ordering = ['-date']


class MovementLog(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='movements')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    reason = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def duration(self):
        if self.end_time and self.start_time:
            return self.end_time - self.start_time
        return None


class PunctualityRecord(models.Model):
    TYPE = (('late', 'Late'), ('early_leave', 'Early Leave'), ('absence', 'Absence'))

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='punctuality')
    date = models.DateField()
    record_type = models.CharField(max_length=20, choices=TYPE)
    minutes = models.IntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
