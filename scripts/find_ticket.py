#!/usr/bin/env python3
"""
scripts/find_ticket.py

Find tickets by airline/origin/destination/departure date/time.

Example:
  .venv\Scripts\python.exe scripts\find_ticket.py --airline "Saudi airline" --origin Karachi --destination Lahore --date 2025-11-01 --time 12:30

"""
import os
import sys
import argparse
import json


def setup_django():
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if repo_root not in sys.path:
        sys.path.insert(0, repo_root)
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
    try:
        import django

        django.setup()
    except Exception as e:
        print("Failed to setup Django:", e)
        sys.exit(2)


def format_ticket(t):
    return {
        "id": t.id,
        "pnr": t.pnr,
        "flight_number": t.flight_number,
        "airline": getattr(t.airline, "name", None),
        "origin": getattr(t.origin, "name", None),
        "destination": getattr(t.destination, "name", None),
        "departure_date": str(t.departure_date) if t.departure_date else None,
        "departure_time": str(t.departure_time) if t.departure_time else None,
        "left_seats": t.left_seats,
        "total_seats": t.total_seats,
        "status": t.status,
        "organization": getattr(t.organization, "name", None),
        "branch": getattr(t.branch, "name", None),
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description="Find tickets by properties")
    parser.add_argument("--airline", help="Airline name (substring match)")
    parser.add_argument("--origin", help="Origin city name (substring)")
    parser.add_argument("--destination", help="Destination city name (substring)")
    parser.add_argument("--date", help="Departure date YYYY-MM-DD")
    parser.add_argument("--time", help="Departure time HH:MM (24h or 12h:MM)")
    parser.add_argument("--org", help="Organization id or name (optional)")
    parser.add_argument("--json", action="store_true", help="Output JSON")
    args = parser.parse_args(argv)

    setup_django()
    from tickets.models import Ticket

    qs = Ticket.objects.all()
    if args.airline:
        qs = qs.filter(airline__name__icontains=args.airline)
    if args.origin:
        qs = qs.filter(origin__name__icontains=args.origin)
    if args.destination:
        qs = qs.filter(destination__name__icontains=args.destination)
    if args.date:
        qs = qs.filter(departure_date=args.date)
    if args.time:
        # allow matching on hour:minute; compare string startswith
        t = args.time.strip()
        if len(t) <= 5:
            # ensure HH:MM
            if ':' not in t:
                print('time must be HH:MM')
            else:
                qs = qs.filter(departure_time__startswith=t)
        else:
            qs = qs.filter(departure_time__startswith=t)
    if args.org:
        # try to treat as int id first
        try:
            org_id = int(args.org)
            qs = qs.filter(organization_id=org_id)
        except Exception:
            qs = qs.filter(organization__name__icontains=args.org)

    results = list(qs.order_by("-created_at")[:100])

    if not results:
        print("No tickets found matching criteria")
        return

    if args.json:
        print(json.dumps([format_ticket(t) for t in results], indent=2, ensure_ascii=False))
        return

    for t in results:
        print("-" * 60)
        print(json.dumps(format_ticket(t), indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
