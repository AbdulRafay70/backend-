# Serializers for booking-level food and ziarat

# Add these serializers to booking/serializers.py after the imports section


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
