from rest_framework import serializers
from .models import Expense, FinancialRecord, ChartOfAccount


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = "__all__"


class FinancialRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancialRecord
        fields = "__all__"


class COASerializer(serializers.ModelSerializer):
    class Meta:
        model = ChartOfAccount
        fields = "__all__"
