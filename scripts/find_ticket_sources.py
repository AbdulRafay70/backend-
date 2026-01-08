"""
Diagnostic script to find ticket data sources.
- Prints Ticket model rows (if Django available)
- Searches repository files for common ticket identifiers (flight number, ticket number, seed PNRs)
- Lists local sqlite DB files and their sizes
- Attempts an HTTP GET to local API /api/tickets/ for detected org IDs (if requests available)

Run from the project root: python scripts/find_ticket_sources.py
"""
import os
import sys
import traceback
import fnmatch
import json
from datetime import datetime

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
print('Repository root:', ROOT)

# Helper: search files for patterns
def search_files(patterns, exclude_dirs=('.venv', 'node_modules', '.git', '__pycache__', 'venv')):
    hits = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        # skip excluded dirs
        skip = False
        for ex in exclude_dirs:
            if ex in dirpath:
                skip = True
                break
        if skip:
            continue
        for fname in filenames:
            # only search text files
            if fname.endswith(('.py', '.js', '.jsx', '.json', '.sql', '.md', '.txt', '.html')):
                fpath = os.path.join(dirpath, fname)
                try:
                    with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
                        for i, line in enumerate(f, start=1):
                            for p in patterns:
                                if p in line:
                                    hits.append((p, fpath, i, line.strip()))
                except Exception:
                    pass
    return hits

# 1) Check for local sqlite files
print('\n-- Local sqlite files --')
for candidate in ('db.sqlite3', 'local_db.sqlite3', 'db_new.sqlite3'):
    path = os.path.join(ROOT, candidate)
    if os.path.exists(path):
        stat = os.stat(path)
        print(f"{candidate}: exists, size={stat.st_size} bytes, mtime={datetime.fromtimestamp(stat.st_mtime)}")
    else:
        print(f"{candidate}: not found")

# 2) Search for known ticket strings
patterns = ["SAE-630", "TKT-0D166A4E", "SaerAir", "SEEDPNR", "SEEDPNR1", "SEEDPNR2", "TKT-"]
hits = search_files(patterns)
print('\n-- Text search hits (first 50) --')
if not hits:
    print('No text hits for patterns:', patterns)
else:
    for h in hits[:50]:
        p, fpath, lineno, line = h
        print(f"pattern={p} file={os.path.relpath(fpath, ROOT)}:{lineno} -> {line}")

# 3) Try to load Django and inspect Ticket table
print('\n-- Django ORM Ticket inspection --')
DJANGO_OK = False
try:
    import django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
    sys.path.insert(0, ROOT)
    django.setup()
    DJANGO_OK = True
except Exception as e:
    print('Failed to setup Django:', e)
    traceback.print_exc()

if DJANGO_OK:
    try:
        from tickets.models import Ticket
        from organization.models import Organization
        tcount = Ticket.objects.count()
        print('Ticket.objects.count() =', tcount)
        if tcount > 0:
            print('\nListing up to 50 Tickets:')
            for t in Ticket.objects.all()[:50]:
                print(f'id={t.id} pnr={getattr(t, "pnr", None)} flight_number={getattr(t, "flight_number", None)} ticket_number={getattr(t, "ticket_number", None)} org={getattr(t, "organization_id", None)} owner_org={getattr(t, "owner_organization_id", None)} reselling_allowed={getattr(t, "reselling_allowed", None)} updated_at={getattr(t, "updated_at", None)}')
        else:
            print('No Ticket rows in DB')

        # Show some organization IDs for convenience
        orgs = Organization.objects.all()[:10]
        print('\nSample organizations:')
        for o in orgs:
            print(f'id={o.id} name={o.name}')

    except Exception as e:
        print('Error querying Ticket model:', e)
        traceback.print_exc()

# 4) If requests is available, attempt a GET to the local API for a sample org id
print('\n-- Local API check (attempt) --')
try:
    import requests
    if DJANGO_OK:
        # try each sample org id discovered above or fallback to 1
        try:
            sample_orgs = [o.id for o in Organization.objects.all()[:5]] or [1]
        except Exception:
            sample_orgs = [1]
    else:
        sample_orgs = [1]
    for oid in sample_orgs:
        url = f'http://127.0.0.1:8000/api/tickets/?organization={oid}'
        try:
            r = requests.get(url, timeout=5)
            print(f'GET {url} -> status {r.status_code} content-type {r.headers.get("content-type")}')
            try:
                print('Response json keys/sample:', json.dumps(r.json() if isinstance(r.json(), dict) else (r.json()[:10] if isinstance(r.json(), list) else str(r.json())), default=str)[:1000])
            except Exception as e:
                print('Failed to parse JSON response:', e)
                print('Raw text (first 1000 chars):', r.text[:1000])
        except Exception as e:
            print('Request failed for', url, e)
except Exception:
    print('requests not available or failed to run; skipping local API checks')

print('\n-- Script finished --')
