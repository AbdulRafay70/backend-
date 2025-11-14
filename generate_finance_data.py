"""
Finance Module - Fake Data Generator
Creates realistic test data for all finance API endpoints
"""
import os
import django
from decimal import Decimal
from datetime import datetime, timedelta
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from django.contrib.auth.models import User
from organization.models import Organization, Branch, Agency
from finance.models import FinancialRecord, Expense, ChartOfAccount, TransactionJournal
from ledger.models import Account, LedgerEntry

print("=" * 80)
print("🏦 FINANCE MODULE - FAKE DATA GENERATOR")
print("=" * 80)

# Get or create test organization, branch, user, agency
try:
    org = Organization.objects.first()
    if not org:
        org = Organization.objects.create(
            name="Saer Travel & Tours",
            contact_email="info@saer.pk",
            contact_phone="+92-300-1234567"
        )
        print(f"✓ Created Organization: {org.name}")
    else:
        print(f"✓ Using Organization: {org.name}")

    branch = Branch.objects.filter(organization=org).first()
    if not branch:
        branch = Branch.objects.create(
            organization=org,
            name="Lahore Head Office",
            code="LHR-HQ",
            contact_phone="+92-42-1234567"
        )
        print(f"✓ Created Branch: {branch.name}")
    else:
        print(f"✓ Using Branch: {branch.name}")

    user = User.objects.first()
    if not user:
        user = User.objects.create_user(
            username='admin',
            email='admin@saer.pk',
            password='admin123',
            is_staff=True,
            is_superuser=True
        )
        print(f"✓ Created User: {user.username}")
    else:
        print(f"✓ Using User: {user.username}")

    # Create multiple agencies for variety
    agencies = list(Agency.objects.filter(branch=branch)[:5])
    if len(agencies) < 3:
        for i in range(3 - len(agencies)):
            agency = Agency.objects.create(
                branch=branch,
                name=f"Travel Agency {chr(65+i)}",
                ageny_name=f"Travel Agency {chr(65+i)}",
                email=f"agency{chr(65+i).lower()}@example.com",
                phone_number=f"+92-300-{random.randint(1000000, 9999999)}",
                agency_type="Full Agency",
                agreement_status=True
            )
            agencies.append(agency)
            print(f"✓ Created Agency: {agency.name}")
    
    if not agencies:
        agencies = [None]  # Fallback

except Exception as e:
    print(f"❌ Error setting up basic data: {e}")
    exit(1)

print("\n" + "=" * 80)
print("📊 CREATING CHART OF ACCOUNTS")
print("=" * 80)

# Create Chart of Accounts
coa_data = [
    {"name": "Cash", "type": "asset", "code": "1001"},
    {"name": "Bank Account", "type": "asset", "code": "1002"},
    {"name": "Accounts Receivable", "type": "asset", "code": "1100"},
    {"name": "Accounts Payable", "type": "liability", "code": "2001"},
    {"name": "Service Income - Hotel", "type": "income", "code": "4001"},
    {"name": "Service Income - Ticket", "type": "income", "code": "4002"},
    {"name": "Service Income - Transport", "type": "income", "code": "4003"},
    {"name": "Service Income - Visa", "type": "income", "code": "4004"},
    {"name": "Service Income - Umrah", "type": "income", "code": "4005"},
    {"name": "Hotel Expenses", "type": "expense", "code": "5001"},
    {"name": "Fuel Expenses", "type": "expense", "code": "5002"},
    {"name": "Staff Salary", "type": "expense", "code": "5003"},
    {"name": "Visa Fee", "type": "expense", "code": "5004"},
    {"name": "Maintenance", "type": "expense", "code": "5005"},
    {"name": "Rent", "type": "expense", "code": "5006"},
    {"name": "Other Expenses", "type": "expense", "code": "5999"},
]

coa_objects = {}
for coa_info in coa_data:
    coa, created = ChartOfAccount.objects.get_or_create(
        organization=org,
        code=coa_info["code"],
        defaults={
            "name": coa_info["name"],
            "type": coa_info["type"],
            "branch": branch,
        }
    )
    coa_objects[coa_info["name"]] = coa
    if created:
        print(f"  ✓ Created COA: {coa.code} - {coa.name}")

