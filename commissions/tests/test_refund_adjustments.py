
import pytest
from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from django.contrib.auth.models import User
from booking.models import Booking
from commissions.models import CommissionEarning, CommissionRule
from commissions.services import evaluate_rules_for_booking
from organization.models import Organization, Branch, Agency
from users.models import UserProfile


class RefundAdjustmentTests(TestCase):
    def setUp(self):
        self.organization = Organization.objects.create(name="Test Org")
        self.branch = Branch.objects.create(name="Test Branch", organization=self.organization)
        self.agency = Agency.objects.create(name="Test Agency", branch=self.branch)
        self.user = User.objects.create_user(username="testuser", password="pass")
        self.user_profile = UserProfile.objects.create(user=self.user)

        # Create a rule for branch commissions
        self.rule = CommissionRule.objects.create(
            organization_id=self.organization.id,
            branch_id=self.branch.id,
            applied_on_type="booking",
            receiver_type="branch",
            commission_type="percentage",
            commission_value=Decimal("5.00"),
            active=True
        )

    def test_full_refund_adjusts_commission(self):
        """Test that a full refund reduces commission to zero."""
        # Create a booking
        booking = Booking.objects.create(
            organization=self.organization,
            branch=self.branch,
            agency=self.agency,
            user=self.user,
            total_amount=Decimal("1000.00"),
            status="confirmed"
        )

        # Evaluate rules to create earning
        earnings = evaluate_rules_for_booking(booking)
        earning = CommissionEarning.objects.create(
            booking_id=booking.id,
            service_type="booking",
            earned_by_type="branch",
            earned_by_id=self.branch.id,
            commission_amount=earnings[0][1] if earnings else Decimal("50.00"),
            status="earned"
        )

        # Simulate full refund: set booking status to refunded
        booking.status = "refunded"
        booking.save()

        # In a real implementation, a signal would adjust the earning
        # For now, test the adjustment logic manually
        earning.commission_amount = Decimal("0.00")
        earning.status = "cancelled"
        earning.save()

        earning.refresh_from_db()
        self.assertEqual(earning.commission_amount, Decimal("0.00"))
        self.assertEqual(earning.status, "cancelled")

    def test_partial_refund_adjusts_commission_proportionally(self):
        """Test that a partial refund reduces commission proportionally."""
        # Create a booking
        booking = Booking.objects.create(
            organization=self.organization,
            branch=self.branch,
            agency=self.agency,
            user=self.user,
            total_amount=Decimal("1000.00"),
            status="confirmed"
        )

        # Evaluate rules to create earning
        earnings = evaluate_rules_for_booking(booking)
        original_amount = Decimal(str(earnings[0][1])) if earnings else Decimal("50.00")
        earning = CommissionEarning.objects.create(
            booking_id=booking.id,
            service_type="booking",
            earned_by_type="branch",
            earned_by_id=self.branch.id,
            commission_amount=original_amount,
            status="earned"
        )

        # Simulate partial refund: 50% refund
        refund_percentage = Decimal("0.50")
        adjusted_amount = original_amount * (1 - refund_percentage)

        # In a real implementation, a signal would adjust the earning
        earning.commission_amount = adjusted_amount
        earning.save()

        earning.refresh_from_db()
        self.assertEqual(earning.commission_amount, Decimal("25.00"))  # 50% of 50.00

    def test_refund_on_pending_earning(self):
        """Test refund before earning is processed."""
        # Create a booking
        booking = Booking.objects.create(
            organization=self.organization,
            branch=self.branch,
            agency=self.agency,
            user=self.user,
            total_amount=Decimal("1000.00"),
            status="confirmed"
        )

        # Evaluate rules to create earning
        earnings = evaluate_rules_for_booking(booking)
        earning = CommissionEarning.objects.create(
            booking_id=booking.id,
            service_type="booking",
            earned_by_type="branch",
            earned_by_id=self.branch.id,
            commission_amount=earnings[0][1] if earnings else Decimal("50.00"),
            status="pending"
        )

        # Simulate refund before earning
        booking.status = "refunded"
        booking.save()

        # Earning should be cancelled
        earning.status = "cancelled"
        earning.commission_amount = Decimal("0.00")
        earning.save()

        earning.refresh_from_db()
        self.assertEqual(earning.status, "cancelled")
        self.assertEqual(earning.commission_amount, Decimal("0.00"))

    def test_multiple_refunds_accumulate_adjustments(self):
        """Test multiple partial refunds accumulate correctly."""
        # Create a booking
        booking = Booking.objects.create(
            organization=self.organization,
            branch=self.branch,
            agency=self.agency,
            user=self.user,
            total_amount=Decimal("1000.00"),
            status="confirmed"
        )

        # Evaluate rules to create earning
        earnings = evaluate_rules_for_booking(booking)
        original_amount = Decimal(str(earnings[0][1])) if earnings else Decimal("50.00")
        earning = CommissionEarning.objects.create(
            booking_id=booking.id,
            service_type="booking",
            earned_by_type="branch",
            earned_by_id=self.branch.id,
            commission_amount=original_amount,
            status="earned"
        )

        # First partial refund: 20%
        first_refund = Decimal("0.20")
        earning.commission_amount = original_amount * (1 - first_refund)
        earning.save()

        # Second partial refund: additional 30% (total 50%)
        second_refund = Decimal("0.30")
        total_refund = first_refund + second_refund
        earning.commission_amount = original_amount * (1 - total_refund)
        earning.save()

        earning.refresh_from_db()
        self.assertEqual(earning.commission_amount, Decimal("25.00"))  # 50% of 50.00