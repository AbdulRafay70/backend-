from django.core.management.base import BaseCommand
import traceback

class Command(BaseCommand):
    help = 'Create test hotels to check category storage (id=3)'

    def handle(self, *args, **options):
        try:
            from tickets.models import HotelCategory, Hotels
            cat = HotelCategory.objects.filter(id=3).first()
            self.stdout.write(f'Found category: { (cat.id, cat.name, cat.slug) if cat else None }')
            if not cat:
                self.stdout.write('Category id 3 not found. Available categories (first 50):')
                for c in HotelCategory.objects.all()[:50]:
                    self.stdout.write(str({'id': c.id, 'name': c.name, 'slug': c.slug}))
                return

            h = Hotels.objects.create(name='MgmtCmd Test Hotel (slug)', category=cat.slug or cat.name, organization=None)
            self.stdout.write(f'Created hotel (slug) id: {h.id} stored category: {Hotels.objects.get(id=h.id).category}')

            h2 = Hotels.objects.create(name='MgmtCmd Test Hotel (numeric)', category=str(cat.id), organization=None)
            self.stdout.write(f'Created hotel (numeric) id: {h2.id} stored category: {Hotels.objects.get(id=h2.id).category}')

            h3 = Hotels.objects.create(name='MgmtCmd Test Hotel (name)', category=cat.name, organization=None)
            self.stdout.write(f'Created hotel (name) id: {h3.id} stored category: {Hotels.objects.get(id=h3.id).category}')

        except Exception:
            self.stdout.write('Error during test:')
            traceback.print_exc()
