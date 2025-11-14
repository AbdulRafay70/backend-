from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db import transaction
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from .models import DynamicForm, FormSubmission
from .serializers import (
    DynamicFormSerializer,
    DynamicFormSubmissionSerializer,
    FormSubmissionRecordSerializer
)


def apply_user_scope(queryset, user):
    """Filter queryset based on user permissions"""
    if user.is_superuser or user.is_staff:
        return queryset
    
    # Filter by user's organization
    try:
        if hasattr(user, 'userprofile') and user.userprofile.organization:
            return queryset.filter(organization=user.userprofile.organization)
    except:
        pass
    
    return queryset.none()


@extend_schema_view(
    list=extend_schema(
        summary="List all dynamic forms",
        description="""
        Retrieve a list of all dynamic forms with filtering options.
        
        **Filters:**
        - organization_id: Filter by organization
        - branch_id: Filter by branch
        - status: Filter by status (active/inactive/draft)
        - linked_blog_id: Filter forms linked to specific blog
        - is_standalone: Show only standalone forms (true/false)
        
        **User Scoping:** Non-staff users only see their organization's forms.
        """,
        parameters=[
            OpenApiParameter(name='organization_id', type=int, description='Filter by organization ID'),
            OpenApiParameter(name='branch_id', type=int, description='Filter by branch ID'),
            OpenApiParameter(name='status', type=str, description='Filter by status'),
            OpenApiParameter(name='linked_blog_id', type=int, description='Filter by linked blog ID'),
            OpenApiParameter(name='is_standalone', type=bool, description='Show only standalone forms'),
        ],
        tags=['Dynamic Forms']
    ),
    create=extend_schema(
        summary="Create a new dynamic form",
        description="""
        Create a new dynamic form for lead generation.
        
        **Auto-generated fields:**
        - form_unique_id: Generated from form_title if not provided
        - form_page_url: Generated from form_title if not provided
        
        **Form can be:**
        - Linked to a blog post (will appear below the blog)
        - Standalone page (accessible via form_page_url)
        - Both (appears in blog AND has own page)
        """,
        tags=['Dynamic Forms'],
        examples=[
            OpenApiExample(
                'Umrah Leads Form',
                value={
                    "form_title": "Umrah Leads Form",
                    "linked_blog_id": 12,
                    "is_linked_with_blog": True,
                    "display_position": "end_of_blog",
                    "organization": 1,
                    "branch": 2,
                    "fields": [
                        {
                            "label": "Full Name",
                            "type": "text",
                            "placeholder": "Enter full name",
                            "required": True,
                            "width": "full"
                        },
                        {
                            "label": "Contact Number",
                            "type": "tel",
                            "placeholder": "03xxxxxxxxx",
                            "required": True,
                            "width": "half"
                        },
                        {
                            "label": "Preferred Package Type",
                            "type": "dropdown",
                            "options": ["Economy", "Premium", "5-Star Deluxe"],
                            "required": True,
                            "width": "half"
                        },
                        {
                            "label": "Message",
                            "type": "textarea",
                            "placeholder": "Enter your message",
                            "required": False
                        }
                    ],
                    "buttons": [
                        {"label": "Submit", "action": "submit"},
                        {"label": "Call Now", "action": "call", "url": "tel:+923001234567"}
                    ],
                    "notes": [
                        {
                            "text": "We will contact you within 2 hours.",
                            "position": "below_submit_button"
                        }
                    ],
                    "status": "active"
                },
                request_only=True,
            ),
        ]
    ),
    retrieve=extend_schema(
        summary="Get form details",
        description="Retrieve details of a specific form by ID.",
        tags=['Dynamic Forms']
    ),
    update=extend_schema(
        summary="Update form",
        description="Update an existing form (full update).",
        tags=['Dynamic Forms']
    ),
    partial_update=extend_schema(
        summary="Partially update form",
        description="Partially update an existing form.",
        tags=['Dynamic Forms']
    ),
    destroy=extend_schema(
        summary="Delete form",
        description="Delete a form. Note: Associated submissions and leads will not be deleted.",
        tags=['Dynamic Forms']
    ),
)
class DynamicFormViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing dynamic forms.
    
    Endpoints:
    - GET /api/forms/ - List all forms
    - POST /api/forms/ - Create new form
    - GET /api/forms/{id}/ - Get form details
    - PUT /api/forms/{id}/ - Update form
    - PATCH /api/forms/{id}/ - Partial update
    - DELETE /api/forms/{id}/ - Delete form
    - GET /api/forms/{id}/submissions/ - Get form submissions
    - GET /api/forms/by-blog/{blog_id}/ - Get forms linked to specific blog
    """
    
    queryset = DynamicForm.objects.all()
    serializer_class = DynamicFormSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'
    
    def get_queryset(self):
        """Filter queryset based on user permissions and query parameters"""
        qs = super().get_queryset()
        qs = apply_user_scope(qs, self.request.user)
        
        # Apply filters from query parameters
        organization_id = self.request.query_params.get('organization_id')
        branch_id = self.request.query_params.get('branch_id')
        status_filter = self.request.query_params.get('status')
        linked_blog_id = self.request.query_params.get('linked_blog_id')
        is_standalone = self.request.query_params.get('is_standalone')
        
        if organization_id:
            qs = qs.filter(organization_id=organization_id)
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if linked_blog_id:
            qs = qs.filter(linked_blog_id=linked_blog_id)
        if is_standalone is not None:
            is_standalone_bool = is_standalone.lower() in ['true', '1', 'yes']
            if is_standalone_bool:
                qs = qs.filter(display_position='standalone')
            else:
                qs = qs.exclude(display_position='standalone')
        
        return qs.order_by('-created_at')
    
    def perform_create(self, serializer):
        """Set created_by on form creation"""
        serializer.save(created_by=self.request.user)
    
    @extend_schema(
        summary="Get form submissions",
        description="Retrieve all submissions for a specific form.",
        responses={200: FormSubmissionRecordSerializer(many=True)},
        tags=['Dynamic Forms']
    )
    @action(detail=True, methods=['get'], url_path='submissions')
    def submissions(self, request, pk=None):
        """Get all submissions for this form"""
        form = self.get_object()
        submissions = FormSubmission.objects.filter(form=form).order_by('-created_at')
        
        # Pagination
        limit = int(request.query_params.get('limit', 50))
        offset = int(request.query_params.get('offset', 0))
        
        total = submissions.count()
        submissions_page = submissions[offset:offset+limit]
        
        serializer = FormSubmissionRecordSerializer(submissions_page, many=True)
        
        return Response({
            'total_submissions': total,
            'limit': limit,
            'offset': offset,
            'data': serializer.data
        })
    
    @extend_schema(
        summary="Get forms by blog",
        description="Retrieve all forms linked to a specific blog.",
        parameters=[OpenApiParameter(name='blog_id', type=int, location=OpenApiParameter.PATH)],
        responses={200: DynamicFormSerializer(many=True)},
        tags=['Dynamic Forms']
    )
    @action(detail=False, methods=['get'], url_path='by-blog/(?P<blog_id>[0-9]+)')
    def by_blog(self, request, blog_id=None):
        """Get all forms linked to a specific blog"""
        qs = self.get_queryset().filter(linked_blog_id=blog_id, is_linked_with_blog=True)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


@extend_schema(
    summary="Submit form data",
    description="""
    Submit form data and auto-create a Lead record.
    
    **Process:**
    1. Validates submission against form field structure
    2. Creates Lead record in existing Leads table
    3. Maps form fields to Lead fields automatically
    4. Records submission metadata (IP, user agent, etc.)
    5. Increments form submission counter
    
    **No authentication required** - Public endpoint for lead capture.
    """,
    request=DynamicFormSubmissionSerializer,
    responses={
        201: OpenApiTypes.OBJECT,
        400: OpenApiTypes.OBJECT,
        404: OpenApiTypes.OBJECT,
    },
    examples=[
        OpenApiExample(
            'Umrah Form Submission',
            value={
                "submission_data": {
                    "full_name": "Ali Khan",
                    "contact_number": "03001234567",
                    "email": "ali@example.com",
                    "preferred_package_type": "Premium",
                    "message": "Interested in Umrah Package for December"
                }
            },
            request_only=True,
        ),
    ],
    tags=['Dynamic Forms']
)
class FormSubmitAPIView(APIView):
    """
    Public endpoint for form submissions.
    Submissions are automatically forwarded to the Leads API.
    
    POST /api/forms/<form_unique_id>/submit/
    """
    
    permission_classes = [AllowAny]  # Public endpoint
    
    def post(self, request, form_unique_id):
        """Handle form submission and create Lead record"""
        
        # Get the form
        form = get_object_or_404(DynamicForm, form_unique_id=form_unique_id)
        
        # Check if form is active
        if form.status != 'active':
            return Response({
                'error': 'This form is not currently accepting submissions',
                'form_status': form.status
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate submission
        serializer = DynamicFormSubmissionSerializer(
            data=request.data,
            context={'form': form, 'request': request}
        )
        
        if not serializer.is_valid():
            return Response({
                'error': 'Invalid submission data',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Extract submission data
        submission_data = serializer.validated_data.get('submission_data', {})
        ip_address = serializer.validated_data.get('ip_address') or self.get_client_ip(request)
        user_agent = serializer.validated_data.get('user_agent') or request.META.get('HTTP_USER_AGENT', '')
        referrer = serializer.validated_data.get('referrer') or request.META.get('HTTP_REFERER', '')
        
        # Create Lead and submission record in a transaction
        with transaction.atomic():
            # Create Lead from submission
            lead = serializer.create_lead_from_submission(
                form=form,
                submission_data=submission_data,
                request=request
            )
            
            # Create submission record
            submission = FormSubmission.objects.create(
                form=form,
                lead=lead,
                submission_data=submission_data,
                ip_address=ip_address,
                user_agent=user_agent[:1000] if user_agent else None,  # Truncate if too long
                referrer=referrer[:512] if referrer else None,
            )
            
            # Increment form submission counter
            form.increment_submission_count()
        
        # Return success response
        return Response({
            'success': True,
            'message': 'Thank you! Your submission has been received.',
            'submission_id': submission.id,
            'lead_id': lead.id if lead else None,
            'form_title': form.form_title,
        }, status=status.HTTP_201_CREATED)
    
    def get_client_ip(self, request):
        """Extract client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


@extend_schema(
    summary="Get forms by URL",
    description="Retrieve form details by its page URL. Useful for rendering standalone form pages.",
    parameters=[OpenApiParameter(name='url', type=str, location=OpenApiParameter.QUERY, description='Form page URL')],
    responses={200: DynamicFormSerializer},
    tags=['Dynamic Forms']
)
class FormByURLAPIView(APIView):
    """
    Get form details by its form_page_url.
    Useful for frontend routing to render form pages.
    
    GET /api/forms/by-url/?url=/forms/umrah-leads-form
    """
    
    permission_classes = [AllowAny]  # Public endpoint
    
    def get(self, request):
        """Get form by URL"""
        url = request.query_params.get('url')
        
        if not url:
            return Response({
                'error': 'URL parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            form = DynamicForm.objects.get(form_page_url=url, status='active')
            serializer = DynamicFormSerializer(form)
            return Response(serializer.data)
        except DynamicForm.DoesNotExist:
            return Response({
                'error': 'No active form found for this URL'
            }, status=status.HTTP_404_NOT_FOUND)