print(f"\n✅ Total Chart of Accounts: {len(coa_objects)}")

print("\n" + "=" * 80)
print("💰 CREATING FINANCIAL RECORDS")
print("=" * 80)

# Create Financial Records for different services
service_types = ['hotel', 'ticket', 'transport', 'visa', 'umrah', 'other']
base_date = datetime.now() - timedelta(days=90)

financial_records = []
for i in range(50):  # Create 50 financial records
    days_offset = random.randint(0, 90)
    record_date = base_date + timedelta(days=days_offset)
    
    service_type = random.choice(service_types)
    income = Decimal(str(random.randint(50000, 500000)))  # 50k to 500k PKR
    purchase = Decimal(str(random.randint(30000, int(float(income) * 0.7))))
    expenses = Decimal(str(random.randint(5000, 50000)))
    profit = income - purchase - expenses
    
    agency = random.choice([a for a in agencies if a is not None] or [None])
    
    fr = FinancialRecord.objects.create(
        booking_id=random.randint(1000, 9999),
        agent=agency,
        reference_no=f"INV-{record_date.strftime('%Y%m')}-{random.randint(1000, 9999)}",
        description=f"{service_type.title()} service for booking",
        status="active",
        created_by=user,
        last_updated_by=user,
        organization=org,
        branch=branch,
        service_type=service_type,
        income_amount=income,
        purchase_cost=purchase,
        expenses_amount=expenses,
        profit_loss=profit,
        currency="PKR",
        metadata={
            "booking_number": f"BK-{random.randint(10000, 99999)}",
            "passenger_count": random.randint(1, 10),
            "payment_status": random.choice(["paid", "pending", "partial"])
        },
        created_at=record_date,
        updated_at=record_date
    )
    financial_records.append(fr)
    
    if (i + 1) % 10 == 0:
        print(f"  ✓ Created {i + 1} financial records...")

print(f"\n✅ Total Financial Records: {len(financial_records)}")

print("\n" + "=" * 80)
print("💸 CREATING EXPENSES")
print("=" * 80)

# Create Expenses
expense_categories = [
    ('hotel_cleaning', coa_objects.get('Hotel Expenses')),
    ('fuel', coa_objects.get('Fuel Expenses')),
    ('staff_salary', coa_objects.get('Staff Salary')),
    ('visa_fee', coa_objects.get('Visa Fee')),
    ('maintenance', coa_objects.get('Maintenance')),
    ('rent', coa_objects.get('Rent')),
    ('other', coa_objects.get('Other Expenses')),
]

expenses = []
for i in range(30):  # Create 30 expenses
    days_offset = random.randint(0, 90)
    expense_date = base_date + timedelta(days=days_offset)
    
    category, coa = random.choice(expense_categories)
    amount = Decimal(str(random.randint(5000, 100000)))
    
    expense = Expense.objects.create(
        organization=org,
        branch=branch,
        category=category,
        amount=amount,
        currency="PKR",
        date=expense_date.date(),
        booking_id=random.randint(1000, 9999) if random.random() > 0.5 else None,
        coa=coa,
        notes=f"{category.replace('_', ' ').title()} payment for {expense_date.strftime('%B %Y')}",
        created_by=user,
        created_at=expense_date
    )
    expenses.append(expense)
    
    if (i + 1) % 10 == 0:
        print(f"  ✓ Created {i + 1} expenses...")

print(f"\n✅ Total Expenses: {len(expenses)}")

print("\n" + "=" * 80)
print("📝 CREATING TRANSACTION JOURNALS")
print("=" * 80)

# Ensure ledger accounts exist
ledger_accounts = {}
account_types = [
    ('CASH', 'Cash Account'),
    ('BANK', 'Bank Account'),
    ('RECEIVABLE', 'Accounts Receivable'),
    ('PAYABLE', 'Accounts Payable'),
    ('SALES', 'Sales Account'),
    ('COMMISSION', 'Commission Account'),
    ('SUSPENSE', 'Suspense Account'),
]

