#!/usr/bin/env python
"""
Safe deletion script for bookings. Bootstraps Django so it can be run directly.

Usage:
  python scripts/delete_bookings.py --ids 140 139 138 ...

It will print the bookings found and ask for confirmation before deleting.

IMPORTANT: Back up your data before running this in production.
"""
import os
import sys
import argparse


def bootstrap_django():
    # Ensure project root (repository root) is on sys.path
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if repo_root not in sys.path:
        sys.path.insert(0, repo_root)

    # Set DJANGO_SETTINGS_MODULE to the same used by manage.py
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')

    try:
        import django
        django.setup()
    except Exception as e:
        print('Failed to bootstrap Django environment:', e)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description='Delete bookings by id (destructive).')
    parser.add_argument('--ids', nargs='+', type=int, required=False, help='Booking IDs to delete')
    parser.add_argument('--yes', action='store_true', help='Skip confirmation')
    args = parser.parse_args()

    bootstrap_django()

    from django.db import transaction
    try:
        from booking.models import Booking
    except Exception as e:
        print('Failed to import Booking model:', e)
        sys.exit(1)

    ids = args.ids or [140,139,138,137,136,135,134,133,132,131,130,127,121,120]
    qs = Booking.objects.filter(id__in=ids).order_by('id')
    found = list(qs)
    print(f'Found {len(found)} bookings matching IDs: {ids}')
    for b in found:
        print('-', b.id, getattr(b, 'booking_number', None), getattr(b, 'status', None), getattr(b, 'customer_name', None))

    if not found:
        print('No bookings found. Exiting.')
        return

    if not args.yes:
        confirm = input('Type YES to permanently delete these bookings: ').strip()
        if confirm != 'YES':
            print('Aborted by user.')
            return

    with transaction.atomic():
        for b in found:
            try:
                print('Deleting booking', b.id)
                b.delete()
            except Exception as e:
                print('Failed to delete', b.id, ':', e)

    print('Deletion completed.')


if __name__ == '__main__':
    main()