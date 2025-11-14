#!/usr/bin/env python
"""
Django management command to test organization links API internally.
Run with: python manage.py test_org_links
"""

from django.core.management.base import BaseCommand
from organization.models import OrganizationLink
from organization.serializers import OrganizationLinkSerializer

class Command(BaseCommand):
    help = 'Test organization links API data'

    def handle(self, *args, **options):
        # Get all organization links
        links = OrganizationLink.objects.all().order_by("-created_at")
        
        self.stdout.write(f"Found {links.count()} organization links in database:")
        
        for link in links:
            self.stdout.write(f"  ID {link.id}: Main={link.main_organization.name} ↔ Link={link.link_organization.name}")
            self.stdout.write(f"    Status: Main={link.main_organization_request}, Link={link.link_organization_request}, Active={link.request_status}")
        
        # Test serializer
        self.stdout.write("\nTesting serializer output:")
        serializer = OrganizationLinkSerializer(links, many=True)
        data = serializer.data
        
        self.stdout.write(f"Serialized data has {len(data)} items:")
        for item in data:
            self.stdout.write(f"  {item}")
        
        self.stdout.write("\n✅ Organization links API test completed successfully")