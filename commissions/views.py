from django.db.models import Sum, Count
from django.http import HttpResponse
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
import csv
import io

from .models import CommissionRule, CommissionEarning
from .serializers import (
    CommissionRuleSerializer,
    CommissionEarningSerializer,
)
from .services import redeem_commission


class CommissionRuleCreateView(generics.CreateAPIView):
    queryset = CommissionRule.objects.all()
    serializer_class = CommissionRuleSerializer
    permission_classes = [IsAuthenticated]


class CommissionRuleListView(generics.ListAPIView):
    queryset = CommissionRule.objects.all()
    serializer_class = CommissionRuleSerializer
    permission_classes = [IsAuthenticated]


class CommissionEarningAutoCreateView(APIView):
    """
    Accepts a minimal payload describing a booking/payment and creates
    CommissionEarning records for matching rules.

    Expected payload (partial): {
        "booking_id": 123,
        "amount": 100.0,
        "product_id": 45,
        "inventory_item_id": 6,
        "agency_id": 2,
        "branch_id": 1,
    }
    """

    permission_classes = [IsAuthenticated]
    serializer_class = CommissionEarningSerializer  # For OpenAPI schema generation

    def post(self, request, *args, **kwargs):
        data = request.data
        booking_id = data.get("booking_id")
        amount = data.get("amount") or 0

        # Simple matching: rules that either target the product or inventory item,
        # or rules that are global (both null).
        qs = CommissionRule.objects.filter(is_active=True)
        product_id = data.get("product_id")
        inventory_item_id = data.get("inventory_item_id")
        if product_id:
            qs = qs.filter(product_id=product_id)
        elif inventory_item_id:
            qs = qs.filter(inventory_item_id=inventory_item_id)

        created = []
        for rule in qs:
            # compute commission amount
            if rule.commission_type == CommissionRule.COMMISSION_TYPE_PERCENT:
                commission_amount = (rule.commission_amount / 100.0) * float(amount)
            else:
                commission_amount = rule.commission_amount

            earning = CommissionEarning.objects.create(
                booking_id=booking_id,
                service_type="booking",  # Default service type
                earned_by_type=rule.receiver_type,
                earned_by_id=data.get(f"{rule.receiver_type}_id"),
                commission_amount=commission_amount,
                status='pending',
            )
            created.append(CommissionEarningSerializer(earning).data)

        return Response({"created": created}, status=status.HTTP_201_CREATED)


class CommissionEarningUpdateStatusView(generics.UpdateAPIView):
    queryset = CommissionEarning.objects.all()
    serializer_class = CommissionEarningSerializer
    permission_classes = [IsAuthenticated]


class CommissionEarningRedeemView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CommissionEarningSerializer  # For OpenAPI schema generation

    def post(self, request, pk, *args, **kwargs):
        try:
            earning = CommissionEarning.objects.get(pk=pk)
        except CommissionEarning.DoesNotExist:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        if earning.redeemed:
            return Response({"detail": "Already redeemed", "ledger_tx_ref": earning.ledger_tx_ref}, status=status.HTTP_200_OK)

        tx_id = redeem_commission(earning, created_by=request.user if request.user.is_authenticated else None)
        if not tx_id:
            return Response({"detail": "Unable to create ledger entry"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(CommissionEarningSerializer(earning).data)


class CommissionEarningListView(generics.ListAPIView):
    queryset = CommissionEarning.objects.all().select_related("commission_rule")
    serializer_class = CommissionEarningSerializer
    permission_classes = [IsAuthenticated]


class CommissionReportSummaryView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CommissionEarningSerializer  # For OpenAPI schema generation

    def get(self, request, *args, **kwargs):
        """Return aggregates for CommissionEarnings.

        Query params:
          - start_date, end_date: ISO dates to filter created_at
          - group_by: one of 'status','earned_by_type','service_type'
          - format=csv to return a CSV file

        Response contains groups with count and total_amount.
        """
        qs = CommissionEarning.objects.all()

        start = request.query_params.get("start_date")
        end = request.query_params.get("end_date")
        if start:
            qs = qs.filter(created_at__gte=start)
        if end:
            qs = qs.filter(created_at__lte=end)

        group_by = request.query_params.get("group_by", "status")
        allowed = {"status": "status", "earned_by_type": "earned_by_type", "service_type": "service_type"}
        group_field = allowed.get(group_by, "status")

        total_by_group = qs.values(group_field).annotate(count=Count("id"), total_amount=Sum("commission_amount"))
        total = qs.aggregate(total_amount=Sum("commission_amount"), total_count=Count("id"))

        # support CSV export
        if request.query_params.get("format") == "csv":
            buf = io.StringIO()
            writer = csv.writer(buf)
            # header
            writer.writerow([group_field, "count", "total_amount"])
            for row in total_by_group:
                writer.writerow([row.get(group_field), row.get("count"), row.get("total_amount")])

            resp = HttpResponse(buf.getvalue(), content_type="text/csv")
            resp["Content-Disposition"] = "attachment; filename=commission_report.csv"
            return resp

        return Response({"by": list(total_by_group), "total": total})
