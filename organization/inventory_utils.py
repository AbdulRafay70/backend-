"""Helpers for inventory/resell rules.

This small utility centralizes the logic determining whether an
inventory item (ticket/hotel/package) can be resold for a given
requesting organization.

The rule used here (reasonable default):
- Item-level flag `reselling_allowed` must be True.
- If `inventory_owner_organization_id` is set, only other organizations
  (i.e. org_id != inventory_owner_organization_id) are considered resellers.
  If inventory_owner_organization_id is None, any organization may resell
  when `reselling_allowed` is True.

Feel free to adjust the policy if you have a different business rule.
"""
from typing import Optional


def can_resell(item, requesting_org_id: Optional[int] = None) -> bool:
    """Return True if `item` can be resold by organization `requesting_org_id`.

    item: model instance (Ticket, Hotels, or UmrahPackage)
    requesting_org_id: id (or string) of the org attempting to resell.
    
    For Tickets: uses reselling_allowed field
    For Hotels: checks if any price has is_sharing_allowed=True
    For Packages: checks if any hotel in the package has is_sharing_allowed=True
    """
    try:
        from tickets.models import Hotels
        from packages.models import UmrahPackage
        
        # Handle different item types
        if isinstance(item, Hotels):
            # For hotels, use reselling_allowed field
            if not getattr(item, "reselling_allowed", False):
                return False
            # For hotels, use organization_id as owner
            owner_id = getattr(item, "organization_id", None)
        else:
            # For packages and tickets, use reselling_allowed field
            if not getattr(item, "reselling_allowed", False):
                return False
            # For packages and tickets, use inventory_owner_organization_id if set, otherwise organization_id
            owner_id = getattr(item, "inventory_owner_organization_id", None) or getattr(item, "organization_id", None)
        if owner_id in (None, "", 0):
            # No explicit owner -> allowed for any org
            return True

        # Compare as string/int tolerant
        if requesting_org_id is None:
            # No org provided: conservatively return False (cannot infer)
            return False

        try:
            return str(owner_id) != str(requesting_org_id)
        except Exception:
            return True
    except Exception:
        return False
