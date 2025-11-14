"""
Diagnostic helper to find where a ticket row may be coming from.
Usage (from project root, venv activated):
python scripts/diagnose_ticket_issue.py --ticket-id 58 --flight SAE-630 --owner-org 11

This script will:
- print Ticket count and matching tickets by id/pnr/flight/owner
- list OrganizationLink entries related to the owner or reseller
- list AllowedReseller entries relevant to owner/reseller
- search repository files for matching strings (flight number, pnr, ticket number)
"""
import os
import sys
import argparse
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--ticket-id', type=int, help='Ticket id to look for')
parser.add_argument('--flight', help='Flight number to search for (e.g. SAE-630)')
parser.add_argument('--pnr', help='PNR to search for')
parser.add_argument('--owner-org', type=int, help='Owner organization id')
parser.add_argument('--reseller-org', type=int, help='Reseller organization id (optional)')
args = parser.parse_args()

# configure Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
try:
    import django
    django.setup()
except Exception as e:
    print('Failed to setup Django. Are you running this from the project root with the venv activated?')
    print('Error:', e)
    sys.exit(2)

from tickets.models import Ticket
# organization models
try:
    from organization.models import OrganizationLink, Organization
except Exception:
    OrganizationLink = None
    Organization = None

try:
    from booking.models import AllowedReseller
except Exception:
    AllowedReseller = None

print('\n=== Ticket table summary ===')
try:
    total = Ticket.objects.count()
    print('Total Ticket rows:', total)
except Exception as e:
    print('Error reading Ticket table:', e)
    total = None

filters = []
if args.ticket_id:
    print('\nLooking up Ticket.id ==', args.ticket_id)
    try:
        t = Ticket.objects.filter(id=args.ticket_id)
        for x in t:
            print('TICKET:', x.id, getattr(x,'flight_number',None), getattr(x,'pnr',None), 'org=', getattr(x,'organization_id',None), 'reselling_allowed=', getattr(x,'reselling_allowed',None))
    except Exception as e:
        print('Lookup by id error:', e)

if args.flight:
    print('\nSearching Ticket.flight_number contains', args.flight)
    try:
        qs = Ticket.objects.filter(flight_number__icontains=args.flight)
        print('Matches:', qs.count())
        for x in qs[:50]:
            print(' ->', x.id, x.flight_number, getattr(x,'pnr',None), 'org=', getattr(x,'organization_id',None), 'resell=', getattr(x,'reselling_allowed',None))
    except Exception as e:
        print('Flight search error:', e)

if args.pnr:
    print('\nSearching Ticket.pnr contains', args.pnr)
    try:
        qs = Ticket.objects.filter(pnr__icontains=args.pnr)
        print('Matches:', qs.count())
        for x in qs[:50]:
            print(' ->', x.id, x.pnr, x.flight_number, 'org=', getattr(x,'organization_id',None))
    except Exception as e:
        print('PNR search error:', e)

# List a small sample of ticket rows if table small
if total is not None and total <= 100:
    try:
        print('\nAll Ticket rows (sample):')
        for x in Ticket.objects.all():
            print(' -', x.id, getattr(x,'flight_number',None), getattr(x,'pnr',None), 'org=', getattr(x,'organization_id',None), 'resell=', getattr(x,'reselling_allowed',None), 'status=', getattr(x,'status',None))
    except Exception as e:
        print('Error listing tickets:', e)

# OrganizationLink and AllowedReseller details
if args.owner_org:
    print('\n=== OrganizationLink and AllowedReseller checks for owner org', args.owner_org, '===')
    if OrganizationLink is not None:
        try:
            # show links where main_organization_id == owner or link_organization_id == owner
            links = OrganizationLink.objects.filter(Q(main_organization_id=args.owner_org) | Q(link_organization_id=args.owner_org))
            print('OrganizationLink rows relevant to owner:', links.count())
            for l in links[:50]:
                print(' -> id', l.id, 'main=', getattr(l,'main_organization_id',None), 'link=', getattr(l,'link_organization_id',None), 'status=', getattr(l,'request_status',None))
        except Exception as e:
            print('OrganizationLink query error:', e)
    else:
        print('OrganizationLink model not available')

    if AllowedReseller is not None:
        try:
            ars = AllowedReseller.objects.filter(inventory_owner_company__organization_id=args.owner_org)
            print('AllowedReseller entries for owner org:', ars.count())
            for ar in ars[:50]:
                print(' -> id', ar.id, 'reseller=', getattr(ar,'reseller_company_id',None), 'status=', getattr(ar,'requested_status_by_reseller',None), 'allowed_types=', getattr(ar,'allowed_types',None), 'allowed_items=', getattr(ar,'allowed_items',None))
        except Exception as e:
            print('AllowedReseller query error:', e)
    else:
        print('AllowedReseller model not available')

# If reseller org provided, show links for reseller
if args.reseller_org:
    print('\n=== Links for reseller org', args.reseller_org, '===')
    if OrganizationLink is not None:
        try:
            links = OrganizationLink.objects.filter(Q(main_organization_id=args.reseller_org) | Q(link_organization_id=args.reseller_org))
            print('OrganizationLink rows relevant to reseller:', links.count())
            for l in links[:50]:
                print(' -> id', l.id, 'main=', getattr(l,'main_organization_id',None), 'link=', getattr(l,'link_organization_id',None), 'status=', getattr(l,'request_status',None))
        except Exception as e:
            print('OrganizationLink query error for reseller:', e)
    if AllowedReseller is not None:
        try:
            ars = AllowedReseller.objects.filter(reseller_company_id=args.reseller_org)
            print('AllowedReseller entries for reseller org:', ars.count())
            for ar in ars[:50]:
                inv = getattr(ar,'inventory_owner_company',None)
                inv_org_id = None
                try:
                    inv_org_id = getattr(inv,'organization_id',None) or getattr(inv,'main_organization_id',None)
                except Exception:
                    inv_org_id = None
                print(' -> id', ar.id, 'inv_owner_org=', inv_org_id, 'allowed_types=', getattr(ar,'allowed_types',None), 'allowed_items=', getattr(ar,'allowed_items',None), 'status=', getattr(ar,'requested_status_by_reseller',None))
        except Exception as e:
            print('AllowedReseller query error for reseller:', e)

# Search repo files for flight number / ticket number / pnr
search_terms = []
if args.flight:
    search_terms.append(args.flight)
if args.pnr:
    search_terms.append(args.pnr)
if args.ticket_id:
    search_terms.append(str(args.ticket_id))

if search_terms:
    print('\n=== Repo search for terms:', search_terms, '===')
    root = Path(__file__).resolve().parents[1]
    print('Project root:', root)
    matches = 0
    for term in search_terms:
        print('\nSearching for', term)
        for p in root.rglob('*'):
            try:
                if p.is_file() and p.suffix in ['.py', '.json', '.js', '.jsx', '.html', '.md', '.txt']:
                    content = p.read_text(encoding='utf-8', errors='ignore')
                    if term in content:
                        print('FOUND in', p.relative_to(root))
                        matches += 1
                        if matches > 200:
                            print('...more matches suppressed')
                            raise SystemExit
            except Exception:
                continue
    if matches == 0:
        print('No matches found in repo for the search terms')

print('\n=== Diagnostic script complete ===')
