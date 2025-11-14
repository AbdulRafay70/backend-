from rest_framework import serializers
from .models import CommissionRule, CommissionEarning


class CommissionRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommissionRule
        fields = '__all__'


class CommissionEarningSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommissionEarning
        fields = '__all__'

    def validate_commission_amount(self, value):
        if value is None:
            return 0
        if value < 0:
            raise serializers.ValidationError("commission_amount must be >= 0")
        return value
