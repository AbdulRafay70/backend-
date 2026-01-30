from rest_framework import serializers
from .models import Consumer


class ConsumerSerializer(serializers.ModelSerializer):
    """Serializer for Consumer model"""
    
    class Meta:
        model = Consumer
        fields = [
            'id',
            'consumer_number',
            'consumer_name',
            'reason',
            'expiry_date',
            'email_address',
            'contact_number',
            'amount',
            'bill_status',
            'created_by',
            'created_at',
            'updated_at',
            'organization',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'organization', 'created_by']
    
    def validate_consumer_number(self, value):
        """Ensure consumer number is unique"""
        if self.instance is None:  # Creating new instance
            if Consumer.objects.filter(consumer_number=value).exists():
                raise serializers.ValidationError("Consumer number already exists")
        return value
    
    def validate_amount(self, value):
        """Ensure amount is positive"""
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero")
        return value
