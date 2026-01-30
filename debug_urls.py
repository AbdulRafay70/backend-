
import os
import django
from django.urls import resolve

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
django.setup()

def check_url(url):
    print(f"\nChecking URL: {url}")
    try:
        resolver_match = resolve(url)
        print(f"[SUCCESS] Resolved to: {resolver_match.view_name}")
    except Exception as e:
        print(f"[FAILED] Failed to resolve {url}")
        print(f"Error: {e}")

print("--- Debugging URL Resolution ---")
check_url("/api/bookings/")
check_url("/api/public/bookings/")
