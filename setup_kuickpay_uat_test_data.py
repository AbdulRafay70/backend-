"""
Kuickpay UAT Test Data Setup Script

This script creates test consumer records that can be used to test
bill payment integration with Kuickpay UAT environment.

Test Bank: https://app2.kuickpay.com/testbank
Test Portal: https://uatmerchantportal.kuickpay.com/
Prefix: 09571 (CONFIRMED)
"""

import os
import sys
import django
from datetime import date, timedelta
from decimal import Decimal

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from payments.models import Consumer
from payments.kuickpay_config import format_consumer_number
from django.contrib.auth import get_user_model

User = get_user_model()


def create_test_consumers():
    """Create test consumers for Kuickpay UAT testing"""
    
    print("=" * 70)
    print("KUICKPAY UAT TEST DATA SETUP")
    print("=" * 70)
    print(f"\nPrefix: 09571 (CONFIRMED)")
    print(f"Test Bank URL: https://app2.kuickpay.com/testbank")
    print(f"Test Portal URL: https://uatmerchantportal.kuickpay.com/")
    print("\n" + "=" * 70)
    
    # Get or create a test user for created_by_user
    test_user, _ = User.objects.get_or_create(
        username='testadmin',
        defaults={
            'first_name': 'Test',
            'last_name': 'Admin',
            'email': 'admin@saerpk.com',
            'is_staff': True
        }
    )
    
    # Test consumer data
    test_consumers = [
        {
            'sequence': 1,
            'consumer_name': 'Muhammad Ahmed',
            'reason': 'Umrah Package - Basic',
            'amount': Decimal('150000.00'),
            'email': 'ahmed@example.com',
            'contact': '03001234567',
            'days_until_expiry': 30
        },
        {
            'sequence': 2,
            'consumer_name': 'Fatima Khan',
            'reason': 'Umrah Package - Premium',
            'amount': Decimal('250000.00'),
            'email': 'fatima@example.com',
            'contact': '03009876543',
            'days_until_expiry': 45
        },
        {
            'sequence': 3,
            'consumer_name': 'Ali Hassan',
            'reason': 'Hajj Package - Economy',
            'amount': Decimal('500000.00'),
            'email': 'ali@example.com',
            'contact': '03112345678',
            'days_until_expiry': 60
        },
        {
            'sequence': 4,
            'consumer_name': 'Ayesha Malik',
            'reason': 'Visa Processing Fee',
            'amount': Decimal('25000.00'),
            'email': 'ayesha@example.com',
            'contact': '03219876543',
            'days_until_expiry': 15
        },
        {
            'sequence': 5,
            'consumer_name': 'Usman Farooq',
            'reason': 'Hotel Booking - Medina',
            'amount': Decimal('75000.00'),
            'email': 'usman@example.com',
            'contact': '03331234567',
            'days_until_expiry': 20
        },
    ]
    
    created_consumers = []
    
    print("\nCreating Test Consumers:")
    print("-" * 70)
    
    for consumer_data in test_consumers:
        sequence = consumer_data['sequence']
        consumer_number = format_consumer_number(sequence)
        
        # Check if consumer already exists
        existing = Consumer.objects.filter(consumer_number=consumer_number).first()
        
        if existing:
            print(f"\n⚠️  Consumer {consumer_number} already exists - SKIPPING")
            created_consumers.append(existing)
            continue
        
        expiry_date = date.today() + timedelta(days=consumer_data['days_until_expiry'])
        
        consumer = Consumer.objects.create(
            consumer_number=consumer_number,
            consumer_name=consumer_data['consumer_name'],
            reason=consumer_data['reason'],
            expiry_date=expiry_date,
            email_address=consumer_data['email'],
            contact_number=consumer_data['contact'],
            amount=consumer_data['amount'],
            bill_status='U',  # Unpaid
            created_by='Test Admin',
            created_by_user=test_user
        )
        
        created_consumers.append(consumer)
        
        print(f"\n✓ Created Consumer #{sequence}")
        print(f"   Consumer Number: {consumer_number}")
        print(f"   Name: {consumer.consumer_name}")
        print(f"   Reason: {consumer.reason}")
        print(f"   Amount: PKR {consumer.amount:,.2f}")
        print(f"   Contact: {consumer.contact_number}")
        print(f"   Email: {consumer.email_address}")
        print(f"   Expiry Date: {consumer.expiry_date}")
        print(f"   Status: {'Unpaid' if consumer.bill_status == 'U' else 'Paid'}")
    
    print("\n" + "=" * 70)
    print("TEST DATA SUMMARY")
    print("=" * 70)
    
    print(f"\nTotal Consumers Created: {len(created_consumers)}")
    print("\nConsumer Numbers for Testing:")
    print("-" * 70)
    
    for i, consumer in enumerate(created_consumers, 1):
        print(f"{i}. {consumer.consumer_number} - {consumer.consumer_name} - PKR {consumer.amount:,.2f}")
    
    print("\n" + "=" * 70)
    print("TESTING INSTRUCTIONS")
    print("=" * 70)
    
    print("""
1. LOGIN TO TEST BANK
   URL: https://app2.kuickpay.com/testbank
   User: abc@abc.com
   Pass: 123

2. MAKE A TEST PAYMENT
   - Enter any consumer number from above (e.g., 09571000000000001)
   - Complete the payment flow
   - Note the transaction ID

3. VERIFY IN MERCHANT PORTAL
   URL: https://uatmerchantportal.kuickpay.com/
   User: SAERPK
   Pass: 123
   - Check transaction appears in reports
   - Verify amount and status

4. CHECK IN YOUR ADMIN PANEL
   URL: http://localhost:3000/admin/kuickpay (or your admin URL)
   - Consumer should show as 'Paid' after successful payment
   - Bill status should update automatically

5. API TESTING
   Use these consumer numbers with your Bill Inquiry endpoint:
   GET /api/kuickpay/bill-inquiry/?consumer_number=09571000000000001&bank_mnemonic=KPY
""")
    
    print("\n" + "=" * 70)
    print("READY FOR UAT TESTING!")
    print("=" * 70)
    
    return created_consumers


if __name__ == '__main__':
    try:
        consumers = create_test_consumers()
        print(f"\n✓ Setup complete! {len(consumers)} test consumers ready.\n")
    except Exception as e:
        print(f"\n✗ Error: {e}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)
