import os
import sys
import django

# Ensure project root is on path
ROOT = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(ROOT)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Use the project's settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')

django.setup()

from packages.models import FoodPrice, ZiaratPrice

print('Food demo rows:')
for obj in FoodPrice.objects.order_by('-id')[:5]:
    print({'id': obj.id, 'title': getattr(obj, 'title', None), 'price': obj.price, 'purchase_price': getattr(obj, 'purchase_price', None)})

print('\nZiarat demo rows:')
for obj in ZiaratPrice.objects.order_by('-id')[:5]:
    print({'id': obj.id, 'ziarat_title': getattr(obj, 'ziarat_title', None), 'price': obj.price, 'purchase_price': getattr(obj, 'purchase_price', None)})
