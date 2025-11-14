"""
Diagnostic script to help locate stale/hardcoded ticket data or mismatched DB.

Usage (PowerShell):
  .\.venv\Scripts\Activate.ps1
  python scripts\debug_ticket_source.py

What it does:
- Greps repository files for known ticket markers (flight_number, ticket_number prefixes, SaerAir, SAE-630, sample JSON patterns).
- Lists `fixtures/` JSON files and searches within them.
- If run inside the Django project (DJANGO_SETTINGS_MODULE available), it will import Django and print Ticket DB rows.

The script prints clear sections; paste the entire output here so I can diagnose.
"""

import os
import re
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
print(f"Repository root: {ROOT}")

# Patterns to search for in code/static files
PATTERNS = [
    r"SAE-630",
    r"SaerAir",
    r"TKT-[A-Z0-9]{6}",
    r"\"reselling_allowed\"",
    r"\"trip_details\"",
    r"\"stopover_details\"",
    r"\"inventory_owner_organization_id\"",
    r"\"owner_organization_id\"",
    r"ticket_number",
]

print("\n1) Scanning files for hard-coded markers...\n")
matches_found = 0
for p in ROOT.rglob("**/*"):
    if p.is_file() and p.suffix.lower() not in {'.pyc','.exe','.png','.jpg','.jpeg','.db'}:
        try:
            text = p.read_text(encoding='utf-8', errors='ignore')
        except Exception:
            continue
        for pat in PATTERNS:
            if re.search(pat, text):
                print(f"MATCH: {p.relative_to(ROOT)} contains pattern: {pat}")
                matches_found += 1
                break

if matches_found == 0:
    print("No hard-coded markers found in text files.")

# Search fixtures directory for JSON files and scan
fixtures_dir = ROOT / 'fixtures'
print("\n2) Checking fixtures/ directory (if present)...\n")
if fixtures_dir.exists() and fixtures_dir.is_dir():
    for f in fixtures_dir.glob('**/*.json'):
        print(f"Found fixture: {f.relative_to(ROOT)}")
        try:
            data = json.loads(f.read_text(encoding='utf-8'))
            # Simple heuristic: find any dicts containing ticket-like keys
            def scan_obj(obj, path=''):
                if isinstance(obj, dict):
                    keys = set(obj.keys())
                    ticket_keys = {'trip_details','flight_number','pnr','ticket_number','reselling_allowed'}
                    if ticket_keys & keys:
                        print(f"  -> appears ticket-like at {f.relative_to(ROOT)} {path or '/'}: keys={sorted(list(keys))}")
                    for k,v in obj.items():
                        scan_obj(v, path + f"/{k}")
                elif isinstance(obj, list):
                    for i, it in enumerate(obj):
                        scan_obj(it, path + f"[{i}]")
            scan_obj(data)
        except Exception as e:
            print(f"  Could not parse JSON fixture {f}: {e}")
else:
    print("No fixtures/ directory found.")

# Check for service worker precache-like files (common build outputs)
print("\n3) Checking for service worker / precache/static bundle references...\n")
for candidate in ['service-worker.js','sw.js','precache-manifest','precache-manifest.*.js']:
    for p in ROOT.rglob(candidate):
        print(f"Found possible SW/precache file: {p.relative_to(ROOT)}")

# Attempt to load Django and print Ticket DB rows (if project configured)
print("\n4) Attempting to load Django and print Ticket rows (if available)...\n")
try:
    # Determine DJANGO_SETTINGS_MODULE
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
    import django
    django.setup()
    from tickets.models import Ticket
    qs = Ticket.objects.all()
    print(f"Ticket.objects.count() = {qs.count()}")
    for t in qs[:50]:
        print({
            'id': t.id,
            'pnr': getattr(t,'pnr',None),
            'flight_number': getattr(t,'flight_number',None),
            'ticket_number': getattr(t,'ticket_number',None),
            'organization_id': getattr(t,'organization_id',None),
            'owner_organization_id': getattr(t,'owner_organization_id',None),
            'inventory_owner_organization_id': getattr(t,'inventory_owner_organization_id',None),
            'reselling_allowed': getattr(t,'reselling_allowed',None),
            'created_at': getattr(t,'created_at',None),
        })
except Exception as e:
    print('Django DB check skipped or failed:', e)
    print('If you want DB output, run this script from the project root with the virtualenv active and ensure Django settings are reachable.')

print('\nDiagnostic script finished.')
