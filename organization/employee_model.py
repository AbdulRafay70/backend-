"""
Employee model - separate from User model
Employees are linked to Branch → Organization chain (NOT through Agency)
"""
from django.db import models
from django.contrib.auth.models import User
from .models import Agency, Branch, Organization


class Employee(models.Model):
    """
    Employee model - separate table for employee management
    Links: Employee → Branch → Organization
    Employees are independent entities with their own bookings/ledger
    """
    
    # Link to Django User for authentication
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile')
    
    # Personal Information
    employee_code = models.CharField(max_length=20, unique=True, editable=False, null=True, blank=True, 
                                     help_text="Auto-generated code like EMP-0001")
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    
    # Employment Details - Employee belongs to BRANCH (not Agency)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='employees', 
                               help_text="Branch this employee belongs to")
    date_joined = models.DateField(auto_now_add=True)
    date_of_birth = models.DateField(null=True, blank=True)
    
    # Employment Status
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('on_leave', 'On Leave'),
        ('terminated', 'Terminated'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Position/Role
    position = models.CharField(max_length=100, blank=True, null=True, help_text="Job title or position")
    department = models.CharField(max_length=100, blank=True, null=True)
    
    # Salary/Commission
    salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, 
                                          help_text="Commission percentage")
    
    # Additional Information
    profile_photo = models.ImageField(upload_to='employee_photos/', blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                   related_name='created_employees')
    
    class Meta:
        verbose_name = "Employee"
        verbose_name_plural = "Employees"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['employee_code']),
            models.Index(fields=['email']),
            models.Index(fields=['branch']),
            models.Index(fields=['status']),
        ]
    
    def save(self, *args, **kwargs):
        # Auto-generate employee code if not set
        if not self.employee_code:
            from .utils import generate_organization_id
            self.employee_code = generate_organization_id("employee")
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.employee_code})"
    
    @property
    def full_name(self):
        """Get employee's full name"""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def organization(self):
        """Get the organization through branch"""
        return self.branch.organization if self.branch else None
