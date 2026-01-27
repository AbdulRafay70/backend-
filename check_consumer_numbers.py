import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from payments.models import Consumer

print("\n" + "=" * 70)
print("CONSUMER NUMBERS IN DATABASE")
print("=" * 70)

consumers = Consumer.objects.all().order_by('consumer_number')

for c in consumers:
    digit_count = len(c.consumer_number)
    status = "✓ OK" if digit_count == 18 else f"❌ WRONG ({digit_count} digits)"
    print(f"{c.consumer_number} - {c.consumer_name} - {status}")

print("=" * 70)
print(f"\nTotal Consumers: {consumers.count()}")

# Check the format
if consumers.exists():
    first = consumers.first()
    print(f"\nExample breakdown:")
    print(f"  Full number: {first.consumer_number}")
    print(f"  Length: {len(first.consumer_number)} digits")
    print(f"  Prefix (first 5): {first.consumer_number[:5]}")
    print(f"  Sequence (after prefix): {first.consumer_number[5:]}")
    print(f"  Sequence length: {len(first.consumer_number[5:])} digits")
