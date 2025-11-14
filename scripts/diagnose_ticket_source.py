# Diagnostic script to inspect Ticket rows and related trip/stopover data
# Run with: python manage.py shell -c "exec(open('scripts/diagnose_ticket_source.py').read())"
from django.utils import timezone
from tickets.models import Ticket, TicketTripDetails, TickerStopoverDetails

print('\n=== Ticket DB Diagnostic ===\n')
try:
    total = Ticket.objects.count()
    print('Total Ticket rows:', total)
    if total == 0:
        print('No tickets in DB.')
    else:
        for t in Ticket.objects.all().order_by('id'):
            print('\n--- Ticket', t.id, '---')
            print('pnr:', getattr(t, 'pnr', None))
            print('flight_number:', getattr(t, 'flight_number', None))
            print('organization_id:', getattr(t, 'organization_id', None))
            print('owner_organization_id:', getattr(t, 'owner_organization_id', None))
            print('inventory_owner_organization_id:', getattr(t, 'inventory_owner_organization_id', None))
            print('reselling_allowed:', getattr(t, 'reselling_allowed', None))
            print('status:', getattr(t, 'status', None))
            print('left_seats:', getattr(t, 'left_seats', None))
            print('departure_date:', getattr(t, 'departure_date', None))
            print('departure_time:', getattr(t, 'departure_time', None))
            print('created_at:', getattr(t, 'created_at', None))
            print('updated_at:', getattr(t, 'updated_at', None))
            # Trip details
            trips = TicketTripDetails.objects.filter(ticket=t)
            print('Trip details count:', trips.count())
            for tr in trips:
                print('  - trip id', tr.id, 'trip_type', tr.trip_type, 'dep', tr.departure_date_time, 'arr', tr.arrival_date_time)
            stopovers = TickerStopoverDetails.objects.filter(ticket=t)
            print('Stopovers count:', stopovers.count())
            for s in stopovers:
                print('  - stopover id', s.id, 'trip_type', s.trip_type, 'duration', getattr(s,'stopover_duration', None))
except Exception as e:
    import traceback
    traceback.print_exc()

print('\n=== End Diagnostic ===\n')
