from django.test import TestCase
from django.utils import timezone
from leads.models import LoanCommitment, Lead
from organization.models import Organization, Branch
from django.core.management import call_command
import datetime


class CommandsTests(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name="OrgCmd")
        self.branch = Branch.objects.create(organization=self.org, name="BranchCmd")

    def test_mark_overdue_loans_command(self):
        lead = Lead.objects.create(customer_full_name="CmdLead", branch=self.branch, organization=self.org)
        overdue_date = timezone.now().date() - datetime.timedelta(days=3)
        loan = LoanCommitment.objects.create(lead=lead, promised_clear_date=overdue_date, status="pending")

        call_command("mark_overdue_loans")
        loan.refresh_from_db()
        self.assertEqual(loan.status, "overdue")
