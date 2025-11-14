from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.utils import timezone
import csv
from io import TextIOWrapper

from .models import PromotionContact, normalize_phone
from .serializers import PromotionContactSerializer, PromotionContactImportResultSerializer


class PromotionContactViewSet(viewsets.ModelViewSet):
    queryset = PromotionContact.objects.all().order_by("-last_seen")
    serializer_class = PromotionContactSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        # filters per spec
        contact_type = params.get("type") or params.get("contact_type")
        status = params.get("status")
        city = params.get("city")
        organization = params.get("organization_id") or params.get("org_id")
        branch = params.get("branch_id") or params.get("br_id")
        source = params.get("source")
        phone = params.get("phone") or params.get("contact_number")
        date_from = params.get("date_from")
        date_to = params.get("date_to")

        if contact_type:
            qs = qs.filter(contact_type=contact_type)
        if status:
            qs = qs.filter(status=status)
        if city:
            qs = qs.filter(city__icontains=city)
        if organization:
            qs = qs.filter(organization_id=organization)
        if branch:
            qs = qs.filter(branch_id=branch)
        if source:
            qs = qs.filter(source__iexact=source)
        if phone:
            qs = qs.filter(phone=normalize_phone(phone))
        if date_from:
            qs = qs.filter(created_at__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__lte=date_to)
        return qs

    @action(detail=False, methods=["post"], url_path="import", permission_classes=[permissions.IsAuthenticated, permissions.IsAdminUser])
    def import_csv(self, request):
        """
        Upload a CSV file with columns: contact_number,full_name,email,type,source,organization_id,branch_id,city
        Upserts by contact_number
        """
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "file is required"}, status=status.HTTP_400_BAD_REQUEST)

        wrapper = TextIOWrapper(file.file, encoding=request.encoding or "utf-8")
        reader = csv.DictReader(wrapper)
        total = 0
        created = 0
        updated = 0
        errors = []

        with transaction.atomic():
            for row in reader:
                total += 1
                phone = row.get("contact_number") or row.get("phone") or row.get("contact_no")
                if not phone:
                    errors.append(f"Row {total}: missing phone")
                    continue
                phone = normalize_phone(phone)
                defaults = {
                    "name": row.get("full_name") or row.get("name") or "",
                    "email": row.get("email") or None,
                    "contact_type": row.get("type") or row.get("contact_type") or "other",
                    "source": row.get("source") or "import",
                    "source_reference": row.get("source_reference") or None,
                    "city": row.get("city") or None,
                    "organization_id": int(row["organization_id"]) if row.get("organization_id") else None,
                    "branch_id": int(row["branch_id"]) if row.get("branch_id") else None,
                }

                try:
                    obj, was_created = PromotionContact.objects.update_or_create(phone=phone, defaults=defaults)
                    if was_created:
                        created += 1
                    else:
                        updated += 1
                except Exception as e:
                    errors.append(f"Row {total}: {str(e)}")

        result = {"total": total, "created": created, "updated": updated, "errors": errors}
        serializer = PromotionContactImportResultSerializer(result)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="export", permission_classes=[permissions.IsAuthenticated, permissions.IsAdminUser])
    def export_csv(self, request):
        qs = self.filter_queryset(self.get_queryset())
        # stream CSV
        import csv as _csv
        from django.http import StreamingHttpResponse

        def row_generator():
            header = ["id", "full_name", "contact_number", "email", "contact_type", "source", "organization_id", "branch_id", "city", "status", "created_at"]
            yield _csv.writer([None]).writerow(header) if False else None
            # yield header as comma-joined
            yield ",".join(header) + "\n"
            for obj in qs.iterator():
                row = [
                    str(obj.id),
                    (obj.name or ""),
                    obj.phone or "",
                    obj.email or "",
                    obj.contact_type or "",
                    obj.source or "",
                    str(obj.organization_id) if obj.organization_id else "",
                    str(obj.branch_id) if obj.branch_id else "",
                    obj.city or "",
                    obj.status or "",
                    obj.created_at.isoformat(),
                ]
                yield ",".join([s.replace(",", "\,") if isinstance(s, str) else str(s) for s in row]) + "\n"

        resp = StreamingHttpResponse(row_generator(), content_type="text/csv")
        resp["Content-Disposition"] = "attachment; filename=promotion_contacts.csv"
        return resp


class PromotionContactBulkSubscribeAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def post(self, request):
        phones = request.data.get("phones", [])
        subscribe = bool(request.data.get("subscribe", True))
        normalized = [normalize_phone(p) for p in phones if p]
        updated = PromotionContact.objects.filter(phone__in=normalized).update(is_subscribed=subscribe)
        return Response({"updated": updated})
