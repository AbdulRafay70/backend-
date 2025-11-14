from django.db.models import Q


def apply_user_scope(queryset, user):
    """Apply organization/branch/agency scope to a queryset based on user memberships.

    Rules:
      - staff or superuser: return queryset unchanged (full access)
      - otherwise: allow bookings where user is the creator OR
        organization in user.organizations OR branch in user.branches OR agency in user.agencies

    Returns a filtered queryset.
    """
    if user is None or not getattr(user, "is_authenticated", False):
        # unauthenticated: no access
        return queryset.none()

    # superusers/staff see all
    if user.is_superuser or user.is_staff:
        return queryset

    # collect memberships (ManyToMany related_name used in organization models)
    orgs = getattr(user, "organizations", None)
    brns = getattr(user, "branches", None)
    ags = getattr(user, "agencies", None)

    q = Q(user=user)

    if orgs is not None:
        try:
            org_ids = list(orgs.values_list("id", flat=True))
        except Exception:
            org_ids = []
        if org_ids:
            q |= Q(organization_id__in=org_ids)

    if brns is not None:
        try:
            brn_ids = list(brns.values_list("id", flat=True))
        except Exception:
            brn_ids = []
        if brn_ids:
            q |= Q(branch_id__in=brn_ids)

    if ags is not None:
        try:
            ag_ids = list(ags.values_list("id", flat=True))
        except Exception:
            ag_ids = []
        if ag_ids:
            q |= Q(agency_id__in=ag_ids)

    return queryset.filter(q)
