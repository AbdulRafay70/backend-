from django.conf import settings
from django.db import models


class CommissionGroup(models.Model):
    """Groups for categorizing employees by commission structure"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Commission percentage")
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name


class Employee(models.Model):
    # Basic Information
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150, blank=True)
    email = models.EmailField(max_length=254, blank=True, null=True)
    phone = models.CharField(max_length=32, blank=True, null=True)
    whatsapp = models.CharField(max_length=32, blank=True, null=True, help_text="WhatsApp number")
    address = models.TextField(blank=True, null=True)
    other_contact_number = models.CharField(max_length=32, blank=True, null=True)
    contact_name = models.CharField(max_length=150, blank=True, null=True, help_text="Emergency contact name")
    
    # Role & Organization
    role = models.CharField(max_length=100, blank=True)
    branch = models.ForeignKey('organization.Branch', on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    commission_group = models.ForeignKey(CommissionGroup, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    
    # Office Schedule
    check_in_time = models.TimeField(null=True, blank=True, help_text="Expected check-in time")
    check_out_time = models.TimeField(null=True, blank=True, help_text="Expected check-out time")
    grace_minutes = models.IntegerField(default=0, help_text="Grace period for late check-in (minutes)")
    
    # Salary Information
    salary = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, default='USD')
    salary_account_number = models.CharField(max_length=50, blank=True, null=True)
    salary_account_title = models.CharField(max_length=150, blank=True, null=True)
    salary_bank_name = models.CharField(max_length=100, blank=True, null=True)
    salary_payment_date = models.IntegerField(null=True, blank=True, help_text="Day of month (1-31) for salary payment")
    
    # Status & Timestamps
    joining_date = models.DateField(null=True, blank=True)
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
    STATUS = (
        ('on_time', 'On Time'),
        ('grace', 'Grace Period'),
        ('late', 'Late'),
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('half_day', 'Half Day')
    )

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendance')
    date = models.DateField()
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    working_hours = models.DurationField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default='present')
    notes = models.TextField(blank=True)
    
    # Approval fields for early checkout
    is_approved = models.BooleanField(default=False, help_text="Early checkout approval")
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_attendances')
    approval_notes = models.TextField(blank=True)

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


class LeaveRequest(models.Model):
    """Employee leave and early checkout requests requiring approval"""
    REQUEST_TYPE_CHOICES = (
        ('early_checkout', 'Early Checkout'),
        ('full_day', 'Full Day Leave'),
        ('partial_day', 'Partial Day Leave')
    )
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected')
    )
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_requests')
    request_type = models.CharField(max_length=20, choices=REQUEST_TYPE_CHOICES)
    date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_leaves')
    approval_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.employee} - {self.request_type} on {self.date}"


class Fine(models.Model):
    """Automatic fines for attendance violations"""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='fines')
    date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.CharField(max_length=255)
    applied_to_salary_month = models.DateField(null=True, blank=True, help_text="Month/year when fine was deducted")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date']
    
    def __str__(self):
        return f"Fine for {self.employee} - {self.amount} on {self.date}"


class SalaryPayment(models.Model):
    """Monthly salary + commission payment tracking with late payment tracking"""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('processing', 'Processing')
    )
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='salary_payments')
    month = models.IntegerField(help_text="Month (1-12)")
    year = models.IntegerField(help_text="Year")
    base_salary = models.DecimalField(max_digits=12, decimal_places=2)
    commission_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    fine_deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    net_amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="Base + Commission - Fines")
    
    # Payment tracking fields
    expected_payment_date = models.DateField(null=True, blank=True, help_text="Date when salary should be paid")
    actual_payment_date = models.DateField(null=True, blank=True, help_text="Date when salary was actually paid")
    days_late = models.IntegerField(default=0, help_text="Number of days payment was delayed")
    is_late = models.BooleanField(default=False, help_text="Whether payment was made after expected date")
    
    paid_date = models.DateTimeField(null=True, blank=True)  # Kept for backward compatibility
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('employee', 'month', 'year')
        ordering = ['-year', '-month']
    
    def __str__(self):
        return f"{self.employee} - {self.month}/{self.year} - {self.status}"
