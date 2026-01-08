"""
Comprehensive script to populate ALL finance-related data:
- Expenses (50-100 records)
- Audit Logs (100+ records)
- Balance Sheet accounts (ChartOfAccount with balances)

Run this from the backend directory with: python populate_all_finance_data.py
"""

import os
import django
import sys

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from finance.models import Expense, AuditLog, ChartOfAccount, FinancialRecord
from organization.models import Organization, Branch, Agency
from django.contrib.auth.models import User
from decimal import Decimal
import random
from datetime import datetime, timedelta


def populate_expenses():
    """Create 50-100 expense records across different categories"""
    print('\n' + '='*70)
    print('POPULATING EXPENSES')
    print('='*70)
    
    # Get organization and branch
    org = Organization.objects.first()
    branch = Branch.objects.first()
    
    if not org or not branch:
        print('❌ No organization or branch found. Please run populate_sample_finance.py first.')
        return
    
    # Get or create a user for created_by
    user, _ = User.objects.get_or_create(
        username='admin',
        defaults={'email': 'admin@saer.pk', 'is_staff': True, 'is_superuser': True}
    )
    
    # Clear existing expenses
    deleted = Expense.objects.all().count()
    Expense.objects.all().delete()
    print(f'Deleted {deleted} old expense records.')
    
    expense_categories = [
        ('hotel_cleaning', 5000, 20000),
        ('fuel', 3000, 15000),
        ('staff_salary', 30000, 100000),
        ('visa_fee', 2000, 10000),
        ('maintenance', 5000, 25000),
        ('rent', 50000, 150000),
        ('other', 1000, 30000),
    ]
    
    payment_modes = ['cash', 'bank_transfer', 'cheque', 'online']
    
    total_created = 0
    start_date = datetime.now() - timedelta(days=90)
    
    # Create 70 expense records
    for i in range(70):
        category, min_amt, max_amt = random.choice(expense_categories)
        amount = Decimal(str(random.randint(min_amt, max_amt)))
        
        days_ago = random.randint(0, 90)
        expense_date = (start_date + timedelta(days=days_ago)).date()
        
        Expense.objects.create(
            organization=org,
            branch=branch,
            category=category,
            amount=amount,
            currency='PKR',
            date=expense_date,
            created_by=user,
            booking_id=random.randint(1000, 1165) if random.random() > 0.3 else None,
            notes=f"Sample {category.replace('_', ' ')} expense",
            module_type=random.choice(['hotel', 'ticket', 'transport', 'visa', 'umrah', 'general']),
            payment_mode=random.choice(payment_modes),
            paid_to=f"Vendor {random.randint(1, 20)}"
        )
        total_created += 1
    
    print(f'✅ Created {total_created} expense records')
    
    # Summary by category
    print('\nExpenses by Category:')
    for category, _, _ in expense_categories:
        expenses = Expense.objects.filter(category=category)
        total = sum(e.amount for e in expenses)
        print(f'  {category:20} | Count: {expenses.count():3} | Total: Rs. {total:>12,.0f}')
    
    grand_total = sum(e.amount for e in Expense.objects.all())
    print(f'  {"TOTAL":20} | Count: {Expense.objects.count():3} | Total: Rs. {grand_total:>12,.0f}')


def populate_audit_logs():
    """Create 100+ audit log entries"""
    print('\n' + '='*70)
    print('POPULATING AUDIT LOGS')
    print('='*70)
    
    # Get or create users
    users = []
    for username in ['admin', 'finance_user', 'manager', 'accountant']:
        user, _ = User.objects.get_or_create(
            username=username,
            defaults={'email': f'{username}@saer.pk'}
        )
        users.append(user)
    
    # Clear existing audit logs
    deleted = AuditLog.objects.all().count()
    AuditLog.objects.all().delete()
    print(f'Deleted {deleted} old audit log records.')
    
    actions = ['create', 'update', 'delete']
    object_types = ['FinancialRecord', 'Expense', 'TransactionJournal', 'ChartOfAccount']
    
    total_created = 0
    start_date = datetime.now() - timedelta(days=90)
    
    # Create 120 audit log entries
    for i in range(120):
        action = random.choice(actions)
        object_type = random.choice(object_types)
        actor = random.choice(users)
        
        # Create realistic before/after data
        if action == 'create':
            before = None
            after = {'id': random.randint(1, 1000), 'status': 'active', 'amount': random.randint(1000, 100000)}
        elif action == 'delete':
            before = {'id': random.randint(1, 1000), 'status': 'active', 'amount': random.randint(1000, 100000)}
            after = None
        else:  # update
            before = {'status': 'pending', 'amount': random.randint(1000, 100000)}
            after = {'status': 'active', 'amount': random.randint(1000, 100000)}
        
        days_ago = random.randint(0, 90)
        log_time = start_date + timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
        
        log = AuditLog.objects.create(
            actor=actor,
            action=action,
            object_type=object_type,
            object_id=str(random.randint(1, 1000)),
            before=before,
            after=after,
            reason=f"Sample {action} operation" if random.random() > 0.5 else None,
        )
        
        # Update timestamp to spread over time
        AuditLog.objects.filter(id=log.id).update(timestamp=log_time)
        total_created += 1
    
    print(f'✅ Created {total_created} audit log entries')
    
    # Summary by action
    print('\nAudit Logs by Action:')
    for action in actions:
        count = AuditLog.objects.filter(action=action).count()
        print(f'  {action:10} | Count: {count:3}')
    
    print(f'  {"TOTAL":10} | Count: {AuditLog.objects.count():3}')


