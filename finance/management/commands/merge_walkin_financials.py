from django.core.management.base import BaseCommand, CommandError
from finance.models import FinancialRecord, AuditLog
from django.db import transaction


class Command(BaseCommand):
    help = "Merge FinancialRecords of linked walk-ins into a single FinancialRecord for a parent booking (non-destructive)."

    def add_arguments(self, parser):
        parser.add_argument('booking_id', type=int, help='Parent booking id to merge walk-in financials into')

    def handle(self, *args, **options):
        booking_id = options.get('booking_id')
        if not booking_id:
            raise CommandError('booking_id is required')

        # Find main FRs and linked FRs
        main_qs = FinancialRecord.objects.filter(booking_id=booking_id)
        linked_qs = FinancialRecord.objects.filter(metadata__linked_booking_id=booking_id)

        if not main_qs.exists() and not linked_qs.exists():
            self.stdout.write(self.style.WARNING(f'No FinancialRecords found for booking {booking_id}'))
            return

        # Aggregate totals
        def sum_field(qs, field):
            total = 0
            for r in qs:
                val = getattr(r, field) or 0
                total += val
            return total

        income = sum_field(main_qs, 'income_amount') + sum_field(linked_qs, 'income_amount')
        purchase = sum_field(main_qs, 'purchase_cost') + sum_field(linked_qs, 'purchase_cost')
        expenses = sum_field(main_qs, 'expenses_amount') + sum_field(linked_qs, 'expenses_amount')
        profit = sum_field(main_qs, 'profit_loss') + sum_field(linked_qs, 'profit_loss')

        # Create merged FR atomically and keep originals
        with transaction.atomic():
            merged = FinancialRecord.objects.create(
                booking_id=booking_id,
                organization=(main_qs.first() or linked_qs.first()).organization,
                branch=(main_qs.first() or linked_qs.first()).branch,
                income_amount=income,
                purchase_cost=purchase,
                expenses_amount=expenses,
                profit_loss=profit,
                currency='PKR',
                metadata={'merged_from': [r.id for r in list(main_qs) + list(linked_qs)]}
            )

            # Audit log entry
            try:
                AuditLog.objects.create(
                    actor=None,
                    action='merge',
                    object_type='FinancialRecord',
                    object_id=str(merged.id),
                    before={'merged_from': [r.id for r in list(main_qs) + list(linked_qs)]},
                    after={'merged_into': merged.id},
                    reason=f'Merged FRs into aggregated FR for booking {booking_id}'
                )
            except Exception:
                pass

        self.stdout.write(self.style.SUCCESS(f'Created merged FinancialRecord id={merged.id} for booking {booking_id}'))
