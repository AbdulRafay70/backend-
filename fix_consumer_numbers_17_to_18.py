"""
Fix Consumer Numbers: 17 digits → 18 digits

This script identifies and fixes consumer numbers that are 17 digits
and updates them to the correct 18-digit format.

BEFORE: 09571000000000001 (17 digits)  
AFTER:  095710000000000001 (18 digits)
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from payments.models import Consumer

KUICKPAY_PREFIX = "09571"
CORRECT_LENGTH = 18

def fix_consumer_numbers():
    """Fix all 17-digit consumer numbers to 18 digits"""
    
    print("=" * 80)
    print("FIXING CONSUMER NUMBERS: 17 DIGITS → 18 DIGITS")
    print("=" * 80)
    
    # Find all consumers with wrong length
    all_consumers = Consumer.objects.all()
    
    consumers_to_fix = []
    correct_consumers = []
    
    for consumer in all_consumers:
        length = len(consumer.consumer_number)
        
        if length == 17 and consumer.consumer_number.startswith(KUICKPAY_PREFIX):
            consumers_to_fix.append(consumer)
        elif length == CORRECT_LENGTH:
            correct_consumers.append(consumer)
        else:
            print(f"⚠️  Unexpected format: {consumer.consumer_number} ({length} digits)")
    
    print(f"\nFound {len(consumers_to_fix)} consumers to fix")
    print(f"Found {len(correct_consumers)} consumers already correct")
    
    if not consumers_to_fix:
        print("\n✅ All consumer numbers are already correct!")
        return
    
    print("\n" + "-" * 80)
    print("CONSUMERS TO FIX:")
    print("-" * 80)
    
    for consumer in consumers_to_fix:
        print(f"  {consumer.consumer_number} ({len(consumer.consumer_number)} digits) - {consumer.consumer_name}")
    
    # Ask for confirmation
    print("\n" + "=" * 80)
    response = input("Proceed with fixing these consumer numbers? (yes/no): ").strip().lower()
    
    if response != 'yes':
        print("\n❌ Aborted. No changes made.")
        return
    
    print("\n" + "-" * 80)
    print("FIXING CONSUMER NUMBERS...")
    print("-" * 80)
    
    fixed_count = 0
    
    for consumer in consumers_to_fix:
        old_number = consumer.consumer_number
        
        # Extract sequence (digits after prefix)
        # For 17-digit: 09571000000000001
        # Prefix: 09571 (5 digits)
        # Sequence: 000000000001 (12 digits) ← This is wrong
        # We need: 0000000000001 (13 digits)
        
        sequence_part = old_number[5:]  # Get everything after prefix
        sequence_value = int(sequence_part)  # Convert to int to remove leading zeros
        
        # Reformat with correct padding (13 digits)
        new_number = f"{KUICKPAY_PREFIX}{sequence_value:013d}"
        
        print(f"\n  Consumer: {consumer.consumer_name}")
        print(f"    OLD: {old_number} ({len(old_number)} digits)")
        print(f"    NEW: {new_number} ({len(new_number)} digits)")
        
        # Update the consumer
        consumer.consumer_number = new_number
        consumer.save()
        
        fixed_count += 1
        print(f"    ✅ Fixed!")
    
    print("\n" + "=" * 80)
    print(f"✅ SUCCESS: Fixed {fixed_count} consumer numbers")
    print("=" * 80)
    
    # Verify
    print("\nVERIFYING...")
    all_consumers_after = Consumer.objects.all()
    
    for consumer in all_consumers_after:
        length = len(consumer.consumer_number)
        status = "✓" if length == CORRECT_LENGTH else "❌"
        print(f"  {status} {consumer.consumer_number} ({length} digits) - {consumer.consumer_name}")
    
    print("\n✅ All done!\n")


if __name__ == '__main__':
    try:
        fix_consumer_numbers()
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
