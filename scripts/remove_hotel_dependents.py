#!/usr/bin/env python3
"""Delete model instances that reference a given Hotel.

CAUTION: This script will permanently delete records. It requires the
`--yes` flag to perform deletions; without it the script performs a dry-run
showing counts and samples.

Usage examples:
  python scripts/remove_hotel_dependents.py --hotel-id 39 --yes --delete-hotel
  python scripts/remove_hotel_dependents.py --hotel-name "Sample Hotel 1 Makkah" --yes

Run this on the host connected to the target database (production host if
you intend to modify production data).
"""
import os
import sys
import argparse

# Ensure project root is on sys.path so `configuration` package can be imported
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')

import django
django.setup()

from django.apps import apps
from django.db import transaction


def find_hotel(hotel_id=None, hotel_name=None):
    Hotel = apps.get_model('tickets', 'Hotels')
    if hotel_id:
        try:
            return Hotel.objects.get(pk=hotel_id)
        except Hotel.DoesNotExist:
            print(f"No Hotel found with id={hotel_id}")
            return None
    if hotel_name:
        qs = Hotel.objects.filter(name=hotel_name)
        if qs.count() == 1:
            return qs.first()
        elif qs.count() > 1:
            print(f"Multiple hotels found with name='{hotel_name}'. Use --hotel-id instead.")
            return None
        else:
            print(f"No Hotel found with name='{hotel_name}'")
            return None
    print("Provide --hotel-id or --hotel-name")
    return None


def collect_dependents(hotel):
    Hotel = apps.get_model('tickets', 'Hotels')
    entries = []
    for model in apps.get_models():
        for field in model._meta.fields:
            remote = getattr(field, 'remote_field', None)
            if not remote:
                continue
            if getattr(remote, 'model', None) == Hotel:
                kwargs = {field.name: hotel}
                qs = model.objects.filter(**kwargs)
                entries.append((model, field.name, qs))
    return entries


def dry_run_report(entries, limit=20):
    total = 0
    for model, field_name, qs in entries:
        count = qs.count()
        total += count
        print('-' * 60)
        print(f"{model._meta.app_label}.{model.__name__} (field: {field_name}) -> {count} records")
        for obj in qs[:limit]:
            print(f"  - {obj.pk}: {str(obj)}")
    print('-' * 60)
    print(f"Total dependent records: {total}")


def perform_deletes(entries):
    deleted_summary = []
    with transaction.atomic():
        for model, field_name, qs in entries:
            count = qs.count()
            if count:
                # delete the queryset; this will trigger cascades/signals
                res = qs.delete()
                # queryset.delete() returns tuple (num_deleted, {model_label: count, ...})
                deleted_summary.append((model, count, res))
                print(f"Deleted {count} records from {model._meta.app_label}.{model.__name__}")
    return deleted_summary


def main():
    parser = argparse.ArgumentParser(description='Delete dependent records referencing a Hotel')
    parser.add_argument('--hotel-id', type=int, help='Primary key of the Hotel')
    parser.add_argument('--hotel-name', help='Name of the Hotel (must be unique)')
    parser.add_argument('--yes', action='store_true', help='Proceed with deletion (required to actually delete)')
    parser.add_argument('--delete-hotel', action='store_true', help='Also delete the Hotel after dependents are removed')
    args = parser.parse_args()

    hotel = find_hotel(hotel_id=args.hotel_id, hotel_name=args.hotel_name)
    if not hotel:
        sys.exit(2)

    print(f"Target Hotel: {hotel.pk} - {hotel.name}")
    entries = collect_dependents(hotel)
    if not entries:
        print("No direct ForeignKey dependents found. You can attempt to delete the hotel directly.")
        if args.delete_hotel and args.yes:
            hotel.delete()
            print("Hotel deleted.")
        else:
            print("Run with --delete-hotel --yes to delete the hotel.")
        return

    # Dry-run report
    dry_run_report(entries)

    if not args.yes:
        print("DRY RUN only. No data was deleted. Re-run with --yes to perform deletions.")
        return

    # Proceed with deletes
    print("Proceeding to delete dependent records (wrapped in a transaction)...")
    deleted = perform_deletes(entries)

    print('\nDeletion summary:')
    for model, count, res in deleted:
        print(f" - {model._meta.app_label}.{model.__name__}: {count} requested, delete result: {res}")

    if args.delete_hotel:
        try:
            hotel.delete()
            print("Hotel deleted successfully.")
        except Exception as e:
            print("Failed to delete Hotel:", e)


if __name__ == '__main__':
    main()
