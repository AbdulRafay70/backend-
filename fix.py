# management/commands/check_urls.py
from django.core.management.base import BaseCommand
from django.urls import get_resolver

class Command(BaseCommand):
    def handle(self, *args, **options):
        resolver = get_resolver()
        patterns = {}
        
        def extract_urls(url_patterns, base=''):
            for pattern in url_patterns:
                if hasattr(pattern, 'url_patterns'):
                    extract_urls(pattern.url_patterns, base + str(pattern.pattern))
                else:
                    full_path = base + str(pattern.pattern)
                    if full_path in patterns:
                        self.stdout.write(self.style.ERROR(f'DUPLICATE: {full_path}'))
                    patterns[full_path] = pattern
        
        extract_urls(resolver.url_patterns)