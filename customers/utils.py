from typing import Optional, Tuple
from .models import Customer


def upsert_customer_from_data(
    full_name: Optional[str] = None,
    phone: Optional[str] = None,
    email: Optional[str] = None,
    passport_number: Optional[str] = None,
    branch=None,
    organization=None,
    source: str = "unknown",
    last_activity=None,
) -> Tuple[Customer, bool]:
    """Upsert a Customer record using available identifiers.

    Matching priority: phone -> email -> passport_number.

    Returns (customer, created_flag)
    """
    customer = None
    if phone:
        customer = Customer.objects.filter(phone=phone).first()
    if not customer and email:
        customer = Customer.objects.filter(email=email).first()
    if not customer and passport_number:
        customer = Customer.objects.filter(passport_number=passport_number).first()

    if customer:
        changed = False
        if full_name and customer.full_name != full_name:
            customer.full_name = full_name
            changed = True
        if branch and customer.branch != branch:
            customer.branch = branch
            changed = True
        if organization and customer.organization != organization:
            customer.organization = organization
            changed = True
        if last_activity:
            customer.last_activity = last_activity
            changed = True
        if changed:
            customer.save()
        return customer, False

    # create new
    customer = Customer.objects.create(
        full_name=full_name or "",
        phone=phone,
        email=email,
        passport_number=passport_number,
        branch=branch,
        organization=organization,
        source=source,
        last_activity=last_activity,
    )
    return customer, True
