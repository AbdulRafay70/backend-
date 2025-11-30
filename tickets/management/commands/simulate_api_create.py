from django.core.management.base import BaseCommand
import traceback

class Command(BaseCommand):
    help = 'Simulate API create via HotelsSerializer with category payload variants'

    def handle(self, *args, **options):
        try:
            from tickets.serializers import HotelsSerializer
            from tickets.models import Hotels, HotelCategory
            self.stdout.write('Available category 3: ' + str(HotelCategory.objects.filter(id=3).first()))

            # include minimal prices payload required by serializer
            base_prices = [{
                'start_date': '2025-12-01',
                'end_date': '2025-12-31',
                'room_type': 'single',
                'selling_price': 10.0,
            }]

            payloads = [
                {'name': 'API Test Hotel A', 'address': 'Addr A', 'category': 3, 'prices': base_prices},
                {'name': 'API Test Hotel B', 'address': 'Addr B', 'category': '3', 'prices': base_prices},
                {'name': 'API Test Hotel C', 'address': 'Addr C', 'category_id': 3, 'prices': base_prices},
            ]

            for p in payloads:
                self.stdout.write('\nTrying payload: ' + str(p))
                serializer = HotelsSerializer(data=p, context={})
                if not serializer.is_valid():
                    self.stdout.write('Serializer invalid: ' + str(serializer.errors))
                    continue
                obj = serializer.save()
                self.stdout.write('Created via serializer id: %s stored category: %s' % (obj.id, obj.category))

        except Exception:
            self.stdout.write('Error during simulation:')
            traceback.print_exc()
