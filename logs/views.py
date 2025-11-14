from rest_framework.views import APIView
from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
try:
    from django_filters.rest_framework import DjangoFilterBackend
except Exception:  # django-filters is optional in some environments
    DjangoFilterBackend = None
from django.utils import timezone
from .models import SystemLog
from .serializers import SystemLogSerializer


class SystemLogCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        data = dict(request.data)
        # prefer attaching authenticated user id if available
        if request.user and getattr(request.user, "is_authenticated", False):
            data.setdefault("user_id", getattr(request.user, "id", None))

        # sanitize incoming old_data/new_data if present
        from .utils import _sanitize_payload
        if "old_data" in data:
            try:
                data["old_data"] = _sanitize_payload(data.get("old_data"))
            except Exception:
                data["old_data"] = None
        if "new_data" in data:
            try:
                data["new_data"] = _sanitize_payload(data.get("new_data"))
            except Exception:
                data["new_data"] = None

        serializer = SystemLogSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        log = serializer.save()
        return Response(SystemLogSerializer(log).data, status=status.HTTP_201_CREATED)


class SystemLogListView(generics.ListAPIView):
    serializer_class = SystemLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [b for b in (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter) if b]
    filterset_fields = ["organization_id", "branch_id", "agency_id", "action_type", "status"]
    search_fields = ["description", "action_type", "model_name"]
    ordering_fields = ["timestamp", "organization_id"]
    
    class StandardResultsSetPagination(PageNumberPagination):
        page_size = 20
        page_size_query_param = "page_size"

    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        qs = SystemLog.objects.all()
        user = self.request.user

        # Superusers / staff can see all logs
        if user.is_superuser or user.is_staff:
            return qs

        # Regular users: best-effort filter by user attributes (organization/branch)
        organization_id = getattr(user, "organization_id", None)
        branch_id = getattr(user, "branch_id", None)

        if organization_id is not None:
            qs = qs.filter(organization_id=organization_id)

        if branch_id is not None:
            qs = qs.filter(branch_id=branch_id)

        # Additional filtering by date range if provided
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        if date_from:
            qs = qs.filter(timestamp__gte=date_from)
        if date_to:
            qs = qs.filter(timestamp__lte=date_to)

        return qs
