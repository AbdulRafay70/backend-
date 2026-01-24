from decimal import Decimal
from .models import ServiceChargeRule, HotelServiceCharge
from organization.models import Branch


def get_branch_service_charge_rule(branch_id):
    """
    Get service charge rule for a branch.
    
    Args:
        branch_id: Branch ID
        
    Returns:
        ServiceChargeRule instance or None
    """
    try:
        branch = Branch.objects.select_related('service_charge_group').get(id=branch_id)
        return branch.service_charge_group
    except Branch.DoesNotExist:
        return None


def calculate_ticket_service_charge(branch_id, base_price):
    """
    Calculate service charge for tickets.
    
    Args:
        branch_id: Branch ID
        base_price: Base ticket price
        
    Returns:
        dict with base_price, service_charge, final_price
    """
    rule = get_branch_service_charge_rule(branch_id)
    
    if not rule or not rule.active:
        return {
            'base_price': Decimal(str(base_price)),
            'service_charge': Decimal('0.00'),
            'final_price': Decimal(str(base_price))
        }
    
    base_price = Decimal(str(base_price))
    
    if rule.ticket_charge_type == 'fixed':
        service_charge = rule.ticket_charge_value
    else:  # percentage
        service_charge = (base_price * rule.ticket_charge_value) / Decimal('100')
    
    return {
        'base_price': base_price,
        'service_charge': service_charge,
        'final_price': base_price + service_charge,
        'charge_type': rule.ticket_charge_type
    }


def calculate_package_service_charge(branch_id, base_price):
    """
    Calculate service charge for packages (fixed only).
    
    Args:
        branch_id: Branch ID
        base_price: Base package price
        
    Returns:
        dict with base_price, service_charge, final_price
    """
    rule = get_branch_service_charge_rule(branch_id)
    
    if not rule or not rule.active:
        return {
            'base_price': Decimal(str(base_price)),
            'service_charge': Decimal('0.00'),
            'final_price': Decimal(str(base_price))
        }
    
    base_price = Decimal(str(base_price))
    service_charge = rule.package_charge_value
    
    return {
        'base_price': base_price,
        'service_charge': service_charge,
        'final_price': base_price + service_charge
    }


def calculate_hotel_service_charge(branch_id, hotel_id, room_type, base_price_per_night, nights=1):
    """
    Calculate service charge for hotels based on room type.
    
    Args:
        branch_id: Branch ID
        hotel_id: Hotel ID
        room_type: Room type (quint, quad, triple, double, sharing, other)
        base_price_per_night: Base price per night
        nights: Number of nights (default: 1)
        
    Returns:
        dict with pricing breakdown
    """
    rule = get_branch_service_charge_rule(branch_id)
    
    base_price_per_night = Decimal(str(base_price_per_night))
    
    if not rule or not rule.active:
        return {
            'base_price_per_night': base_price_per_night,
            'service_charge_per_night': Decimal('0.00'),
            'final_price_per_night': base_price_per_night,
            'total_service_charge': Decimal('0.00'),
            'total_final_price': base_price_per_night * nights
        }
    
    # Find hotel service charge for this hotel
    hotel_charge = HotelServiceCharge.objects.filter(
        service_charge_rule=rule,
        active=True,
        hotel_ids__contains=hotel_id
    ).first()
    
    if not hotel_charge:
        return {
            'base_price_per_night': base_price_per_night,
            'service_charge_per_night': Decimal('0.00'),
            'final_price_per_night': base_price_per_night,
            'total_service_charge': Decimal('0.00'),
            'total_final_price': base_price_per_night * nights
        }
    
    # Get charge based on room type
    room_type_charges = {
        'quint': hotel_charge.quint_charge,
        'quad': hotel_charge.quad_charge,
        'triple': hotel_charge.triple_charge,
        'double': hotel_charge.double_charge,
        'sharing': hotel_charge.sharing_charge,
        'other': hotel_charge.other_charge
    }
    
    service_charge_per_night = room_type_charges.get(room_type.lower(), Decimal('0.00'))
    total_service_charge = service_charge_per_night * nights
    
    return {
        'base_price_per_night': base_price_per_night,
        'service_charge_per_night': service_charge_per_night,
        'final_price_per_night': base_price_per_night + service_charge_per_night,
        'total_service_charge': total_service_charge,
        'total_final_price': (base_price_per_night + service_charge_per_night) * nights
    }