def populate_chart_of_accounts():
    """Create Chart of Accounts for Balance Sheet"""
    print('\n' + '='*70)
    print('POPULATING CHART OF ACCOUNTS (Balance Sheet)')
    print('='*70)
    
    org = Organization.objects.first()
    branch = Branch.objects.first()
    
    if not org or not branch:
        print('❌ No organization or branch found.')
        return
    
    # Clear existing COAs
    deleted = ChartOfAccount.objects.all().count()
    ChartOfAccount.objects.all().delete()
    print(f'Deleted {deleted} old chart of account records.')
    
    # Define account structure
    accounts = [
        # Assets
        {'code': '1000', 'name': 'Cash', 'type': 'asset', 'parent': None},
        {'code': '1100', 'name': 'Bank Account - HBL', 'type': 'asset', 'parent': None},
        {'code': '1200', 'name': 'Bank Account - MCB', 'type': 'asset', 'parent': None},
        {'code': '1300', 'name': 'Accounts Receivable', 'type': 'asset', 'parent': None},
        {'code': '1400', 'name': 'Inventory', 'type': 'asset', 'parent': None},
        
        # Liabilities
        {'code': '2000', 'name': 'Accounts Payable', 'type': 'liability', 'parent': None},
        {'code': '2100', 'name': 'Loans Payable', 'type': 'liability', 'parent': None},
        {'code': '2200', 'name': 'Accrued Expenses', 'type': 'liability', 'parent': None},
        
        # Equity
        {'code': '3000', 'name': 'Owner Equity', 'type': 'equity', 'parent': None},
        {'code': '3100', 'name': 'Retained Earnings', 'type': 'equity', 'parent': None},
        
        # Income
        {'code': '4000', 'name': 'Hotel Revenue', 'type': 'income', 'parent': None},
        {'code': '4100', 'name': 'Ticket Revenue', 'type': 'income', 'parent': None},
        {'code': '4200', 'name': 'Transport Revenue', 'type': 'income', 'parent': None},
        {'code': '4300', 'name': 'Visa Revenue', 'type': 'income', 'parent': None},
        {'code': '4400', 'name': 'Umrah Package Revenue', 'type': 'income', 'parent': None},
        
        # Expenses
        {'code': '5000', 'name': 'Salaries Expense', 'type': 'expense', 'parent': None},
        {'code': '5100', 'name': 'Rent Expense', 'type': 'expense', 'parent': None},
        {'code': '5200', 'name': 'Utilities Expense', 'type': 'expense', 'parent': None},
        {'code': '5300', 'name': 'Fuel Expense', 'type': 'expense', 'parent': None},
        {'code': '5400', 'name': 'Maintenance Expense', 'type': 'expense', 'parent': None},
    ]
    
    total_created = 0
    for acc_data in accounts:
        ChartOfAccount.objects.create(
            organization=org,
            branch=branch,
            code=acc_data['code'],
            name=acc_data['name'],
            type=acc_data['type'],
            parent=acc_data['parent'],
            auto_created=False
        )
        total_created += 1
    
    print(f'✅ Created {total_created} chart of account records')
    
    # Summary by type
    print('\nChart of Accounts by Type:')
    for acc_type in ['asset', 'liability', 'equity', 'income', 'expense']:
        count = ChartOfAccount.objects.filter(type=acc_type).count()
        print(f'  {acc_type:10} | Count: {count:3}')


def main():
    print('\n' + '='*70)
    print('COMPREHENSIVE FINANCE DATA POPULATION')
    print('='*70)
    print('This script will populate:')
    print('  1. Expenses (70 records)')
    print('  2. Audit Logs (120 records)')
    print('  3. Chart of Accounts (20 accounts)')
    print('='*70)
    
    populate_expenses()
    populate_audit_logs()
    populate_chart_of_accounts()
    
    print('\n' + '='*70)
    print('✅ ALL FINANCE DATA POPULATED SUCCESSFULLY!')
    print('='*70)
    print('\nSummary:')
    print(f'  Financial Records: {FinancialRecord.objects.count()}')
    print(f'  Expenses:          {Expense.objects.count()}')
    print(f'  Audit Logs:        {AuditLog.objects.count()}')
    print(f'  Chart of Accounts: {ChartOfAccount.objects.count()}')
    print('='*70)


if __name__ == '__main__':
    main()
