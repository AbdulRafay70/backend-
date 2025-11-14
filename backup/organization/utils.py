from django.db import transaction, models


class OrganizationIDSequence(models.Model):
    """Track last ID sequence for each entity type in organization app."""
    type_key = models.CharField(max_length=20, unique=True, primary_key=True)
    last_value = models.IntegerField(default=0)

    class Meta:
        app_label = 'organization'

    def __str__(self):
        return f"{self.type_key}: {self.last_value}"


PREFIX_MAP = {
    "organization": "ORG",
    "branch": "BRN", 
    "agency": "AGN",
    "employee": "EMP",
}


def generate_organization_id(entity_type: str) -> str:
    """Generate an atomic, incrementing prefixed ID for organization entities.
    
    Uses OrganizationIDSequence to track counters with select_for_update 
    to prevent race conditions under concurrent requests.
    
    Examples:
        - Organization: ORG-0001, ORG-0002, ...
        - Branch: BRN-0001, BRN-0002, ...
        - Agency: AGN-0001, AGN-0002, ...
        - Employee: EMP-0001, EMP-0002, ...
    
    Args:
        entity_type: Type of entity (organization, branch, agency, employee)
        
    Returns:
        Formatted ID string like 'ORG-0001'
    """
    key = entity_type.lower()
    prefix = PREFIX_MAP.get(key, key.upper()[:3])
    
    with transaction.atomic():
        seq_row, created = OrganizationIDSequence.objects.select_for_update().get_or_create(
            type_key=key,
            defaults={"last_value": 0}
        )
        seq_row.last_value += 1
        seq_row.save()
        value = seq_row.last_value
    
    return f"{prefix}-{value:04d}"
