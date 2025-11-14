from rest_framework import viewsets, permissions, status, filters, throttling
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.utils import timezone
from . import models, serializers
from .permissions import IsStaffOrReadOnly, IsAuthorOrStaff
from django.db import DatabaseError, OperationalError
import logging

logger = logging.getLogger(__name__)


class IsStaffOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff


class BlogViewSet(viewsets.ModelViewSet):
    queryset = models.Blog.objects.all()
    permission_classes = [IsStaffOrReadOnly]
    # allow multipart form uploads (files) alongside JSON
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "summary"]
    ordering_fields = ["published_at", "created_at", "reading_time_minutes"]

    class StandardResultsSetPagination(PageNumberPagination):
        page_size = 10
        page_size_query_param = "page_size"
        max_page_size = 100

    pagination_class = StandardResultsSetPagination

    def get_serializer_class(self):
        if self.action == "retrieve":
            return serializers.BlogDetailSerializer
        return serializers.BlogSerializer

    def get_queryset(self):
        qs = models.Blog.objects.all().prefetch_related("sections")
        # Default: only published blogs for non-staff callers
        if not (self.request.user and self.request.user.is_staff):
            qs = qs.filter(status="published", published_at__lte=timezone.now())

        # Support fetching by slug via query param (used by public frontend)
        slug_q = self.request.query_params.get("slug")
        if slug_q:
            # exact match on slug
            qs = qs.filter(slug=slug_q)

        # Filters via query params
        status_q = self.request.query_params.get("status")
        if status_q:
            qs = qs.filter(status=status_q)

        org = self.request.query_params.get("organization")
        if org:
            try:
                org_id = int(org)
                qs = qs.filter(organization_id=org_id)
            except Exception:
                pass

        q = self.request.query_params.get("q")
        if q:
            # let SearchFilter handle it normally, but ensure queryset is not empty
            # Here we perform a simple icontains fallback
            qs = qs.filter(models.Q(title__icontains=q) | models.Q(summary__icontains=q))

        return qs.order_by("-published_at")

    @action(detail=True, methods=["post"], permission_classes=[permissions.AllowAny])
    def comments(self, request, pk=None):
        """
        Create a comment. Allows anonymous comments by providing author_name (and optional author_email).
        If the caller is authenticated, the comment will be linked to the user.
        """
        blog = self.get_object()
        data = request.data.copy()
        data["blog"] = blog.pk
        serializer = serializers.BlogCommentSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        try:
            # If the client provided an explicit author_name or author_email, treat this as an
            # anonymous comment (even if the caller is authenticated). If no name/email was
            # provided and the requester is authenticated, link the comment to that user.
            provided_name = bool(request.data.get("author_name") or request.data.get("author_email"))
            if request.user and request.user.is_authenticated and not provided_name:
                # link to authenticated user
                serializer.save(author=request.user)
            else:
                # allow anonymous comment (author left null); author_name from payload will be saved
                serializer.save()
        except (OperationalError, DatabaseError) as db_err:
            # Likely a missing DB column (migrations not applied) or similar schema error
            logger.exception("Database error while saving comment: %s", db_err)
            return Response({"detail": "Database error saving comment. Have you run migrations?"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], permission_classes=[permissions.AllowAny])
    def like(self, request, pk=None):
        """
        Toggle like for authenticated users. For anonymous callers, increment an anonymous like counter stored in blog.meta.
        This avoids changing the BlogLike model schema while letting any visitor like a post.
        """
        blog = self.get_object()
        if request.user and request.user.is_authenticated:
            like, created = models.BlogLike.objects.get_or_create(blog=blog, user=request.user)
            if not created:
                # toggle off
                like.delete()
                return Response({"liked": False}, status=status.HTTP_200_OK)
            return Response({"liked": True}, status=status.HTTP_201_CREATED)

        # anonymous like: increment a lightweight counter in meta
        try:
            meta = blog.meta or {}
            anon_likes = int(meta.get("anonymous_likes", 0) or 0)
            anon_likes += 1
            meta["anonymous_likes"] = anon_likes
            blog.meta = meta
            blog.save(update_fields=["meta"])
            return Response({"liked": True, "anonymous_likes": anon_likes}, status=status.HTTP_201_CREATED)
        except (OperationalError, DatabaseError) as db_err:
            logger.exception("Database error while saving anonymous like: %s", db_err)
            return Response({"detail": "Database error updating likes. Have you run migrations?"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BlogCommentViewSet(viewsets.ModelViewSet):
    queryset = models.BlogComment.objects.select_related("blog", "author").all()
    serializer_class = serializers.BlogCommentSerializer
    # default to allow anonymous access for safe methods and create; restrict edits/deletes to author/staff
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        # For update/partial_update/destroy require object-level IsAuthorOrStaff
        if self.action in ("update", "partial_update", "destroy"):
            return [IsAuthorOrStaff()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(author=self.request.user)
        else:
            serializer.save()


class LeadFormViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.LeadForm.objects.filter(active=True)
    serializer_class = serializers.LeadFormSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=True, methods=["post"], url_path="submit", permission_classes=[permissions.AllowAny], throttle_classes=[throttling.AnonRateThrottle, throttling.UserRateThrottle])
    def submit(self, request, pk=None):
        form = self.get_object()
        data = {"form": form.pk, "payload": request.data}
        # add optional meta
        data["submitter_ip"] = request.META.get("REMOTE_ADDR") or request.META.get("HTTP_X_FORWARDED_FOR")
        data["user_agent"] = request.META.get("HTTP_USER_AGENT")
        serializer = serializers.FormSubmissionSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        submission = serializer.save()
        # Ensure a forwarding task exists (also done by signals) so tests and environments without on_commit flush still enqueue
        try:
            from .models import FormSubmissionTask
            from django.utils import timezone

            if not FormSubmissionTask.objects.filter(submission=submission, status__in=("pending", "processing")).exists():
                FormSubmissionTask.objects.create(submission=submission, next_try_at=timezone.now())
        except Exception:
            # best-effort: signals should normally create the task via transaction.on_commit
            pass
        # signal should enqueue a FormSubmissionTask — log receipt for analytics
        try:
            import logging

            logger = logging.getLogger(__name__)
            logger.info("Received form submission %s for form %s", submission.pk, form.pk)
        except Exception:
            pass
        return Response({"id": submission.pk, "status": submission.status}, status=status.HTTP_201_CREATED)


class FormSubmissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.FormSubmission.objects.all()
    serializer_class = serializers.FormSubmissionSerializer
    permission_classes = [permissions.IsAdminUser]
