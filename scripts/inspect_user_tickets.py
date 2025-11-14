# Script to inspect tickets visible to a given user and debug org isolation
# Run with: python manage.py shell -c "from pathlib import Path; exec(Path('scripts/inspect_user_tickets.py').read_text())"

from django.contrib.auth import get_user_model
from tickets.models import Ticket
from users.models import GroupExtension
from django.db.models import Q
from django.utils import timezone

EMAIL = 'abdulrafay@gmail.com'  # change if needed

User = get_user_model()

try:
    user = User.objects.get(email=EMAIL)
except User.DoesNotExist:
    print('User not found:', EMAIL)
    raise SystemExit(1)

print('User:', user.id, user.get_full_name() or user.username, 'is_superuser=', user.is_superuser)

# Groups
groups = user.groups.all()
print('Groups:', [g.name for g in groups])

# GroupExtension (first group)
org_from_group = None
if groups.exists():
    g = groups.first()
    try:
        ext = GroupExtension.objects.filter(group=g).first()
        if ext:
            org_from_group = getattr(ext, 'organization_id', None)
            print('GroupExtension.organization_id =', org_from_group)
        else:
            print('Group has no GroupExtension')
    except Exception as e:
        print('Error reading GroupExtension:', e)

# Also check user.organizations if present
try:
    orgs = getattr(user, 'organizations', None)
    if orgs is not None:
        org_list = list(orgs.all())
        print('User.organizations:', [(o.id, o.name) for o in org_list])
    else:
        print('User.organizations attribute not present')
except Exception as e:
    print('Error reading user.organizations:', e)

# Show all tickets in DB (limited to 200 rows)
print('\nAll tickets (up to 200):')
for t in Ticket.objects.all().order_by('-id')[:200]:
    print('id=%s org=%s owner_org=%s airline_id=%s departure=%s left_seats=%s status=%s' % (
        t.id, getattr(t, 'organization_id', None), getattr(t, 'owner_organization_id', None), getattr(t, 'airline_id', None), getattr(t, 'departure_date', None), getattr(t, 'left_seats', None), getattr(t, 'status', None)
    ))

# Recreate get_queryset logic (non-superuser) used in tickets.views.TicketViewSet
print('\nTickets visible to user by current get_queryset logic:')
if user.is_superuser:
    q = Ticket.objects.exclude(status='inactive').filter(left_seats__gt=0)
    now = timezone.now()
    q = q.filter(Q(trip_details__departure_date_time__gte=now) | Q(departure_date__gte=now.date())).distinct()
else:
    organization_id = None
    # try query param (none for script), then group
    organization_id = org_from_group
    if not organization_id:
        print('No organization found for user (group or user.organizations); user will be denied in API')
        organization_id = None
    if organization_id:
        own_org_id = int(organization_id)
        q = Ticket.objects.filter(Q(organization_id=own_org_id) | Q(owner_organization_id=own_org_id))
        q = q.exclude(status='inactive').filter(left_seats__gt=0)
        now = timezone.now()
        q = q.filter(Q(trip_details__departure_date_time__gte=now) | Q(departure_date__gte=now.date())).distinct()
    else:
        q = Ticket.objects.none()

print('Visible count:', q.count())
for t in q.order_by('-id')[:200]:
    print('id=%s org=%s owner_org=%s airline_id=%s departure=%s left_seats=%s status=%s' % (
        t.id, getattr(t, 'organization_id', None), getattr(t, 'owner_organization_id', None), getattr(t, 'airline_id', None), getattr(t, 'departure_date', None), getattr(t, 'left_seats', None), getattr(t, 'status', None)
    ))

print('\nDone.')
