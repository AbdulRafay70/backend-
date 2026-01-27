
from decimal import Decimal

def get_reseller_markup_group(user, item_owner_org_id):
    """
    Determine if the current user represents a reseller for the given item.
    Returns the Markup object if:
    1. User is authenticated and belongs to an organization.
    2. User's organization is NOT the item owner (Reseller case).
    3. User's organization has a markup group assigned.
    """
    if not user or not user.is_authenticated:
        return None
    
    # Assuming user.profile or similar structure exists, but relying on user.organizations for now
    # In this system, user.organizations is a ManyToMany, but typically for B2B portal context,
    # we might check the specific org context (e.g. from header or session). 
    # However, loosely, if the user only has one org (common for agents), use that.
    
    # For agents/subagents, we can often rely on user.agencies or user.branches
    # Let's try to find the "acting" organization.
    
    reseller_org = None
    
    # Strategy 1: If user has an agency profile
    if hasattr(user, 'agencies') and user.agencies.exists():
         # Agent context
         agency = user.agencies.first() # Simplification
         if agency and agency.branch and agency.branch.organization:
             reseller_org = agency.branch.organization
    
    # Strategy 2: If user has direct org link (Employee)
    elif hasattr(user, 'organizations') and user.organizations.exists():
        reseller_org = user.organizations.first()
        
    if not reseller_org:
        return None
        
    # Check if this is the owner (No markup for owner viewing own items)
    if reseller_org.id == item_owner_org_id:
        return None
        
    return getattr(reseller_org, 'markup_group', None)


def apply_package_markup(prices_dict, markup_group):
    """
    Apply flat Umrah Package markup to the pricing dictionary.
    
    Args:
        prices_dict (dict): The 'package_selling_prices' dictionary.
        markup_group (Markup): The markup configuration.
        
    Returns:
        dict: A NEW dictionary with markups added (does not mutate input).
    """
    if not markup_group or not markup_group.umrah_package_markup:
        return prices_dict

    markup_amount = float(markup_group.umrah_package_markup)
    if markup_amount <= 0:
        return prices_dict
        
    new_prices = {}
    
    # Recursive helper to handle nested dicts (like 'child_with_bed')
    def apply_recursive(data):
        result = {}
        for key, value in data.items():
            if isinstance(value, dict):
                result[key] = apply_recursive(value)
            elif isinstance(value, (int, float, Decimal)):
                result[key] = float(value) + markup_amount
            else:
                result[key] = value
        return result

    return apply_recursive(prices_dict)


def apply_hotel_markup(hotel_id, prices_list, markup_group):
    """
    Apply Hotel markup to a list of price objects.
    
    Args:
        hotel_id (int): ID of the hotel.
        prices_list (list): List of dicts, each containing 'room_type' and 'selling_price'.
        markup_group (Markup): The markup configuration.
        
    Returns:
        list: Modified list of price dicts.
    """
    if not markup_group:
        return prices_list
        
    # Check for specific hotel markup
    specific_markup = None
    if hasattr(markup_group, 'hotel_markups'):
        # This prefetches if related name used, otherwise we query
        # Since this is a util, we might trigger a query. 
        # Ideally, we'd preload this, but for now simple query:
        specific_markup = markup_group.hotel_markups.filter(hotel_id=hotel_id).first()
        
    markup_values = {}
    default_markup = float(markup_group.hotel_per_night_markup or 0)

    if specific_markup:
        # Map room types to their specific markup fields
        markup_values = {
            'quint': specific_markup.quint,
            'quad': specific_markup.quad,
            'triple': specific_markup.triple,
            'double': specific_markup.double,
            'sharing': specific_markup.sharing,
            'single': specific_markup.other, # Map single to other/specific if field exists? specific_markup.other is fallback
             # Note: model has 'other'. Let's use 'other' for everything else.
        }
        fallback_specific = specific_markup.other
    else:
        fallback_specific = default_markup

    new_prices = []
    
    for item in prices_list:
        new_item = item.copy()
        
        # Determine room type key
        rt = str(new_item.get('room_type', '')).lower()
        
        # Determine markup amount
        if specific_markup:
            amount = markup_values.get(rt, fallback_specific)
        else:
            amount = default_markup
            
        current_price = float(new_item.get('selling_price', 0) or 0)
        new_item['selling_price'] = current_price + float(amount)
        
        # Ensure purchase price is NOT touched
        # (It remains as is in the dict)
        
        new_prices.append(new_item)
        
    return new_prices


def apply_ticket_markup(ticket_dict, markup_group):
    """
    Apply Ticket markup to a serialized ticket dict.
    
    Args:
        ticket_dict (dict): Serialized ticket data with *_selling_price fields.
        markup_group (Markup): The markup configuration.
        
    Returns:
        dict: Modified ticket dict.
    """
    if not markup_group or not markup_group.ticket_markup:
        return ticket_dict
        
    markup_amount = float(markup_group.ticket_markup)
    if markup_amount <= 0:
        return ticket_dict
        
    new_ticket = ticket_dict.copy()
    
    for field in ['adult_selling_price', 'child_selling_price', 'infant_selling_price']:
        if field in new_ticket and new_ticket[field] is not None:
            new_ticket[field] = float(new_ticket[field]) + markup_amount
            
    return new_ticket

def apply_breakdown_markup(breakdown_dict, markup_group):
    """
    Apply markup to package total price breakdown.
    Breakdown keys are like: '1_adult', '2_adults', '1_adult_1_child', '2_adults_1_child_1_infant'
    Markup is per-head, so we parsed the key to find total pax.
    """
    if not markup_group or not markup_group.umrah_package_markup:
        return breakdown_dict
        
    markup = float(markup_group.umrah_package_markup)
    new_breakdown = {}
    
    import re
    
    for key, value in breakdown_dict.items():
        # Parse pax counts from key
        # e.g. "2_adults_1_child" -> 2+1=3 pax
        pax_count = 0
        
        # Regex to find all numbers preceding keywords (adult, child, infant)
        # matches "2" in "2_adults"
        matches = re.findall(r'(\d+)_', key)
        if matches:
            pax_count = sum(int(m) for m in matches)
        else:
            # Fallback if key format is simpler or different (e.g. '1_adult' might match '1_')
            # If key starts with digit
            if key and key[0].isdigit():
                 try:
                     parts = key.split('_')
                     # Sum all parts that are digits
                     pax_count = sum(int(p) for p in parts if p.isdigit())
                 except:
                     pass
        
        if pax_count > 0:
            new_breakdown[key] = float(value) + (markup * pax_count)
        else:
            new_breakdown[key] = value
            
    return new_breakdown
