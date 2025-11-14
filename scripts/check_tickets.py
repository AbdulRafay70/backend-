#!/usr/bin/env python3
"""
scripts/check_tickets.py

Run from repository root. Examples:

  # List recent tickets for organization 8
  python .venv\Scripts\python.exe scripts\check_tickets.py --org 8 --recent 20

  # Show details for a specific ticket id
  python .venv\Scripts\python.exe scripts\check_tickets.py --ticket-id 123 --show

  # Check whether a ticket id exists (useful to confirm deletion)
  python .venv\Scripts\python.exe scripts\check_tickets.py --ticket-id 123 --exists

This script sets up Django and uses the Ticket model to inspect tickets.
"""
import os
import sys
import argparse
import json


def setup_django():
    # Ensure repository root is on sys.path
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if repo_root not in sys.path:
        sys.path.insert(0, repo_root)

    # Configure settings module (project uses configuration.settings)
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")

    try:
        import django

        django.setup()
    except Exception as e:
        print("Failed to setup Django:", e)
        sys.exit(2)


def format_ticket(t):
    # Safe accessors
    airline = getattr(t.airline, "name", None)
    origin = getattr(t.origin, "name", None)
    destination = getattr(t.destination, "name", None)

    return {
        "id": t.id,
        "pnr": t.pnr,
        "airline": airline,
        "origin": origin,
        "destination": destination,
        "departure_date": str(t.departure_date) if t.departure_date else None,
        "departure_time": str(t.departure_time) if t.departure_time else None,
        "left_seats": t.left_seats,
        "status": t.status,
        "total_seats": t.total_seats,
        "booked_tickets": t.booked_tickets,
        "confirmed_tickets": t.confirmed_tickets,
        "created_at": t.created_at.isoformat() if getattr(t, "created_at", None) else None,
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description="Check and confirm tickets via Django ORM")
    parser.add_argument("--org", type=int, help="Organization ID to filter tickets")
    parser.add_argument("--ticket-id", type=int, help="Specific ticket ID to inspect")
    parser.add_argument("--pnr", type=str, help="Filter by PNR")
    parser.add_argument("--recent", type=int, help="Show N most recent tickets (default 20)")
    parser.add_argument("--show", action="store_true", help="Show detailed info for matching tickets")
    parser.add_argument("--exists", action="store_true", help="Exit 0 if ticket exists, exit 3 if not")
    parser.add_argument("--json", action="store_true", help="Output results as JSON")

    args = parser.parse_args(argv)

    setup_django()

    from tickets.models import Ticket
    from organization.models import Organization

    qs = Ticket.objects.all()

    if args.org:
        qs = qs.filter(organization_id=args.org)

    if args.ticket_id:
        qs = qs.filter(id=args.ticket_id)

    if args.pnr:
        qs = qs.filter(pnr__iexact=args.pnr)

    # Default ordering: newest first
    qs = qs.order_by("-created_at")

    # If user asked to check existence of a specific ticket id
    if args.exists:
        exists = qs.exists()
        if exists:
            print("EXISTS")
            sys.exit(0)
        else:
            print("MISSING")
            sys.exit(3)

    # Show recent few if requested
    if args.recent:
        qs = qs[: args.recent]
    else:
        # default to 20 when listing
        if not args.ticket_id and not args.pnr:
            qs = qs[:20]

    tickets = list(qs)

    if args.json:
        out = [format_ticket(t) for t in tickets]
        print(json.dumps(out, indent=2, ensure_ascii=False))
        return

    # Human readable output
    if not tickets:
        print("No matching tickets found.")
        return

    print(f"Found {len(tickets)} ticket(s)")

    for t in tickets:
        print("-" * 60)
        print(f"ID: {t.id}    PNR: {t.pnr}    Status: {t.status}")
        print(f"Airline: {getattr(t.airline, 'name', 'N/A')}    Origin: {getattr(t.origin, 'name', 'N/A')} -> Destination: {getattr(t.destination, 'name', 'N/A')}")
        print(f"Departure: {t.departure_date} {t.departure_time}")
        print(f"Seats: left={t.left_seats} total={t.total_seats} booked={t.booked_tickets} confirmed={t.confirmed_tickets}")
        if args.show:
            # attempt to show trip_details if available
            try:
                details = list(t.trip_details.all())
                if details:
                    print("Trip details:")
                    for d in details:
                        print(f"  - {d.trip_type}: {d.departure_date_time} -> {d.arrival_date_time} ({getattr(d.departure_city,'name',None)} -> {getattr(d.arrival_city,'name',None)})")
                else:
                    print("  (no trip_details)")
            except Exception:
                print("  (could not fetch trip_details)")


if __name__ == "__main__":
    main()
