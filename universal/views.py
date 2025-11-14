# PaxMovement API endpoints
from .models import PaxMovement
from .serializers import PaxMovementSerializer
from rest_framework.decorators import action
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count
from drf_spectacular.utils import extend_schema, OpenApiExample, OpenApiParameter

class PaxMovementViewSet(viewsets.ModelViewSet):
    queryset = PaxMovement.objects.all().order_by('-created_at')
    serializer_class = PaxMovementSerializer

    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        obj = self.get_object()
        return Response({"status": obj.status, "verified_exit": obj.verified_exit})

    @action(detail=False, methods=['get'])
    def summary(self, request):
        qs = PaxMovement.objects.all()
        summary = {
            "in_pakistan": qs.filter(status="in_pakistan").count(),
            "entered_ksa": qs.filter(status="entered_ksa").count(),
            "in_ksa": qs.filter(status="in_ksa").count(),
            "exited_ksa": qs.filter(status="exited_ksa").count(),
            "exit_pending": qs.filter(status="exit_pending").count(),
        }
        # City breakdown if available
        city_counts = list(qs.values('arrival_airport').annotate(count=Count('id')).order_by('-count'))
        summary["by_city"] = city_counts
        return Response(summary)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import generics
from .models import UniversalRegistration, RegistrationRule
from .serializers import UniversalRegistrationSerializer, RegistrationRuleSerializer, ParentSelectionSerializer
from .utils import generate_prefixed_id
from .permissions import UniversalPermission
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework.permissions import IsAdminUser
from .models import AuditLog
from .serializers import UniversalRegistrationSerializer


@extend_schema(
    description="Register a new entity (organization, branch, agent, or employee) in the system",
    examples=[
        OpenApiExample(
            "Organization Registration",
            value={
                "type": "organization",
                "name": "Saer Tours & Travels",
                "owner_name": "John Doe",
                "email": "owner@saertours.com",
                "phone": "+92-300-1234567",
                "address": "123 Main Street",
                "city": "Karachi",
                "country": "Pakistan"
            },
            request_only=True
        ),
        OpenApiExample(
            "Branch Registration",
            value={
                "type": "branch",
                "name": "Lahore Branch",
                "parent_id": "ORG00001",
                "phone": "+92-42-1234567",
                "address": "456 Mall Road",
                "city": "Lahore"
            },
            request_only=True
        ),
        OpenApiExample(
            "Agent Registration",
            value={
                "type": "agent",
                "name": "Ahmed Ali",
                "parent_id": "BRN0001",
                "email": "ahmed@example.com",
                "phone": "+92-300-9876543"
            },
            request_only=True
        ),
    ]
)
class UniversalRegisterView(generics.CreateAPIView):
    serializer_class = UniversalRegistrationSerializer
    queryset = UniversalRegistration.objects.all()
    # Allow public registrations from the frontend (admin approves later).
    # Previously required authentication which caused 401 for unauthenticated users.
    permission_classes = (AllowAny,)

    def perform_create(self, serializer):
        # Generate atomic prefixed ID using utils
        t = serializer.validated_data.get("type")
        if not t:
            generated_id = generate_prefixed_id("generic")
        else:
            generated_id = generate_prefixed_id(t)

        serializer.save(id=generated_id)

    def create(self, request, *args, **kwargs):
        # Override to match the response contract: message + data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        # Re-serialize the saved instance so file/image fields return URLs
        instance = serializer.instance
        out_serializer = self.get_serializer(instance)
        headers = self.get_success_headers(out_serializer.data)
        return Response(
            {
                "message": f"{serializer.validated_data.get('type', 'Entity').capitalize()} registered successfully",
                "data": out_serializer.data,
            },
            status=status.HTTP_201_CREATED,
            headers=headers,
        )


