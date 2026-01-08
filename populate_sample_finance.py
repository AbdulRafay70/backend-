"""
Simple script to populate financial records with sample data.
Run this from the backend directory with: python populate_sample_finance.py
"""

import os
import django
import sys

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from finance.models import FinancialRecord
from organization.models import Organization, Branch, Agency
from decimal import Decimal
import random
from datetime import datetime, timedelta


def populate_finance_data():
    print('Starting to populate financial data...\n')
    
    # Get or create organization and branch
    org, _ = Organization.objects.get_or_create(
        id=1,
        defaults={'name': 'SAER Travel', 'email': 'info@saer.pk'}
    )
    
    branch, _ = Branch.objects.get_or_create(
        id=1,
        defaults={'name': 'Main Branch', 'organization': org}
    )

    # Get or create sample agency
    agency, _ = Agency.objects.get_or_create(
        id=1,
        defaults={'name': 'Al-Haramain Tours', 'branch': branch}
    )

    # Clear existing financial records
    print('Clearing existing financial records...')
    deleted_count = FinancialRecord.objects.all().count()
    FinancialRecord.objects.all().delete()
    print(f'Deleted {deleted_count} old records.\n')

    # Sample data for each service type
    service_data = {
        'hotel': {
            'count': 25,
            'income_range': (50000, 200000),
            'purchase_range': (30000, 120000),
            'expense_range': (5000, 20000),
        },
        'ticket': {
            'count': 40,
            'income_range': (80000, 150000),
            'purchase_range': (60000, 110000),
            'expense_range': (3000, 10000),
        },
        'transport': {
            'count': 30,
            'income_range': (20000, 80000),
            'purchase_range': (10000, 50000),
            'expense_range': (2000, 8000),
        },
        'visa': {
            'count': 35,
            'income_range': (15000, 50000),
            'purchase_range': (8000, 30000),
            'expense_range': (1000, 5000),
        },
        'umrah': {
            'count': 20,
            'income_range': (300000, 800000),
            'purchase_range': (200000, 600000),
            'expense_range': (10000, 50000),
        },
        'other': {
            'count': 15,
            'income_range': (10000, 100000),
            'purchase_range': (5000, 60000),
            'expense_range': (1000, 10000),
        },
    }

    total_created = 0
    start_date = datetime.now() - timedelta(days=90)

    for service_type, config in service_data.items():
        print(f'Creating {config["count"]} {service_type} records...')
        
        for i in range(config['count']):
            # Determine if this should be a loss transaction (10-15% chance)
            is_loss = random.random() < 0.12  # 12% chance of loss
            
            if is_loss:
                # For loss transactions: make expenses higher than income
                income = Decimal(str(random.randint(*config['income_range'])))
                purchase = Decimal(str(random.randint(
                    int(config['purchase_range'][0] * 1.2),  # Higher purchase cost
                    int(config['purchase_range'][1] * 1.5)
                )))
                expense = Decimal(str(random.randint(
                    int(config['expense_range'][0] * 1.5),  # Higher expenses
                    int(config['expense_range'][1] * 2)
                )))
            else:
                # Normal profitable transaction
                income = Decimal(str(random.randint(*config['income_range'])))
                purchase = Decimal(str(random.randint(*config['purchase_range'])))
                expense = Decimal(str(random.randint(*config['expense_range'])))
            
            # Calculate profit correctly: Income - Purchase - Expense
            profit = income - purchase - expense
            
            # Random date within last 90 days
            days_ago = random.randint(0, 90)
            record_date = start_date + timedelta(days=days_ago)
            
            # Vary the status for more realism
            status_options = ['active', 'active', 'active', 'completed', 'pending']
            status = random.choice(status_options)
            
            # Create financial record
            fr = FinancialRecord.objects.create(
                organization=org,
                branch=branch,
                agent=agency if random.random() > 0.3 else None,
                service_type=service_type,
                booking_id=1000 + total_created,
                reference_no=f"SAER-{service_type.upper()[:3]}-{1000 + i:05d}",
                description=f"{'Loss-making' if is_loss else 'Profitable'} {service_type} booking",
                income_amount=income,
                purchase_cost=purchase,
                expenses_amount=expense,
                profit_loss=profit,
                currency='PKR',
                status=status,
            )
            
            # Update created_at to spread records over time
            FinancialRecord.objects.filter(id=fr.id).update(created_at=record_date)
            
            total_created += 1

    print(f'\n✅ Successfully created {total_created} financial records!')
    
    # Display summary
    print('\n' + '='*70)
    print('SUMMARY BY SERVICE TYPE:')
    print('='*70)
    
    for service_type in service_data.keys():
        records = FinancialRecord.objects.filter(service_type=service_type)
        total_income = sum(r.income_amount for r in records)
        total_expense = sum(r.expenses_amount for r in records)
        total_profit = sum(r.profit_loss for r in records)
        
        print(
            f'{service_type.upper():15} | '
            f'Income: Rs. {total_income:>12,.0f} | '
            f'Expense: Rs. {total_expense:>10,.0f} | '
            f'Profit: Rs. {total_profit:>10,.0f}'
        )
    
    # Overall totals
    all_records = FinancialRecord.objects.all()
    grand_income = sum(r.income_amount for r in all_records)
    grand_expense = sum(r.expenses_amount for r in all_records)
    grand_profit = sum(r.profit_loss for r in all_records)
    
    print('='*70)
    print(
        f'{"TOTAL":15} | '
        f'Income: Rs. {grand_income:>12,.0f} | '
        f'Expense: Rs. {grand_expense:>10,.0f} | '
        f'Profit: Rs. {grand_profit:>10,.0f}'
    )
    print('='*70)


if __name__ == '__main__':
    populate_finance_data()
