# Script to add food and ziarat serializers to serializers.py

serializers_code = '''

# Booking-level Food Details Serializer
class BookingFoodDetailsSerializer(serializers.ModelSerializer):
    """Serializer for booking-level food details with per-passenger-type pricing"""
    
    class Meta:
        model = BookingFoodDetails
        fields = [
            'id',
            'booking',
            'food',
            'adult_price',
            'child_price',
            'infant_price',
            'total_adults',
            'total_children',
            'total_infants',
            'is_price_pkr',
            'riyal_rate',
            'total_price_pkr',
            'total_price_sar',
            'inventory_owner_organization_id',
            'booking_organization_id',
            'contact_person_name',
            'contact_number',
            'food_voucher_number',
            'food_brn',
        ]
        read_only_fields = ['id']


# Booking-level Ziarat Details Serializer
class BookingZiyaratDetailsSerializer(serializers.ModelSerializer):
    """Serializer for booking-level ziarat details with per-passenger-type pricing"""
    
    class Meta:
        model = BookingZiyaratDetails
        fields = [
            'id',
            'booking',
            'ziarat',
            'city',
            'adult_price',
            'child_price',
            'infant_price',
            'total_adults',
            'total_children',
            'total_infants',
            'is_price_pkr',
            'riyal_rate',
            'total_price_pkr',
            'total_price_sar',
            'inventory_owner_organization_id',
            'booking_organization_id',
            'date',
            'contact_person_name',
            'contact_number',
            'ziyarat_voucher_number',
            'ziyarat_brn',
        ]
        read_only_fields = ['id']

'''

# Read the file
with open('d:/Sear.pk/backend-/booking/serializers.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Insert after line 346 (after "# --- Child serializers ---")
insert_position = 347  # After line 346, before line 347
lines.insert(insert_position, serializers_code)

# Write back
with open('d:/Sear.pk/backend-/booking/serializers.py', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("✅ Serializers added successfully!")
