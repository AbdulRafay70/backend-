"""
Simple script to create Kuickpay UAT test consumers
Run from Django shell or as standalone
"""
from decimal import Decimal
from datetime import date, timedelta

# Test consumer data to create
TEST_CONSUMERS = [
    {
        'consumer_number': '09571000000000001',
        'consumer_name': 'Muhammad Ahmed',
        'reason': 'Umrah Package - Basic',
        'amount': Decimal('150000.00'),
        'email_address': 'ahmed@example.com',
        'contact_number': '03001234567',
        'expiry_days': 30
    },
    {
        'consumer_number': '09571000000000002',
        'consumer_name': 'Fatima Khan',
        'reason': 'Umrah Package - Premium',
        'amount': Decimal('250000.00'),
        'email_address': 'fatima@example.com',
        'contact_number': '03009876543',
        'expiry_days': 45
    },
    {
        'consumer_number': '09571000000000003',
        'consumer_name': 'Ali Hassan',
        'reason': 'Hajj Package - Economy',
        'amount': Decimal('500000.00'),
        'email_address': 'ali@example.com',
        'contact_number': '03112345678',
        'expiry_days': 60
    },
    {
        'consumer_number': '09571000000000004',
        'consumer_name': 'Ayesha Malik',
        'reason': 'Visa Processing Fee',
        'amount': Decimal('25000.00'),
        'email_address': 'ayesha@example.com',
        'contact_number': '03219876543',
        'expiry_days': 15
    },
    {
        'consumer_number': '09571000000000005',
        'consumer_name': 'Usman Farooq',
        'reason': 'Hotel Booking - Medina',
        'amount': Decimal('75000.00'),
        'email_address': 'usman@example.com',
        'contact_number': '03331234567',
        'expiry_days': 20
    },
]


def create_test_consumers():
    """Create test consumers for UAT testing"""
    from payments.models import Consumer
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    # Get or create test user
    test_user, _ = User.objects.filter(is_superuser=True).first(), None
    if not test_user:
        test_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={'email': 'admin@saerpk.com'}
        )
    
    print("=" * 80)
    print("KUICKPAY UAT TEST DATA SETUP")
    print("=" * 80)
    print(f"\nPrefix: 09571 (CONFIRMED)")
    print(f"Test Bank: https://app2.kuickpay.com/testbank (abc@abc.com / 123)")
    print(f"Test Portal: https://uatmerchantportal.kuickpay.com/ (SAERPK / 123)")
    print("\n" + "=" * 80)
    
    created = []
    skipped = []
    
    for data in TEST_CONSUMERS:
        consumer_number = data['consumer_number']
        
        # Check if exists
        if Consumer.objects.filter(consumer_number=consumer_number).exists():
            skipped.append(consumer_number)
            continue
        
        # Create
        consumer = Consumer.objects.create(
            consumer_number=consumer_number,
            consumer_name=data['consumer_name'],
            reason=data['reason'],
            expiry_date=date.today() + timedelta(days=data['expiry_days']),
            email_address=data['email_address'],
            contact_number=data['contact_number'],
            amount=data['amount'],
            bill_status='U',  # Unpaid
            created_by='UAT Test Setup',
            created_by_user=test_user
        )
        created.append(consumer)
        
        print(f"\n✓ Created: {consumer.consumer_number}")
        print(f"   Name: {consumer.consumer_name}")
        print(f"   Amount: PKR {consumer.amount:,.2f}")
        print(f"   Expiry: {consumer.expiry_date}")
    
    if skipped:
        print(f"\n⚠️  Skipped {len(skipped)} existing consumers")
    
    print("\n" + "=" * 80)
    print(f"TEST CONSUMERS READY: {len(created)} created, {len(skipped)} already existed")
    print("=" * 80)
    
    print("\n📋 Consumer Numbers for Testing:")
    print("-" * 80)
    for i, data in enumerate(TEST_CONSUMERS, 1):
        print(f"{i}. {data['consumer_number']} - {data['consumer_name']} - PKR {data['amount']:,.2f}")
    
    print("\n" + "=" * 80)
    print("🧪 HOW TO TEST")
    print("=" * 80)
    print("""
1. Open Test Bank: https://app2.kuickpay.com/testbank
   Login: abc@abc.com / 123
   
2. Enter Consumer Number: 09571000000000001 (or any from above)

3. Complete payment flow

4. Verify in Merchant Portal: https://uatmerchantportal.kuickpay.com/
   Login: SAERPK / 123
   Check transaction report

5. Check your Admin Panel: http://localhost:3000/admin/kuickpay
   Consumer status should update to 'Paid'
""")
    
    return created


if __name__ == '__main__':
    import os
    import django
    
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
    django.setup()
    
    create_test_consumers()
