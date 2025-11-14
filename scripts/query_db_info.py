from django.db.models import Count
from tickets.models import Ticket
from organization.models import Organization
from django.contrib.auth.models import User

print("--- Ticket summary ---")
try:
    total = Ticket.objects.count()
    print(f"Total tickets: {total}
")
    # tickets per organization
    per_org = (Ticket.objects.values('organization__id', 'organization__name')
               .annotate(count=Count('id')).order_by('-count'))
    print("Tickets per organization:")
    for row in per_org:
        print(row)

    print("\nSample tickets (first 20):")
    for t in Ticket.objects.all().order_by('-created_at')[:20]:
        print(f"id={t.id}, org_id={getattr(t.organization, 'id', None)}, org_name={getattr(t.organization, 'name', None)}, flight_number={t.flight_number}, status={t.status}, departure_date={t.departure_date}")
except Exception as e:
    print("Error querying tickets:", e)

print('\n--- Organizations ---')
try:
    for o in Organization.objects.all()[:50]:
        print(f"id={o.id}, name={getattr(o, 'name', None)}")
except Exception as e:
    print('Error querying organizations:', e)

print('\n--- Users and their group-extended organization (if any) ---')
try:
    for u in User.objects.all()[:50]:
        org_id = None
        try:
            grp = u.groups.first()
            if grp and hasattr(grp, 'extended'):
                org_id = getattr(grp.extended, 'organization_id', None)
        except Exception:
            org_id = None
        print(f"username={u.username}, id={u.id}, org_from_group={org_id}")
except Exception as e:
    print('Error querying users:', e)
