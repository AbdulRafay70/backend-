# Script to inspect API-like responses for tickets using the project's serializers.
# Run with: python manage.py shell < scripts/check_api_responses.py
import json
from tickets.models import Ticket
from tickets.serializers import TicketSerializer

print('Total tickets in DB:', Ticket.objects.count())

# List distinct organization ids for tickets
org_rows = Ticket.objects.values('organization__id', 'organization__name').distinct()
orgs = []
for r in org_rows:
    orgs.append((r.get('organization__id'), r.get('organization__name')))

print('Organizations with tickets:')
for oid, name in orgs:
    print(f' - id={oid} name={name}')

# Function to pretty-print serializer output (truncated to reasonable length)
def print_serialized_list(qs, title):
    serializer = TicketSerializer(qs, many=True, context={'request': None})
    data = serializer.data
    print('\n' + '='*40)
    print(title)
    print('count =', len(data))
    if len(data) == 0:
        print('(empty)')
        return
    # Print first 3 items full, then ids for the rest
    to_show = data[:3]
    print(json.dumps(to_show, indent=2, default=str))
    if len(data) > 3:
        remaining_ids = [d.get('id') for d in data[3:10]]
        print(f'... plus {len(data)-3} more (sample ids):', remaining_ids)

# 1) All tickets (no org filter)
qs_all = Ticket.objects.all().order_by('-id')
print_serialized_list(qs_all, 'API list response for GET /api/tickets/ (no org filter)')

# 2) Per-org lists
for oid, name in orgs:
    qs = Ticket.objects.filter(organization__id=oid).order_by('-id')
    print_serialized_list(qs, f'API list response for GET /api/tickets/?organization={oid} ({name})')

# 3) Single-ticket detail for latest ticket
if qs_all.exists():
    t = qs_all.first()
    ser = TicketSerializer(t, context={'request': None})
    print('\n' + '='*40)
    print(f'API detail response for GET /api/tickets/{t.id}/ (latest ticket)')
    print(json.dumps(ser.data, indent=2, default=str))
else:
    print('No tickets to show detail for')

print('\nDone.')
