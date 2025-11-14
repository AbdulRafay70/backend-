from django.db import models
from django.utils import timezone


class SystemLog(models.Model):
    STATUS_CHOICES = (("success", "Success"), ("failed", "Failed"))

    timestamp = models.DateTimeField(auto_now_add=True)
    action_type = models.CharField(max_length=100)
    model_name = models.CharField(max_length=100)
    record_id = models.BigIntegerField(null=True, blank=True)
    organization_id = models.BigIntegerField(null=True, blank=True)
    branch_id = models.BigIntegerField(null=True, blank=True)
    agency_id = models.BigIntegerField(null=True, blank=True)
    user_id = models.BigIntegerField(null=True, blank=True)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    old_data = models.JSONField(null=True, blank=True)
    new_data = models.JSONField(null=True, blank=True)

    class Meta:
        db_table = "system_logs"
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.timestamp.isoformat()} {self.action_type} {self.model_name}#{self.record_id or ''}"
