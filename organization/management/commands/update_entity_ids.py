from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from organization.models import Organization, Branch, Agency
from organization.utils import generate_organization_id
from universal.models import UniversalRegistration
import re

PREFIX_PATTERNS = {
    'organization': re.compile(r'^ORG-\d{4}$'),
    'branch': re.compile(r'^BRN-\d{4}$'),
    'agency': re.compile(r'^AGN-\d{4}$'),
    'employee': re.compile(r'^EMP-\d{4}$'),
}


class Command(BaseCommand):
    help = (
        "Generate or update prefixed IDs for Organization, Branch, Agency and propagate them to UniversalRegistration.\n"
        "This command does best-effort matching for existing UniversalRegistration rows to set organization_id/branch_id fields.\n"
        "Options:\n"
        "  --dry-run: show what would change without saving.\n"
        "  --force: regenerate IDs even if an ID already exists (use with caution)."
    )

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Do not save changes; just report')
        parser.add_argument('--force', action='store_true', help='Regenerate IDs even if present')

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        force = options['force']

        self.stdout.write("Starting update_entity_ids...\n")

        # 1) Organizations
        orgs = Organization.objects.all()
        changed = []
        with transaction.atomic():
            for org in orgs:
                needs = force or not org.organization_id or not PREFIX_PATTERNS['organization'].match((org.organization_id or ''))
                if needs:
                    new_id = generate_organization_id('organization')
                    changed.append((f'Organization:{org.id}', org.organization_id, new_id))
                    self.stdout.write(f"Will set Organization(id={org.id}) organization_id: {org.organization_id} -> {new_id}")
                    if not dry_run:
                        org.organization_id = new_id
                        org.save()

        # 2) Branches
        with transaction.atomic():
            for br in Branch.objects.select_related('organization').all():
                needs = force or not br.branch_id or not PREFIX_PATTERNS['branch'].match((br.branch_id or ''))
                if needs:
                    new_id = generate_organization_id('branch')
                    changed.append((f'Branch:{br.id}', br.branch_id, new_id))
                    self.stdout.write(f"Will set Branch(id={br.id}) branch_id: {br.branch_id} -> {new_id}")
                    if not dry_run:
                        br.branch_id = new_id
                        br.save()

        # 3) Agencies
        with transaction.atomic():
            for ag in Agency.objects.select_related('branch__organization').all():
                needs = force or not ag.agency_id or not PREFIX_PATTERNS['agency'].match((ag.agency_id or ''))
                if needs:
                    new_id = generate_organization_id('agency')
                    changed.append((f'Agency:{ag.id}', ag.agency_id, new_id))
                    self.stdout.write(f"Will set Agency(id={ag.id}) agency_id: {ag.agency_id} -> {new_id}")
                    if not dry_run:
                        ag.agency_id = new_id
                        ag.save()

        # 4) Propagate to UniversalRegistration (best-effort matching)
        self.stdout.write("\nPropagating generated IDs to UniversalRegistration (best-effort matching)...\n")
        with transaction.atomic():
            for ur in UniversalRegistration.objects.all():
                # For organization-type registrations: try to match Organization by name/email
                if ur.type == UniversalRegistration.TYPE_ORGANIZATION:
                    match = Organization.objects.filter(name__iexact=ur.name).first()
                    if not match and ur.email:
                        match = Organization.objects.filter(email__iexact=ur.email).first()
                    if match:
                        if ur.organization_id != match.organization_id:
                            self.stdout.write(f"UR(org) {ur.id}: organization_id {ur.organization_id} -> {match.organization_id}")
                            if not dry_run:
                                ur.organization_id = match.organization_id
                                ur.save()

                # For branch-type registrations: try to match Branch by name and/or organization
                elif ur.type == UniversalRegistration.TYPE_BRANCH:
                    # Try to find branch by name and organization's name/email
                    branch_match = None
                    # If UR has organization_id set, try to match organization first
                    if ur.organization_id:
                        org_match = Organization.objects.filter(organization_id=ur.organization_id).first()
                        if org_match:
                            branch_match = Branch.objects.filter(name__iexact=ur.name, organization=org_match).first()
                    if not branch_match:
                        branch_match = Branch.objects.filter(name__iexact=ur.name).first()
                    if branch_match:
                        if ur.branch_id != branch_match.branch_id or ur.organization_id != branch_match.organization.organization_id:
                            self.stdout.write(f"UR(branch) {ur.id}: branch_id {ur.branch_id} -> {branch_match.branch_id}, org {ur.organization_id} -> {branch_match.organization.organization_id}")
                            if not dry_run:
                                ur.branch_id = branch_match.branch_id
                                ur.organization_id = branch_match.organization.organization_id
                                ur.save()

                # For agent-type registrations: try to match Agency by name/email/phone
                elif ur.type == UniversalRegistration.TYPE_AGENT:
                    agency_match = Agency.objects.filter(name__iexact=ur.name).first()
                    if not agency_match and ur.email:
                        agency_match = Agency.objects.filter(email__iexact=ur.email).first()
                    if not agency_match and ur.contact_no:
                        agency_match = Agency.objects.filter(phone_number__iexact=ur.contact_no).first()
                    if agency_match:
                        br_id = agency_match.branch.branch_id if agency_match.branch and agency_match.branch.branch_id else None
                        org_id = agency_match.branch.organization.organization_id if agency_match.branch and agency_match.branch.organization and agency_match.branch.organization.organization_id else None
                        if ur.branch_id != br_id or ur.organization_id != org_id:
                            self.stdout.write(f"UR(agent) {ur.id}: branch_id {ur.branch_id} -> {br_id}, org {ur.organization_id} -> {org_id}")
                            if not dry_run:
                                ur.branch_id = br_id
                                ur.organization_id = org_id
                                ur.save()

                # For employee-type registrations: derive organization/branch from parent if available
                elif ur.type == UniversalRegistration.TYPE_EMPLOYEE:
                    if ur.parent:
                        # parent might be organization or branch or agent
                        parent = ur.parent
                        if parent.type == UniversalRegistration.TYPE_ORGANIZATION:
                            if ur.organization_id != parent.organization_id:
                                self.stdout.write(f"UR(employee) {ur.id}: set organization_id {ur.organization_id} -> {parent.organization_id}")
                                if not dry_run:
                                    ur.organization_id = parent.organization_id
                                    ur.save()
                        elif parent.type == UniversalRegistration.TYPE_BRANCH:
                            if ur.branch_id != parent.branch_id or ur.organization_id != parent.organization_id:
                                self.stdout.write(f"UR(employee) {ur.id}: set branch_id {ur.branch_id} -> {parent.branch_id}, org {ur.organization_id} -> {parent.organization_id}")
                                if not dry_run:
                                    ur.branch_id = parent.branch_id
                                    ur.organization_id = parent.organization_id
                                    ur.save()

        if dry_run:
            self.stdout.write('\nDry-run completed. No changes were saved.')
        else:
            self.stdout.write('\nCompleted. Changes were saved to the database.')

        self.stdout.write('\nSummary of direct ID changes (first column = model:id):')
        for item in changed:
            self.stdout.write(f" - {item[0]}: {item[1]} -> {item[2]}")

        self.stdout.write('\nDone.')
