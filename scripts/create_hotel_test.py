import os
import django
import traceback

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
try:
    django.setup()
except Exception:
    traceback.print_exc()
    raise

from tickets.models import HotelCategory, Hotels

try:
    cat = HotelCategory.objects.filter(id=3).first()
    print('Found category:', (cat.id, cat.name, cat.slug) if cat else None)
    if not cat:
        print('Category id 3 not found. Available categories (first 50):')
        for c in HotelCategory.objects.all()[:50]:
            print({'id': c.id, 'name': c.name, 'slug': c.slug})
    else:
        # Create hotel with category as slug
        h = Hotels.objects.create(name='Script Test Hotel (slug)', category=cat.slug or cat.name, organization=None)
        print('Created hotel (slug) id:', h.id, 'stored category:', Hotels.objects.get(id=h.id).category)

        # Create hotel with category set to numeric string (simulating incorrect frontend payload)
        h2 = Hotels.objects.create(name='Script Test Hotel (numeric)', category=str(cat.id), organization=None)
        print('Created hotel (numeric) id:', h2.id, 'stored category:', Hotels.objects.get(id=h2.id).category)

        # Create hotel with category field set to HotelCategory.name
        h3 = Hotels.objects.create(name='Script Test Hotel (name)', category=cat.name, organization=None)
        print('Created hotel (name) id:', h3.id, 'stored category:', Hotels.objects.get(id=h3.id).category)

except Exception as e:
    print('Error during test:')
    traceback.print_exc()
