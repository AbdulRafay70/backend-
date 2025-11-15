#!/usr/bin/env python3
"""List and optionally dump model instances that reference a given Hotel.

Usage examples:
  python scripts/list_hotel_dependents.py --hotel-id 39 --dump-dir ./backups
  python scripts/list_hotel_dependents.py --hotel-name "Sample Hotel 1 Makkah"

This script bootstraps Django using `configuration.settings` by default. Run it
on the host that has access to the target database (production host if you need
to inspect production records).
"""
import os
import sys
import argparse
import json

# Ensure project root is on sys.path so `configuration` package can be imported
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')

import django
django.setup()

from django.apps import apps
from django.core import serializers


def find_hotel_by_identifier(hotel_id=None, hotel_name=None):
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
            print(f"Multiple hotels found with name='{hotel_name}', please use --hotel-id instead")
            return None
        else:
            print(f"No Hotel found with name='{hotel_name}'")
            return None
    print("Provide --hotel-id or --hotel-name")
    return None


def list_dependents(hotel, limit=50):
    Hotel = apps.get_model('tickets', 'Hotels')
    results = []
    for model in apps.get_models():
        for field in model._meta.fields:
            remote = getattr(field, 'remote_field', None)
            if not remote:
                continue
            if getattr(remote, 'model', None) == Hotel:
                # Build a queryset filtering by the FK field
                kwargs = {field.name: hotel}
                qs = model.objects.filter(**kwargs)
                count = qs.count()
                sample = []
                for obj in qs[:limit]:
                    sample.append({'pk': obj.pk, 'repr': str(obj)})
                results.append({
                    'app': model._meta.app_label,
                    'model': model.__name__,
                    'field': field.name,
                    'count': count,
                    'sample': sample,
                    'queryset': qs,
                })
    return results


def dump_querysets(results, hotel_id, dump_dir):
    os.makedirs(dump_dir, exist_ok=True)
    written = []
    for entry in results:
        qs = entry['queryset']
        if qs.exists():
            filename = f"backup_{entry['app']}_{entry['model']}_hotel{hotel_id}.json"
            path = os.path.join(dump_dir, filename)
            data = serializers.serialize('json', qs)
            with open(path, 'w', encoding='utf-8') as f:
                f.write(data)
            written.append(path)
            print(f"Wrote {qs.count()} records to {path}")
    return written


def main():
    parser = argparse.ArgumentParser(description='List and optionally dump models referencing a Hotel')
    parser.add_argument('--hotel-id', type=int, help='Primary key of the Hotel')
    parser.add_argument('--hotel-name', help='Name of the Hotel (must be unique)')
    parser.add_argument('--limit', type=int, default=50, help='How many sample rows to show per model')
    parser.add_argument('--dump-dir', help='Directory to write JSON backups for each dependent model')
    args = parser.parse_args()

    hotel = find_hotel_by_identifier(hotel_id=args.hotel_id, hotel_name=args.hotel_name)
    if not hotel:
        sys.exit(2)

    print(f"Inspecting dependents for Hotel: {hotel.pk} - {hotel.name}")
    results = list_dependents(hotel, limit=args.limit)
    if not results:
        print("No direct ForeignKey references to Hotels found in models.")
        sys.exit(0)

    total = 0
    for entry in results:
        print('-' * 60)
        print(f"{entry['app']}.{entry['model']} (field: {entry['field']}) -> {entry['count']} records")
        total += entry['count']
        for s in entry['sample']:
            print(f"  - {s['pk']}: {s['repr']}")

    print('-' * 60)
    print(f"Total dependent records across models: {total}")

    if args.dump_dir:
        written = dump_querysets(results, hotel.pk, args.dump_dir)
        if written:
            print("Dumped JSON files:")
            for p in written:
                print(" -", p)
        else:
            print("No records to dump.")


if __name__ == '__main__':
    main()
