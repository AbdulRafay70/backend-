from decimal import Decimal
from django.db.models import Q

def get_viewer_org(request):
    """
    Helper to determine the organization of the current viewer (user).
    """
    if not request or not request.user.is_authenticated:
        return None
    
    user = request.user
    
    # 1. Agency Context (Agent/Subagent)
    if hasattr(user, 'agencies') and user.agencies.exists():
        agency = user.agencies.first()
        if agency and agency.branch and agency.branch.organization:
            return agency.branch.organization
            
    # 2. Employee Context (Organization Staff)
    if hasattr(user, 'organizations') and user.organizations.exists():
        return user.organizations.first()
        
    return None

def is_reselling_allowed(item, reseller_org):
    """
    Check if the reseller_org is allowed to resell the given item.
    
    Args:
        item: Model instance (UmrahPackage, Hotel, Ticket).
        reseller_org: Organization object (the potential reseller).
        
    Returns:
        bool: True if reselling is allowed, False otherwise.
    """
    if not item or not reseller_org:
        return False
        
    # Owner Logic: Owner can always "resell" (view) their own items
    # Note: Logic usually skips markup/discount for owner, but availability check passes.
    owner_id = getattr(item, 'inventory_owner_organization_id', None) or \
               getattr(item, 'owner_organization_id', None)
               
    if not owner_id:
        # Fallback to direct organization link if fields missing
        if hasattr(item, 'organization') and item.organization:
            owner_id = item.organization.id
            
    if owner_id == reseller_org.id:
        return True
    
    # Check item-level allowed flag
    if not getattr(item, 'reselling_allowed', False):
        return False
        
    # Check AllowedReseller permissions
    # We need to find the link between Owner and Reseller
    # This usually sits in 'AllowedReseller' model in booking/organization app
    try:
        from booking.models import AllowedReseller
        
        # Check for explicit permission
        # The owner company is the one who created the link request (usually) or accepted it.
        # But AllowedReseller links OrganizationLink -> Reseller Company.
        # We need to find valid OrganizationLink first? 
        # Simpler approach: Check AllowedReseller where reseller_company = reseller_org
        # AND inventory_owner_company points to the owner_id.
        
        allowed = AllowedReseller.objects.filter(
            reseller_company=reseller_org,
            requested_status_by_reseller='ACCEPTED',
            # We need to traverse: AllowedReseller -> OrganizationLink -> organization_id (Owner)
            inventory_owner_company__organization_id=owner_id 
        ).exists()
        
        return allowed
        
    except Exception:
        # If model missing or query fails, assume False safety default
        return False

def get_applicable_discount_group(item, reseller_org):
    """
    Retrieve the valid DiscountGroup for a reseller on a specific item.
    Enforces strict ownership rule: DiscountGroup must belong to the Item Owner.
    """
    try:
        from booking.models import AllowedReseller
        
        owner_id = getattr(item, 'inventory_owner_organization_id', None) or \
                   getattr(item, 'owner_organization_id', None) or \
                   (item.organization.id if hasattr(item, 'organization') else None)
                   
        if not owner_id:
            return None

        # 1. Check AllowedReseller link (Priority)
        allowed_record = AllowedReseller.objects.filter(
            reseller_company=reseller_org,
            requested_status_by_reseller='ACCEPTED',
            inventory_owner_company__organization_id=owner_id
        ).first()
        
        if allowed_record and allowed_record.discount_group:
            if allowed_record.discount_group.is_active:
                return allowed_record.discount_group

        # 2. Fallback: Check if Reseller Organization has a Discount Group assigned directly
        # STRICT OWNERSHIP RULE: Discount Group must belong to Owner Org
        org_discount_group = getattr(reseller_org, 'discount_group', None)
        if org_discount_group and org_discount_group.is_active:
            if org_discount_group.organization_id == owner_id:
                return org_discount_group
            
        return None
        
    except Exception:
        return None

# ==========================================
# MARKUP FUNCTIONS (Reseller Controlled)
# ==========================================

def apply_package_markup(prices_dict, markup_group):
    """Apply flat markup to package selling prices."""
    if not markup_group or not markup_group.umrah_package_markup:
        return prices_dict

    markup = float(markup_group.umrah_package_markup)
    if markup <= 0:
        return prices_dict

    def apply_recursive(data):
        result = {}
        for key, value in data.items():
            if isinstance(value, dict):
                result[key] = apply_recursive(value)
            elif isinstance(value, (int, float, Decimal)):
                # ONLY apply to selling prices, never purchase/cost
                if 'purchase' not in key and 'cost' not in key:
                     result[key] = float(value) + markup
                else:
                     result[key] = value
            else:
                result[key] = value
        return result

    return apply_recursive(prices_dict)

