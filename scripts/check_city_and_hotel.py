#!/usr/bin/env python3
import os, sys
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

os.environ.setdefault('DJANGO_SETTINGS_MODULE','configuration.settings')
import django
django.setup()

from packages.models import City
from tickets.models import Hotels

def main():
    try:
        c = City.objects.filter(id=5).first()
        print('City id=5 ->', c and (c.id, getattr(c,'name',None), getattr(c,'code',None)) or 'Not found')
    except Exception as e:
        print('City query error', e)

    h = Hotels.objects.filter(id=23).select_related('city').first()
    if h:
        print('Hotel 23 city_id', h.city_id)
        print('Hotel 23 city obj', getattr(h,'city',None))
        try:
            if h.city:
                print('Hotel23.city.name:', h.city.name)
        except Exception as e:
            print('Error reading h.city.name', e)
    else:
        print('Hotel 23 not found')

if __name__ == '__main__':
    main()