for acc_type, acc_name in account_types:
    acc, created = Account.objects.get_or_create(
        organization=org,
        account_type=acc_type,
        defaults={
            'name': acc_name,
            'balance': Decimal('1000000.00'),  # Starting balance
        }
    )
    ledger_accounts[acc_type] = acc
    if created:
        print(f"  ✓ Created Ledger Account: {acc_name}")

# Create Transaction Journals
journals = []
for i in range(20):  # Create 20 journal entries
    days_offset = random.randint(0, 90)
    journal_date = base_date + timedelta(days=days_offset)
    
    amount = Decimal(str(random.randint(10000, 200000)))
    
    # Create double-entry: Debit one account, Credit another
    debit_account = random.choice([ledger_accounts['SALES'], ledger_accounts['RECEIVABLE']])
    credit_account = random.choice([ledger_accounts['CASH'], ledger_accounts['BANK']])
    
    entries = [
        {
            'account_id': debit_account.id,
            'debit': str(amount),
            'credit': '0.00'
        },
        {
            'account_id': credit_account.id,
            'debit': '0.00',
            'credit': str(amount)
        }
    ]
    
    journal = TransactionJournal.objects.create(
        organization=org,
        branch=branch,
        reference=f"JE-{journal_date.strftime('%Y%m')}-{random.randint(1000, 9999)}",
        narration=f"Journal entry for {random.choice(['hotel payment', 'ticket commission', 'salary disbursement', 'visa fee'])}",
        created_by=user,
        entries=entries,
        posted=random.choice([True, False]),  # Some posted, some pending
        created_at=journal_date
    )
    journals.append(journal)
    
    if (i + 1) % 10 == 0:
        print(f"  ✓ Created {i + 1} journals...")

print(f"\n✅ Total Transaction Journals: {len(journals)}")
print(f"   - Posted: {sum(1 for j in journals if j.posted)}")
print(f"   - Pending: {sum(1 for j in journals if not j.posted)}")

print("\n" + "=" * 80)
print("📈 DATA SUMMARY")
print("=" * 80)

# Calculate summaries
total_income = sum(fr.income_amount for fr in financial_records)
total_expenses_fr = sum(fr.expenses_amount for fr in financial_records)
total_profit = sum(fr.profit_loss or Decimal('0.00') for fr in financial_records)
total_expense_records = sum(e.amount for e in expenses)

print(f"\n💰 Financial Records Summary:")
print(f"   - Total Income: PKR {total_income:,.2f}")
print(f"   - Total Purchase Cost: PKR {sum(fr.purchase_cost or Decimal('0.00') for fr in financial_records):,.2f}")
print(f"   - Total Expenses (from records): PKR {total_expenses_fr:,.2f}")
print(f"   - Total Profit/Loss: PKR {total_profit:,.2f}")

print(f"\n💸 Expense Records Summary:")
print(f"   - Total Expenses: PKR {total_expense_records:,.2f}")

print(f"\n📊 By Service Type:")
for svc in service_types:
    svc_records = [fr for fr in financial_records if fr.service_type == svc]
    if svc_records:
        svc_income = sum(fr.income_amount for fr in svc_records)
        svc_profit = sum(fr.profit_loss or Decimal('0.00') for fr in svc_records)
        print(f"   - {svc.upper():<12}: {len(svc_records):>3} records | Income: PKR {svc_income:>12,.2f} | Profit: PKR {svc_profit:>12,.2f}")

print("\n" + "=" * 80)
print("✅ FINANCE DATA GENERATION COMPLETE!")
print("=" * 80)
print("\n🔍 You can now test these API endpoints:")
print("   1. GET /api/finance/summary/all")
print("   2. GET /api/finance/dashboard")
print("   3. GET /api/finance/dashboard/period?period=today")
print("   4. GET /api/finance/expense/list")
print("   5. GET /api/finance/ledger/by-service?service_type=hotel")
print("   6. GET /api/final-balance?type=organization&id=" + str(org.id))
print("   7. POST /api/finance/expense/add")
print("   8. POST /api/finance/manual/post")
print("\n" + "=" * 80)