def apply_hotel_markup(hotel_id, prices_list, markup_group):
    """Apply hotel markup only to selling_price."""
    if not markup_group:
        return prices_list

    # Check specific hotel markup
    specific = None
    if hasattr(markup_group, 'hotel_markups'):
        specific = markup_group.hotel_markups.filter(hotel_id=hotel_id).first()

    default_val = float(markup_group.hotel_per_night_markup or 0)
    
    markup_map = {}
    if specific:
        markup_map = {
            'quint': specific.quint, 'quad': specific.quad, 
            'triple': specific.triple, 'double': specific.double, 
            'sharing': specific.sharing, 'single': specific.other
        }
        fallback = specific.other
    else:
        fallback = default_val

    new_prices = []
    for item in prices_list:
        new_item = item.copy()
        rt = str(new_item.get('room_type', '')).lower()
        amount = markup_map.get(rt, fallback)
        
        if new_item.get('selling_price') is not None:
             new_item['selling_price'] = float(new_item['selling_price']) + float(amount)
             
        new_prices.append(new_item)
    return new_prices

def apply_ticket_markup(ticket_dict, markup_group):
    """Apply ticket markup to selling prices."""
    if not markup_group or not markup_group.ticket_markup:
        return ticket_dict

    markup = float(markup_group.ticket_markup)
    if markup <= 0:
        return ticket_dict

    new_ticket = ticket_dict.copy()
    for field in ['adult_selling_price', 'child_selling_price', 'infant_selling_price']:
        if field in new_ticket and new_ticket[field] is not None:
            new_ticket[field] = float(new_ticket[field]) + markup
            
    return new_ticket

# ==========================================
# DISCOUNT FUNCTIONS (Owner Controlled)
# ==========================================

def apply_package_discount(prices_dict, discount_group):
    """
    Apply flat discount to package selling prices.
    Scope: All selling prices in the dict.
    """
    if not discount_group:
        return prices_dict
        
    # Find relevant discount rule
    discount_rule = discount_group.discounts.filter(
        things='umrah_package'
    ).first()
    
    if not discount_rule or not discount_rule.umrah_package_discount_amount:
        return prices_dict
        
    discount = float(discount_rule.umrah_package_discount_amount)
    
    def apply_recursive(data):
        result = {}
        for key, value in data.items():
            if isinstance(value, dict):
                result[key] = apply_recursive(value)
            elif isinstance(value, (int, float, Decimal)):
                # Strict Scope: Selling Prices Only
                if 'purchase' not in key and 'cost' not in key:
                    result[key] = max(0.0, float(value) - discount)
                else:
                    result[key] = value
            else:
                result[key] = value
        return result
        
    return apply_recursive(prices_dict)

def apply_hotel_discount(hotel_id, prices_list, discount_group):
    """
    Apply flat discount to hotel selling prices.
    Scope: Specific hotel check required. Match by room type.
    """
    if not discount_group:
        return prices_list
        
    # Find ALL relevant discount rules for this hotel
    discount_rules = discount_group.discounts.filter(
        things='hotel',
        discounted_hotels__id=hotel_id
    )
    
    if not discount_rules.exists():
        return prices_list

    # Map room types to their discount amounts
    # Priority: Specific room type > 'all'
    discount_map = {}
    
    for rule in discount_rules:
        room_type = (rule.room_type or 'all').lower()
        amount = float(rule.per_night_discount or 0)
        
        # If we already have a specific rule, don't overwrite with 'all'
        # If we have 'all', overwrite/set it. 
        # Actually, simpler: Store specific rules. If 'all' exists, apply to missing.
        if room_type not in discount_map:
             discount_map[room_type] = amount
        elif room_type != 'all':
             # specific overrides existing (assume latest/first valid)
             discount_map[room_type] = amount

    new_prices = []
    for item in prices_list:
        new_item = item.copy()
        item_room_type = str(new_item.get('room_type', '')).lower()
        
        # Determine applicable discount
        discount_amount = 0.0
        
        if item_room_type in discount_map:
            discount_amount = discount_map[item_room_type]
        elif 'all' in discount_map:
            discount_amount = discount_map['all']
            
        if discount_amount > 0 and new_item.get('selling_price') is not None:
            original = float(new_item['selling_price'])
            new_item['selling_price'] = max(0.0, original - discount_amount)
            
        new_prices.append(new_item)
        
    return new_prices

