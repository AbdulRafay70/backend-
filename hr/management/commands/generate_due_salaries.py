"""
Django management command to automatically generate salary payments for employees
whose salary payment date matches today's date.

Run this command daily using a cron job or task scheduler:
- Linux/Mac: Add to crontab: 0 0 * * * /path/to/python manage.py generate_due_salaries
- Windows: Use Task Scheduler to run at midnight daily
"""

from django.core.management.base import BaseCommand
from django.db.models import Sum
from datetime import date
import calendar
from hr import models


class Command(BaseCommand):
    help = 'Generate salary payments for employees whose payment date is today'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force generation even if payments already exist for this month'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be generated without actually creating records'
        )

    def handle(self, *args, **options):
        force = options.get('force', False)
        dry_run = options.get('dry_run', False)
        
        today = date.today()
        current_day = today.day
        current_month = today.month
        current_year = today.year
        
        self.stdout.write(self.style.SUCCESS(f'\n🗓️  Running salary generation for: {today.strftime("%B %d, %Y")}'))
        self.stdout.write(self.style.SUCCESS(f'Looking for employees with payment date: {current_day}\n'))
        
        # Get active employees whose salary_payment_date matches today
        employees = models.Employee.objects.filter(
            is_active=True,
            salary_payment_date=current_day
        )
        
        if not employees.exists():
            self.stdout.write(self.style.WARNING(f'✗ No active employees with payment date {current_day}'))
            return
        
        self.stdout.write(self.style.SUCCESS(f'✓ Found {employees.count()} employee(s) due for salary payment:\n'))
        
        for emp in employees:
            self.stdout.write(f'  • {emp.first_name} {emp.last_name} (ID: {emp.id})')
        
        self.stdout.write('')  # Empty line
        
        # Check for existing payments
        if not force:
            existing = models.SalaryPayment.objects.filter(
                employee__in=employees,
                month=current_month,
                year=current_year
            )
            if existing.exists():
                self.stdout.write(self.style.WARNING(
                    f'✗ Salary payments already exist for {existing.count()} employee(s) in {today.strftime("%B %Y")}'
                ))
                self.stdout.write(self.style.WARNING(
                    'Use --force flag to regenerate (this will skip existing records)'
                ))
                return
        
        created_count = 0
        skipped_count = 0
        error_count = 0
        
        for emp in employees:
            try:
                # Check if payment already exists for this employee
                if models.SalaryPayment.objects.filter(
                    employee=emp,
                    month=current_month,
                    year=current_year
                ).exists():
                    skipped_count += 1
                    self.stdout.write(self.style.WARNING(
                        f'⚠ Skipped {emp.first_name} {emp.last_name} - payment already exists'
                    ))
                    continue
                
                # Calculate commission total for the month
                comm_total = models.Commission.objects.filter(
                    employee=emp,
                    date__month=current_month,
                    date__year=current_year
                ).aggregate(total=Sum('amount'))['total'] or 0
                
                # Calculate fine deductions for the month
                fine_total = models.Fine.objects.filter(
                    employee=emp,
                    date__month=current_month,
                    date__year=current_year
                ).aggregate(total=Sum('amount'))['total'] or 0
                
                base_salary = emp.salary or 0
                net_amount = float(base_salary) + float(comm_total) - float(fine_total)
                
                # Calculate expected payment date
                expected_date = None
                if emp.salary_payment_date:
                    try:
                        last_day = calendar.monthrange(current_year, current_month)[1]
                        payment_day = min(emp.salary_payment_date, last_day)
                        expected_date = date(current_year, current_month, payment_day)
                    except (ValueError, TypeError):
                        pass
                
                if dry_run:
                    self.stdout.write(self.style.SUCCESS(
                        f'✓ Would create payment for {emp.first_name} {emp.last_name}:\n'
                        f'    Base: Rs {base_salary}, Commission: Rs {comm_total}, '
                        f'Fines: Rs {fine_total}, Net: Rs {net_amount}\n'
                        f'    Expected Date: {expected_date}'
                    ))
                else:
                    # Create salary payment
                    payment = models.SalaryPayment.objects.create(
                        employee=emp,
                        month=current_month,
                        year=current_year,
                        base_salary=base_salary,
                        commission_total=comm_total,
                        fine_deductions=fine_total,
                        net_amount=net_amount,
                        expected_payment_date=expected_date,
                        status='pending',
                        notes=f'Auto-generated on {today.strftime("%Y-%m-%d")}'
                    )
                    created_count += 1
                    self.stdout.write(self.style.SUCCESS(
                        f'✓ Created payment #{payment.id} for {emp.first_name} {emp.last_name}\n'
                        f'    Base: Rs {base_salary}, Commission: Rs {comm_total}, '
                        f'Fines: Rs {fine_total}, Net: Rs {net_amount}\n'
                        f'    Expected Payment: {expected_date}'
                    ))
                
            except Exception as e:
                error_count += 1
                self.stdout.write(self.style.ERROR(
                    f'✗ Error creating payment for {emp.first_name} {emp.last_name}: {str(e)}'
                ))
        
        # Summary
        self.stdout.write('')
        if dry_run:
            self.stdout.write(self.style.SUCCESS(
                f'\n🔍 DRY RUN COMPLETE - No records were created'
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                f'\n✅ GENERATION COMPLETE'
            ))
        
        self.stdout.write(self.style.SUCCESS(f'Created: {created_count}'))
        if skipped_count > 0:
            self.stdout.write(self.style.WARNING(f'Skipped: {skipped_count}'))
        if error_count > 0:
            self.stdout.write(self.style.ERROR(f'Errors: {error_count}'))
