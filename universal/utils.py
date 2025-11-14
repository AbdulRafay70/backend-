from django.db import transaction
from .models import UniversalIDSequence


PREFIX_MAP = {
    "organization": "ORG",
    "branch": "BRN",
    "agent": "AGT",
    "employee": "EMP",
}


def generate_prefixed_id(entity_type: str) -> str:
    """Generate an atomic, incrementing prefixed ID for the given entity_type.

    Uses the `UniversalIDSequence` row for the entity_type and updates it inside a
    transaction with select_for_update to avoid races under concurrency.

    Returns e.g. 'AGT-0001'.
    """
    key = entity_type.lower()
    prefix = PREFIX_MAP.get(key, key.upper()[:3])

    with transaction.atomic():
        seq_row, created = UniversalIDSequence.objects.select_for_update().get_or_create(
            type_key=key, defaults={"last_value": 0}
        )
        seq_row.last_value += 1
        seq_row.save()
        value = seq_row.last_value

    return f"{prefix}-{value:04d}"
