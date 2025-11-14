from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Seed common cities for a given organization id (default 5)'

    def add_arguments(self, parser):
        parser.add_argument('--org', type=int, default=5, help='Organization id to attach cities to')

    def handle(self, *args, **options):
        from packages.models import City
        from organization.models import Organization

        org_id = options.get('org')
        org = Organization.objects.filter(id=org_id).first()
        if not org:
            self.stdout.write(self.style.ERROR(f'Organization with id={org_id} not found.'))
            return

        names = ['Makkah', 'Madinah', 'Jeddah', 'Riyadh', 'Dammam']
        created = []
        existed = []
        for n in names:
            c, created_flag = City.objects.get_or_create(organization=org, name=n, defaults={'code': n[:4].upper()})
            if created_flag:
                created.append((c.id, c.name))
            else:
                existed.append((c.id, c.name))

        if created:
            self.stdout.write(self.style.SUCCESS(f'Created cities: {created}'))
        if existed:
            self.stdout.write(self.style.WARNING(f'Already existed: {existed}'))
        self.stdout.write(self.style.SUCCESS('Done.'))
