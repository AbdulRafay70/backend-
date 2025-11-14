from django.utils import timezone
from tickets.models import Ticket
from django.db.models import Q

org = 11
q = Ticket.objects.filter(Q(organization_id=org) | Q(owner_organization_id=org)).exclude(status='inactive').filter(left_seats__gt=0)
now = timezone.now()
q = q.filter(Q(trip_details__departure_date_time__gte=now) | Q(departure_date__gte=now.date())).distinct()
print('org', org, 'count', q.count())
for t in q.order_by('-id')[:200]:
    print('id=%s org=%s owner_org=%s departure=%s left_seats=%s' % (t.id, getattr(t,'organization_id',None), getattr(t,'owner_organization_id',None), getattr(t,'departure_date',None), getattr(t,'left_seats',None)))
