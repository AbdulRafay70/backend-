"""
List all consumer numbers and check their format

This script shows all consumers and identifies which ones need fixing.
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from payments.models import Consumer

KUICKPAY_PREFIX = "09571"
CORRECT_LENGTH = 18

print("\n" + "=" * 90)
print("CONSUMER NUMBERS STATUS CHECK")
print("=" * 90)

consumers = Consumer.objects.all().order_by('consumer_number')

correct_consumers = []
wrong_length_consumers = []
wrong_prefix_consumers = []

for consumer in consumers:
    length = len(consumer.consumer_number)
    
    if length == CORRECT_LENGTH and consumer.consumer_number.startswith(KUICKPAY_PREFIX):
        correct_consumers.append(consumer)
    elif length != CORRECT_LENGTH and consumer.consumer_number.startswith(KUICKPAY_PREFIX):
        wrong_length_consumers.append(consumer)
    else:
        wrong_prefix_consumers.append(consumer)

print(f"\nTOTAL CONSUMERS: {consumers.count()}")
print(f"  ✓ Correct (18 digits): {len(correct_consumers)}")
print(f"  ❌ Wrong length: {len(wrong_length_consumers)}")
print(f"  ⚠️  Wrong prefix: {len(wrong_prefix_consumers)}")

if correct_consumers:
    print("\n" + "-" * 90)
    print("✓ CORRECT CONSUMERS (18 digits):")
    print("-" * 90)
    for c in correct_consumers:
        print(f"  {c.consumer_number} - {c.consumer_name}")

if wrong_length_consumers:
    print("\n" + "-" * 90)
    print("❌ WRONG LENGTH CONSUMERS:")
    print("-" * 90)
    for c in wrong_length_consumers:
        seq = c.consumer_number[5:] if len(c.consumer_number) > 5 else ""
        correct_format = f"{KUICKPAY_PREFIX}{int(seq):013d}" if seq.isdigit() else "ERROR"
        print(f"  {c.consumer_number} ({len(c.consumer_number)} digits) → Should be: {correct_format}")
        print(f"    Name: {c.consumer_name}")

if wrong_prefix_consumers:
    print("\n" + "-" * 90)
    print("⚠️  WRONG PREFIX CONSUMERS:")
    print("-" * 90)
    for c in wrong_prefix_consumers:
        print(f"  {c.consumer_number} ({len(c.consumer_number)} digits) - {c.consumer_name}")

print("\n" + "=" * 90)

# Check for potential duplicates
print("\nCHECKING FOR POTENTIAL DUPLICATES AFTER FIX...")
print("-" * 90)

potential_duplicates = {}
for c in wrong_length_consumers:
    if len(c.consumer_number) > 5:
        seq = c.consumer_number[5:]
        if seq.isdigit():
            correct_format = f"{KUICKPAY_PREFIX}{int(seq):013d}"
            if correct_format in potential_duplicates:
                potential_duplicates[correct_format].append(c)
            else:
                # Check if this correct format exists
                existing = Consumer.objects.filter(consumer_number=correct_format).first()
                if existing:
                    potential_duplicates[correct_format] = [existing, c]

if potential_duplicates:
    print("\n⚠️  DUPLICATES FOUND! These consumers will collide:")
    for correct_num, consumer_list in potential_duplicates.items():
        print(f"\n  Number: {correct_num}")
        for c in consumer_list:
            print(f"    - {c.consumer_number} - {c.consumer_name} (ID: {c.id})")
    print("\n  ACTION REQUIRED: Delete duplicate consumers before running fix script")
else:
    print("✓ No duplicates detected. Safe to run fix script.")

print("\n" + "=" * 90 + "\n")