def apply_ticket_discount(ticket_dict, discount_group):
    """
    Apply flat discount to ticket selling prices.
    Scope: adult/child/infant_selling_price.
    """
    if not discount_group:
        return ticket_dict
        
    discount_rule = discount_group.discounts.filter(
        things='group_ticket'
    ).first()
    
    if not discount_rule or not discount_rule.group_ticket_discount_amount:
        return ticket_dict
        
    discount = float(discount_rule.group_ticket_discount_amount)
    
    new_ticket = ticket_dict.copy()
    fields = ['adult_selling_price', 'child_selling_price', 'infant_selling_price']
    
    for field in fields:
        if field in new_ticket and new_ticket[field] is not None:
            new_ticket[field] = max(0.0, float(new_ticket[field]) - discount)
            
    return new_ticket

# ==========================================
# MASTER PIPELINE
# ==========================================

def calculate_final_price(request, data, item_type, item_obj):
    """
    Master pipeline to compute Final Price.
    Formula: Base + Markup - Discount
    
    Args:
        request: HTTP request (to identify viewer).
        data: Serialized data containing base prices.
        item_type: 'package', 'hotel', 'ticket'.
        item_obj: The actual model instance.
    """
    viewer_org = get_viewer_org(request)
    
    if not item_obj:
        return data
        
    owner_id = getattr(item_obj, 'inventory_owner_organization_id', None) or \
               getattr(item_obj, 'owner_organization_id', None) or \
               (item_obj.organization.id if hasattr(item_obj, 'organization') else None)
    
    # Condition 1: Viewer IS the Owner
    # Show Base Prices (No Markup, No Discount)
    if viewer_org and owner_id and viewer_org.id == owner_id:
        return data
        
    # Condition 2: Anonymous User
    # Typically show Base Prices or specific public logic. 
    # For B2B engine, we usually return base if no reseller context.
    if not viewer_org:
        return data

    # Condition 3: Reselling Not Allowed
    if not is_reselling_allowed(item_obj, viewer_org):
        # Requirement implies strict permission. 
        # If not allowed, they shouldn't even see it, but if they do, 
        # show Base Price (safe default) or handle as error?
        # We return Base Price to avoid breaking UI, but usually this is filtered at ViewSet level.
        return data

    # === PIPELINE EXECUTION ===
    
    final_data = data
    
    # 1. MARKUP (Reseller Controlled)
    markup_group = getattr(viewer_org, 'markup_group', None)
    
    if markup_group:
        if item_type == 'package':
            # Packages have 'package_selling_prices' dict
            if 'package_selling_prices' in final_data:
                final_data['package_selling_prices'] = apply_package_markup(
                    final_data['package_selling_prices'], markup_group
                )
                
        elif item_type == 'hotel':
            # Hotels are a list of price objects (in list serializer) or single (detail)
            # data is usually the list itself or dict containing list?
            # Adjust based on serializer structure. 
            # Assuming 'data' IS the price list or contains it.
            # HotelsSerializer(many=True) -> data is list of hotels?
            # Actually this function is usually called per-item in to_representation.
            
            # Case A: Hotel Detail (prices is list)
            if 'prices' in final_data and isinstance(final_data['prices'], list):
                 final_data['prices'] = apply_hotel_markup(
                     item_obj.id, final_data['prices'], markup_group
                 )
                 
        elif item_type == 'ticket':
            final_data = apply_ticket_markup(final_data, markup_group)

    # 2. DISCOUNT (Owner Controlled)
    discount_group = get_applicable_discount_group(item_obj, viewer_org)
    
    if discount_group:
        if item_type == 'package':
            if 'package_selling_prices' in final_data:
                final_data['package_selling_prices'] = apply_package_discount(
                    final_data['package_selling_prices'], discount_group
                )
                
        elif item_type == 'hotel':
             if 'prices' in final_data and isinstance(final_data['prices'], list):
                 final_data['prices'] = apply_hotel_discount(
                     item_obj.id, final_data['prices'], discount_group
                 )
                 
        elif item_type == 'ticket':
            final_data = apply_ticket_discount(final_data, discount_group)
            
    return final_data
