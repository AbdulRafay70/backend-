from rest_framework import serializers
from .models import Account, LedgerEntry, LedgerLine


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ["id", "name", "account_type", "organization", "branch", "agency", "balance"]


class LedgerLineSerializer(serializers.ModelSerializer):
    account = AccountSerializer(read_only=True)
    account_id = serializers.IntegerField(source="account.id", read_only=True)
    account_name = serializers.CharField(source="account.name", read_only=True)

    class Meta:
        model = LedgerLine
        fields = [
            "id",
            "account",
            "account_id",
            "account_name",
            "debit",
            "credit",
            "final_balance",
            "created_at",
        ]


class LedgerEntrySerializer(serializers.ModelSerializer):
    """
    Enhanced serializer for the new ledger entry format with all required fields
    """
    lines = LedgerLineSerializer(many=True, read_only=True)
    
    # Related object names for better readability
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True, allow_null=True)
    agency_name = serializers.CharField(source='agency.name', read_only=True, allow_null=True)
    area_agency_name = serializers.SerializerMethodField()
    seller_organization_name = serializers.CharField(source='seller_organization.name', read_only=True, allow_null=True)
    inventory_owner_organization_name = serializers.CharField(source='inventory_owner_organization.name', read_only=True, allow_null=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True, allow_null=True)
    
    def get_area_agency_name(self, obj):
        """Get area agency name if it exists"""
        if obj.area_agency:
            return getattr(obj.area_agency, 'name', f"Area Lead #{obj.area_agency.id}")
        return None

    class Meta:
        model = LedgerEntry
        fields = [
            # IDs
            "id",
            
            # Core identification
            "reference_no",
            "booking_no",
            
            # Transaction classification
            "transaction_type",  # debit or credit
            "service_type",  # ticket / umrah / hotel / etc.
            
            # Descriptions
            "narration",
            "remarks",
            
            # NEW FIELDS
            "transaction_amount",  # Total transaction amount
            "final_balance",  # Auto-calculated balance
            
            # Organization relationships
            "organization",
            "organization_name",
            "seller_organization",
            "seller_organization_name",
            "inventory_owner_organization",
            "inventory_owner_organization_name",
            
            # Hierarchy relationships
            "branch",
            "branch_name",
            "agency",
            "agency_name",
            "area_agency",
            "area_agency_name",
            
            # Payment tracking
            "payment_ids",  # List of payment IDs
            
            # Booking details counts
            "group_ticket_count",
            "umrah_visa_count",
            "hotel_nights_count",
            
            # Timestamps
            "creation_datetime",  # Auto set (timezone aware)
            "created_at",
            "updated_at",
            
            # User tracking
            "created_by",
            "created_by_name",
            
            # Metadata and notes
            "metadata",
            "internal_notes",  # Array of timestamped notes
            
            # Reversal tracking
            "reversed",
            "reversed_of",
            "reversed_at",
            "reversed_by",
            
            # Ledger lines (double-entry details)
            "lines",
        ]
        read_only_fields = [
            'creation_datetime', 
            'created_at', 
            'updated_at',
            'final_balance',  # Auto-calculated
        ]
