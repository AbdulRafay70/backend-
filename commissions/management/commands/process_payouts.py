from django.core.management.base import BaseCommand
from django.utils import timezone

from commissions.models import CommissionEarning
from commissions.services import redeem_commission
from logs.models import SystemLog


class Command(BaseCommand):
    help = "Process eligible commission earnings and post payouts to ledger."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", dest="dry_run", help="Do not post to ledger, only show what would be done")
        parser.add_argument("--limit", type=int, dest="limit", default=100, help="Maximum number of earnings to process")
        parser.add_argument("--status", dest="status", default="pending,earned", help="Comma-separated statuses to include (default: pending,earned)")

    def handle(self, *args, **options):
        dry_run = options.get("dry_run")
        limit = options.get("limit")
        status_csv = options.get("status") or "pending,earned"
        statuses = [s.strip() for s in status_csv.split(",") if s.strip()]

        qs = CommissionEarning.objects.filter(redeemed=False, commission_amount__gt=0, status__in=statuses).order_by("created_at")[:limit]

        count = qs.count()
        self.stdout.write(f"Found {count} eligible earnings (dry_run={dry_run})")

        processed = 0
        successes = 0
        failures = 0

        for earning in qs:
            processed += 1
            try:
                if dry_run:
                    self.stdout.write(f"[DRY] Would redeem earning #{earning.id} amount={earning.commission_amount}")
                    SystemLog.objects.create(
                        action_type="commission:payout:dry-run",
                        model_name="CommissionEarning",
                        record_id=earning.id,
                        organization_id=getattr(earning, "organization_id", None),
                        branch_id=getattr(earning, "branch_id", None),
                        agency_id=getattr(earning, "agency_id", None),
                        user_id=None,
                        description=f"Dry-run payout for earning {earning.id}",
                        status="success",
                        new_data={"amount": str(earning.commission_amount)},
                    )
                    successes += 1
                    continue

                tx = redeem_commission(earning, created_by=None)
                if tx:
                    self.stdout.write(f"Redeemed earning #{earning.id} -> ledger:{tx}")
                    SystemLog.objects.create(
                        action_type="commission:payout",
                        model_name="CommissionEarning",
                        record_id=earning.id,
                        organization_id=getattr(earning, "organization_id", None),
                        branch_id=getattr(earning, "branch_id", None),
                        agency_id=getattr(earning, "agency_id", None),
                        user_id=None,
                        description=f"Payout posted for earning {earning.id} ledger:{tx}",
                        status="success",
                        new_data={"ledger_tx_ref": f"ledger:{tx}"},
                    )
                    successes += 1
                else:
                    self.stdout.write(f"Failed to redeem earning #{earning.id}")
                    SystemLog.objects.create(
                        action_type="commission:payout:failed",
                        model_name="CommissionEarning",
                        record_id=earning.id,
                        organization_id=getattr(earning, "organization_id", None),
                        branch_id=getattr(earning, "branch_id", None),
                        agency_id=getattr(earning, "agency_id", None),
                        user_id=None,
                        description=f"Payout failed for earning {earning.id}",
                        status="failed",
                    )
                    failures += 1
            except Exception as exc:
                failures += 1
                self.stderr.write(f"Error processing earning {earning.id}: {exc}")
                SystemLog.objects.create(
                    action_type="commission:payout:error",
                    model_name="CommissionEarning",
                    record_id=earning.id,
                    organization_id=getattr(earning, "organization_id", None),
                    branch_id=getattr(earning, "branch_id", None),
                    agency_id=getattr(earning, "agency_id", None),
                    user_id=None,
                    description=f"Exception during payout for earning {earning.id}: {exc}",
                    status="failed",
                )

        self.stdout.write(f"Processed={processed} successes={successes} failures={failures}")
