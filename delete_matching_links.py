#!/usr/bin/env python
"""
Script to delete organization links that match the API response data.
Run with: python delete_matching_links.py
"""

import os
import sys
import django
from pathlib import Path

# Add the project root to Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from organization.models import OrganizationLink

def delete_matching_links():
    """Delete organization links that match the API response"""
    
    # The API response data
    api_data = [
        {
            "Main_organization_id": 12,
            "Link_organization_id": 13,
            "Link_organization_request": "PENDING",
            "main_organization_request": "PENDING",
            "request_status": False
        },
        {
            "Main_organization_id": 12,
            "Link_organization_id": 11,
            "Link_organization_request": "PENDING",
            "main_organization_request": "PENDING",
            "request_status": False
        },
        {
            "Main_organization_id": 13,
            "Link_organization_id": 12,
            "Link_organization_request": "ACCEPTED",
            "main_organization_request": "ACCEPTED",
            "request_status": True
        }
    ]
    
    print("Attempting to delete organization links matching API response...")
    
    deleted_count = 0
    for item in api_data:
        try:
            # Find and delete the link
            link = OrganizationLink.objects.get(
                main_organization_id=item['Main_organization_id'],
                link_organization_id=item['Link_organization_id']
            )
            print(f"Deleting link: Main={item['Main_organization_id']}, Link={item['Link_organization_id']}")
            link.delete()
            deleted_count += 1
        except OrganizationLink.DoesNotExist:
            print(f"Link not found: Main={item['Main_organization_id']}, Link={item['Link_organization_id']}")
        except Exception as e:
            print(f"Error deleting link: {e}")
    
    print(f"Deleted {deleted_count} links")
    
    # Check remaining links
    remaining = OrganizationLink.objects.count()
    print(f"Remaining links in database: {remaining}")

if __name__ == "__main__":
    try:
        delete_matching_links()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()