#!/usr/bin/env python
"""
Script to check organization links data in database and compare with API response format.
Run with: python check_organization_links.py
"""

import os
import sys
import django
from pathlib import Path
import sqlite3

# Add the project root to Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from organization.models import OrganizationLink, Organization

def check_sqlite_db(db_path):
    """Check organization links in a SQLite database file"""
    if not os.path.exists(db_path):
        return None
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='organization_links'")
        if not cursor.fetchone():
            conn.close()
            return []
        
        # Get data
        cursor.execute("""
            SELECT id, main_organization_id, link_organization_id, 
                   main_organization_request, link_organization_request, request_status
            FROM organization_links
        """)
        
        data = []
        for row in cursor.fetchall():
            data.append({
                'id': row[0],
                'Main_organization_id': row[1],
                'Link_organization_id': row[2],
                'main_organization_request': row[3],
                'link_organization_request': row[4],
                'request_status': bool(row[5]),
            })
        
        conn.close()
        return data
    
    except Exception as e:
        print(f"Error checking {db_path}: {e}")
        return None

def check_database_data():
    """Check current data in organization_links table"""
    print("=== DJANGO DATABASE DATA CHECK ===")

    try:
        # Count total links
        total_links = OrganizationLink.objects.count()
        print(f"Total organization links in Django DB: {total_links}")

        if total_links == 0:
            print("No organization links found in Django database.")
            return []

        # Get all links with organization names
        links = OrganizationLink.objects.select_related('main_organization', 'link_organization').all()

        data = []
        for link in links:
            link_data = {
                'id': link.id,
                'Main_organization_id': link.main_organization_id,
                'Link_organization_id': link.link_organization_id,
                'main_organization_request': link.main_organization_request,
                'link_organization_request': link.link_organization_request,
                'request_status': link.request_status,
                'main_organization_name': link.main_organization.name,
                'link_organization_name': link.link_organization.name,
            }
            data.append(link_data)
            print(f"Link ID {link.id}: {link.main_organization.name} ↔ {link.link_organization.name}")
            print(f"  Status: Main={link.main_organization_request}, Link={link.link_organization_request}")

        return data
    except Exception as e:
        print(f"Error checking Django DB: {e}")
        return []

def check_sqlite_files():
    """Check SQLite database files"""
    print("\n=== SQLITE DATABASE CHECKS ===")
    
    sqlite_files = ['db.sqlite3', 'local_db.sqlite3', 'db_new.sqlite3']
    results = {}
    
    for db_file in sqlite_files:
        db_path = BASE_DIR / db_file
        print(f"\nChecking {db_file}:")
        data = check_sqlite_db(str(db_path))
        if data is None:
            print(f"  {db_file} does not exist")
        elif len(data) == 0:
            print(f"  {db_file} exists but no organization_links table or no data")
        else:
            print(f"  {db_file} has {len(data)} organization links:")
            for item in data:
                print(f"    ID {item['id']}: Main={item['Main_organization_id']}, Link={item['Link_organization_id']}, Status={item['request_status']}")
        
        results[db_file] = data
    
    return results

def simulate_api_response(data):
    """Simulate the API response format"""
    print("\n=== SIMULATED API RESPONSE ===")

    if not data:
        print("API would return: []")
        return []

    # The API response format (without id as per current implementation)
    api_response = []
    for item in data:
        api_item = {
            'Main_organization_id': item['Main_organization_id'],
            'Link_organization_id': item['Link_organization_id'],
            'main_organization_request': item['main_organization_request'],
            'link_organization_request': item['link_organization_request'],
            'request_status': item['request_status'],
        }
        api_response.append(api_item)

    print("API response format:")
    import json
    print(json.dumps(api_response, indent=2))

    return api_response

def check_organizations():
    """Check available organizations"""
    print("\n=== AVAILABLE ORGANIZATIONS ===")
    try:
        orgs = Organization.objects.all()
        print(f"Total organizations: {orgs.count()}")
        for org in orgs[:10]:  # Show first 10
            print(f"ID {org.id}: {org.name}")
        if orgs.count() > 10:
            print(f"... and {orgs.count() - 10} more")
    except Exception as e:
        print(f"Error checking organizations: {e}")

if __name__ == "__main__":
    try:
        django_data = check_database_data()
        sqlite_results = check_sqlite_files()
        check_organizations()

        print("\n=== SUMMARY ===")
        print(f"Django DB has {len(django_data)} organization links")
        
        for db_file, data in sqlite_results.items():
            if data is not None:
                print(f"{db_file} has {len(data)} organization links")
            else:
                print(f"{db_file} not found or error")

        # Check which matches the API response
        api_response_from_user = [
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

        print(f"\nUser's API response has {len(api_response_from_user)} items")

        # Find which database matches
        matches = []
        if django_data:
            django_api = simulate_api_response(django_data)
            if django_api == api_response_from_user:
                matches.append("Django DB")
        
        for db_file, data in sqlite_results.items():
            if data:
                sqlite_api = simulate_api_response(data)
                if sqlite_api == api_response_from_user:
                    matches.append(db_file)

        if matches:
            print(f"✅ API response matches: {', '.join(matches)}")
        else:
            print("❌ API response doesn't match any checked database")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()