@extend_schema(
    description="Get list of entities filtered by type (organization, branch, agent, or employee)",
    parameters=[
        OpenApiParameter(
            name="type",
            type=str,
            location=OpenApiParameter.QUERY,
            description="Filter by entity type: organization, branch, agent, or employee",
            required=False,
        ),
        OpenApiParameter(
            name="parent_id",
            type=str,
            location=OpenApiParameter.QUERY,
            description="Filter by parent ID",
            required=False,
        ),
        OpenApiParameter(
            name="search",
            type=str,
            location=OpenApiParameter.QUERY,
            description="Search by name, email, contact, or ID",
            required=False,
        ),
    ]
)
class UniversalListView(generics.ListAPIView):
    serializer_class = UniversalRegistrationSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        # By default, non-admin callers should only see active registrations.
        # Admin users (staff) should be able to see all registrations (pending/active/inactive)
        # But for admin interface, default to pending for approval workflow
        user = getattr(self.request, 'user', None)
        if user and getattr(user, 'is_authenticated', False) and getattr(user, 'is_staff', False):
            qs = UniversalRegistration.objects.filter(status=UniversalRegistration.STATUS_PENDING)
        else:
            qs = UniversalRegistration.objects.filter(is_active=True)
        t = self.request.query_params.get("type")
        parent_id = self.request.query_params.get("parent_id")
        status = self.request.query_params.get("status")
        search = self.request.query_params.get("search")

        if t:
            qs = qs.filter(type=t)
        if parent_id:
            qs = qs.filter(parent__id=parent_id)
        if status:
            qs = qs.filter(status=status)
        if search:
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(contact_no__icontains=search)
                | Q(email__icontains=search)
                | Q(id__icontains=search)
            )

        # pagination handled by DRF settings if configured
        return qs
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        
        entity_type = request.query_params.get("type", "records")
        return Response(
            {
                "message": f"Successfully retrieved {entity_type}",
                "count": len(serializer.data),
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(
    description="Get details of a specific entity by ID"
)
class UniversalDetailView(generics.RetrieveAPIView):
    serializer_class = UniversalRegistrationSerializer
    lookup_field = "id"
    queryset = UniversalRegistration.objects.all()
    permission_classes = (IsAuthenticated,)
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(
            {
                "message": "Record retrieved successfully",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(
    description="Update an existing entity (organization, branch, agent, or employee)"
)
class UniversalUpdateView(generics.UpdateAPIView):
    serializer_class = UniversalRegistrationSerializer
    lookup_field = "id"
    queryset = UniversalRegistration.objects.all()
    permission_classes = (IsAuthenticated, UniversalPermission)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        # Re-serialize instance so file/image fields are returned as URLs
        out_serializer = self.get_serializer(instance)
        return Response(
            {
                "message": f"{instance.type.capitalize()} updated successfully",
                "data": out_serializer.data,
            },
            status=status.HTTP_200_OK,
        )
    
    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)


@extend_schema(
    description="Delete an entity (soft delete with cascade to children)"
)
class UniversalDeleteView(APIView):
    permission_classes = (IsAuthenticated, UniversalPermission)
    
    def delete(self, request, id):
        obj = get_object_or_404(UniversalRegistration, id=id)
        # Use model cascade deactivation which saves objects (signals will log)
        performed_by = None
        if request.user and request.user.is_authenticated:
            performed_by = getattr(request.user, "username", str(request.user))
        obj.deactivate_with_cascade(performed_by=performed_by)
        return Response(
            {
                "message": f"{obj.type.capitalize()} deleted successfully (soft delete with cascade)",
                "data": {"id": obj.id, "type": obj.type, "name": obj.name}
            },
            status=status.HTTP_200_OK
        )



# RegistrationRule CRUD API
from rest_framework import viewsets
from .models import RegistrationRule
from .serializers import RegistrationRuleSerializer

class RegistrationRuleViewSet(viewsets.ModelViewSet):
    queryset = RegistrationRule.objects.all().order_by('-created_at')
    serializer_class = RegistrationRuleSerializer


# New endpoint to get available parent options based on entity type
class AvailableParentsView(APIView):
    """
    GET /api/universal/available-parents/?type=<entity_type>
    
    Returns list of available parent entities based on the type being registered:
    - For 'branch': returns all active organizations with their IDs
    - For 'agent': returns all active branches with their organization_id and branch_id
    - For 'employee': returns all active organizations, branches, and agents
    """
    # Make available-parents public so clients can populate parent selectors
    # without requiring an authentication token.
    permission_classes = (AllowAny,)
    
    def get(self, request):
        entity_type = request.query_params.get('type')
        # If no type provided, return organizations and branches as sensible defaults
        if not entity_type:
            parents = UniversalRegistration.objects.filter(
                type__in=[UniversalRegistration.TYPE_ORGANIZATION, UniversalRegistration.TYPE_BRANCH],
                is_active=True
            ).order_by('type', 'name')
            serializer = ParentSelectionSerializer(parents, many=True)
            return Response({
                "message": "No type provided - returning organizations and branches as parent options",
                "entity_type": None,
                "available_parents": serializer.data
            })
        
        # Get active entities only
        if entity_type == 'branch':
            # Branches need to select an organization as parent
            parents = UniversalRegistration.objects.filter(
                type=UniversalRegistration.TYPE_ORGANIZATION,
                is_active=True
            ).order_by('name')
            message = "Select an organization as parent for the branch"
            
        elif entity_type == 'agent':
            # Agents need to select a branch as parent
            parents = UniversalRegistration.objects.filter(
                type=UniversalRegistration.TYPE_BRANCH,
                is_active=True
            ).select_related('parent').order_by('name')
            message = "Select a branch as parent for the agent"
            
        elif entity_type == 'employee':
            # Employees can select Organization or Branch as parent
            parents = UniversalRegistration.objects.filter(
                type__in=[
                    UniversalRegistration.TYPE_ORGANIZATION,
                    UniversalRegistration.TYPE_BRANCH
                ],
                is_active=True
            ).order_by('type', 'name')
            message = "Select an organization or branch as parent for the employee"
            
        elif entity_type == 'organization':
            # Organizations don't need a parent
            return Response({
                "message": "Organizations do not require a parent",
                "available_parents": []
            })
            
        else:
            return Response(
                {"error": f"Invalid type '{entity_type}'. Use: branch, agent, employee, or organization"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ParentSelectionSerializer(parents, many=True)
        
        return Response({
            "message": message,
            "entity_type": entity_type,
            "available_parents": serializer.data
        })


# Approve / Reject endpoints for admin workflow
class ApproveRegistrationView(APIView):
    """POST /api/universal/<id>/approve/  -- mark a registration as approved/active

    Body (optional): { "note": "..." }
    """
    permission_classes = (IsAuthenticated, IsAdminUser)

    def post(self, request, id):
        obj = get_object_or_404(UniversalRegistration, id=id)
        # capture previous state
        prev = UniversalRegistrationSerializer(obj).data

        note = request.data.get('note', '')
        performed_by = None
        if request.user and request.user.is_authenticated:
            performed_by = getattr(request.user, 'username', str(request.user))

        # Approve: set active + status
        obj.is_active = True
        obj.status = UniversalRegistration.STATUS_ACTIVE
        obj.save()

        # Audit log
        new = UniversalRegistrationSerializer(obj).data
        AuditLog.objects.create(
            action=AuditLog.ACTION_UPDATE,
            model_name='UniversalRegistration',
            object_id=str(obj.id),
            performed_by=performed_by,
            previous_data=prev,
            new_data=new
        )

        return Response({
            'message': 'Registration approved',
            'data': new,
        }, status=status.HTTP_200_OK)


class RejectRegistrationView(APIView):
    """POST /api/universal/<id>/reject/  -- mark a registration as rejected/inactive

    Body (optional): { "reason": "..." }
    """
    permission_classes = (IsAuthenticated, IsAdminUser)

    def post(self, request, id):
        obj = get_object_or_404(UniversalRegistration, id=id)
        prev = UniversalRegistrationSerializer(obj).data

        reason = request.data.get('reason', '')
        performed_by = None
        if request.user and request.user.is_authenticated:
            performed_by = getattr(request.user, 'username', str(request.user))

        # Reject: mark inactive
        obj.is_active = False
        obj.status = UniversalRegistration.STATUS_INACTIVE
        obj.save()

        # Audit log include reason in new_data
        new = UniversalRegistrationSerializer(obj).data
        AuditLog.objects.create(
            action=AuditLog.ACTION_UPDATE,
            model_name='UniversalRegistration',
            object_id=str(obj.id),
            performed_by=performed_by,
            previous_data=prev,
            new_data={**new, 'rejection_reason': reason}
        )

        return Response({
            'message': 'Registration rejected',
            'data': new,
        }, status=status.HTTP_200_OK)
