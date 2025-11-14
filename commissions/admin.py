from django.contrib import admin
from .models import CommissionRule, CommissionEarning


@admin.register(CommissionRule)
class CommissionRuleAdmin(admin.ModelAdmin):
    list_display = ('id', 'organization_id', 'branch_id', 'receiver_type', 'commission_type', 'commission_value', 'active')
    list_filter = ('receiver_type', 'commission_type', 'active')
    search_fields = ('organization_id', 'branch_id')


@admin.register(CommissionEarning)
class CommissionEarningAdmin(admin.ModelAdmin):
    list_display = ('id', 'booking_id', 'earned_by_type', 'earned_by_id', 'commission_amount', 'status', 'redeemed')
    list_filter = ('status', 'redeemed', 'earned_by_type')
    search_fields = ('booking_id', 'earned_by_id')
    actions = ['mark_as_redeemed', 'reverse_redemption']

    def mark_as_redeemed(self, request, queryset):
        """Admin action to mark selected earnings as redeemed (idempotent)."""
        count = 0
        for earning in queryset:
            if not earning.redeemed:
                from .services import redeem_commission
                try:
                    redeem_commission(earning, created_by=request.user)
                    count += 1
                except Exception:
                    # continue with others
                    continue
        self.message_user(request, f"Attempted redemption for {count} earnings")

    mark_as_redeemed.short_description = "Redeem selected commission earnings"

    def reverse_redemption(self, request, queryset):
        """Admin action to reverse redemption for selected earnings (for manual fixups).

        This will create a ledger reversal if ledger_tx_ref exists and clear redeemed flag.
        For safety, it only clears the redeemed flag and marks status to 'earned'.
        """
        updated = queryset.filter(redeemed=True).update(redeemed=False, redeemed_date=None, status='earned', ledger_tx_ref=None)
        self.message_user(request, f"Cleared redemption on {updated} earnings")

    reverse_redemption.short_description = "Reverse redemption (clear redeemed flag)"
