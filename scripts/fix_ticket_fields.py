#!/usr/bin/env python3
"""
scripts/fix_ticket_fields.py

Scans Ticket rows that are missing top-level origin/destination or departure_date/time
but have trip_details populated, and copies values from the earliest 'Departure' trip_detail
into the Ticket fields so other parts of the system that rely on ticket-level fields work.

Usage:
  # Dry run (default) - show proposed fixes
  python scripts/fix_ticket_fields.py --org 8

  # Apply changes
  python scripts/fix_ticket_fields.py --org 8 --apply

This script modifies the local database (SQLite) when --apply is passed.
"""
import os
import sys
import argparse


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


def main(argv=None):
    parser = argparse.ArgumentParser(description="Fix ticket top-level fields from trip_details")
    parser.add_argument("--org", type=int, help="Organization ID to filter tickets")
    parser.add_argument("--apply", action="store_true", help="Apply changes to DB (default is dry-run)")
    args = parser.parse_args(argv)

    setup_django()

    from tickets.models import Ticket

    qs = Ticket.objects.all()
    if args.org:
        qs = qs.filter(organization_id=args.org)

    # Find tickets missing key fields but having at least one trip_detail
    candidates = qs.filter(
        trip_details__isnull=False,
    ).distinct()

    to_fix = []
    for t in candidates:
        needs = (
            t.origin is None
            or t.destination is None
            or t.departure_date is None
            or t.departure_time is None
        )
        if needs:
            to_fix.append(t)

    if not to_fix:
        print("No tickets need fixing.")
        return

    print(f"Found {len(to_fix)} tickets to inspect")

    for t in to_fix:
        # Prefer trip_type == 'Departure'
        details = t.trip_details.order_by("departure_date_time")
        detail = details.filter(trip_type__iexact="Departure").first() or details.first()
        if not detail:
            print(f"Ticket {t.id} has no trip_details? skipping")
            continue

        changes = {}
        if t.origin is None and detail.departure_city_id:
            changes['origin'] = detail.departure_city
        if t.destination is None and detail.arrival_city_id:
            changes['destination'] = detail.arrival_city
        if (t.departure_date is None or t.departure_time is None) and detail.departure_date_time:
            changes['departure_date'] = detail.departure_date_time.date()
            changes['departure_time'] = detail.departure_date_time.time()
        if (t.arrival_date is None or t.arrival_time is None) and detail.arrival_date_time:
            changes['arrival_date'] = detail.arrival_date_time.date()
            changes['arrival_time'] = detail.arrival_date_time.time()

        if not changes:
            print(f"Ticket {t.id}: nothing to update (maybe only buy/sell prices missing)")
            continue

        print("-" * 60)
        print(f"Ticket {t.id} (PNR: {t.pnr}) proposed changes:")
        for k, v in changes.items():
            print(f"  {k}: {getattr(t, k)} -> {v}")

        if args.apply:
            for k, v in changes.items():
                setattr(t, k, v)
            t.save()
            print(f"  Applied changes for ticket {t.id}")


if __name__ == "__main__":
    main()
