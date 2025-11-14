#!/usr/bin/env python3
"""Update City with id=5 to a new name and print before/after state.

Run this from the repository root: python scripts/update_city_5_name.py
"""
import os
import sys

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
import django
django.setup()

from packages.models import City


def main():
    city_id = 5
    before = City.objects.filter(id=city_id).first()
    print('Before:', before and (before.id, before.name, before.code) or 'Not found')

    if not before:
        print(f"City with id={city_id} not found. No change made.")
        return

    new_name = 'karachi'
    # Optionally update code as well; keep existing code if present
    City.objects.filter(id=city_id).update(name=new_name)

    after = City.objects.filter(id=city_id).first()
    print('After:', after and (after.id, after.name, after.code) or 'Not found')


if __name__ == '__main__':
    main()
