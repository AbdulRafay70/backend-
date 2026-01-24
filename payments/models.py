from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Consumer(models.Model):
    """KuickPay Consumer/Bill Model"""
    
    BILL_STATUS_CHOICES = [
        ('U', 'Unpaid'),
        ('P', 'Paid'),
        ('B', 'Blocked/Expired'),
    ]
    
    consumer_number = models.CharField(max_length=20, unique=True, db_index=True)
    consumer_name = models.CharField(max_length=255)
    reason = models.CharField(max_length=500)
    expiry_date = models.DateField()
    email_address = models.EmailField()
    contact_number = models.CharField(max_length=20)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    bill_status = models.CharField(max_length=1, choices=BILL_STATUS_CHOICES, default='U')
    
    # Tracking fields
    created_by = models.CharField(max_length=255)
    created_by_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='consumers_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'kuickpay_consumers'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['consumer_number']),
            models.Index(fields=['bill_status']),
            models.Index(fields=['expiry_date']),
        ]
    
    def __str__(self):
        return f"{self.consumer_number} - {self.consumer_name}"
    
    def save(self, *args, **kwargs):
        # Auto-update status to Blocked if expiry date has passed
        from django.utils import timezone
        if self.expiry_date < timezone.now().date() and self.bill_status == 'U':
            self.bill_status = 'B'
        super().save(*args, **kwargs)
