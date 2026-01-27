import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from payments.models import Consumer

print("\n" + "=" * 100)
print("ALL CONSUMER NUMBERS IN DATABASE")
print("=" * 100)

consumers = Consumer.objects.all().order_by('consumer_number')

print(f"\nTotal Consumers: {consumers.count()}\n")

for i, c in enumerate(consumers, 1):
    length = len(c.consumer_number)
    status = "✓ OK (18)" if length == 18 else f"❌ {length} digits"
    
    print(f"{i}. {c.consumer_number} - {c.consumer_name}")
    print(f"   Length: {length} digits - {status}")
    print(f"   Amount: PKR {c.amount:,.2f}")
    print(f"   Status: {c.bill_status}")
    print()

print("=" * 100)
print("\nSUMMARY:")
correct = sum(1 for c in consumers if len(c.consumer_number) == 18)
wrong = consumers.count() - correct
print(f"  ✓ Correct (18 digits): {correct}")
print(f"  ❌ Wrong: {wrong}")
print("=" * 100 + "\n")
