from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from django.contrib.auth.models import User, Group, Permission
from django.db.models import Q
from rest_framework.parsers import MultiPartParser, FormParser
from .serializers import (
    GroupSerializer,
    PermissionSerializer,
    UserSerializer,
)
from .models import PermissionExtension


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer

    # Allow creating a user while providing organization via query param
    # e.g. POST /api/users/?organization=8
    def create(self, request, *args, **kwargs):
        # Make a mutable copy of incoming data
        data = request.data.copy() if hasattr(request, "data") else {}

        # Accept either 'organization' or 'organization_id' as query param
        org_q = request.query_params.get("organization") or request.query_params.get("organization_id")
        try:
            # If org provided and organizations not in payload, inject it as a list
            if org_q and not data.get("organizations"):
                # coerce to int where possible
                try:
                    org_id = int(org_q)
                except Exception:
                    org_id = org_q
                data["organizations"] = [org_id]
        except Exception:
            pass

        serializer = self.get_serializer(data=data)
        if not serializer.is_valid():
            # Return structured errors to help frontend debug
            return Response({"success": False, "errors": serializer.errors}, status=400)

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=201, headers=headers)

    def get_queryset(self):
        organization_id = self.request.query_params.get("organization_id", None)
        organization = self.request.query_params.get("organization", None)
        branch_id = self.request.query_params.get("branch_id", None)
        
        # Debug logging
        print(f"DEBUG UserViewSet.get_queryset - organization_id: {organization_id}, organization: {organization}, branch_id: {branch_id}")
        print(f"DEBUG UserViewSet.get_queryset - All query params: {dict(self.request.query_params)}")
        
        query_filters = Q()
        if organization_id:
            query_filters &= Q(organizations=organization_id)
        if branch_id:
            query_filters &= Q(branches=branch_id)
        queryset = User.objects.filter(query_filters)
        return queryset


class GroupViewSet(viewsets.ModelViewSet):
    serializer_class = GroupSerializer

    def get_queryset(self):
        organization_id = self.request.query_params.get("organization_id", None)
        organization = self.request.query_params.get("organization", None)
        type = self.request.query_params.get("type", None)

        # Debug logging
        print(f"DEBUG GroupViewSet.get_queryset - organization_id: {organization_id}, organization: {organization}, type: {type}")
        print(f"DEBUG GroupViewSet.get_queryset - All query params: {dict(self.request.query_params)}")

        query_filters = Q()
        if organization_id:
            query_filters &= Q(extended__organization_id=organization_id)
        if type:
            query_filters &= Q(extended__type=type)
        queryset = Group.objects.filter(query_filters)
        return queryset


class PermissionViewSet(viewsets.ModelViewSet):
    serializer_class = PermissionSerializer

    def get_queryset(self):
        queryset = Permission.objects.all().select_related("extended")
        content_type_id = self.request.query_params.get("content_type")
        page_type = self.request.query_params.get("page_type")
        if page_type:
            queryset = queryset.filter(extended__type=page_type)
        if content_type_id:
            queryset = queryset.filter(content_type_id=content_type_id)
        return queryset


class PermissionGroupedByTypeAPIView(APIView):
    def get(self, request, *args, **kwargs):
        grouped_permissions = PermissionExtension.objects.values("type").distinct()
        result = {}
        for group in grouped_permissions:
            type_name = group["type"]
            permissions = Permission.objects.filter(extended__type=type_name).values()
            permission_list = list(permissions)
            result[type_name] = permission_list
        return Response(result, status=status.HTTP_200_OK)


class UserPermissionsAPIView(APIView):
    def get(self, request, user_id):
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )

        user_permissions = user.user_permissions.all()
        group_permissions = Permission.objects.filter(group__user=user)

        permissions = list(user_permissions) + list(group_permissions)
        permissions = list(set(permissions))

        permission_codename = [permission.codename for permission in permissions]

        return Response({"permissions": permission_codename}, status=status.HTTP_200_OK)


class UploadPermissionsFileAPIView(APIView):
    parser_classes = (MultiPartParser, FormParser)  # Enable file upload handling

    def post(self, request):
        """
        Accepts a .txt file, reads permission codenames, generates names, and creates permissions.
        """
        uploaded_file = request.FILES.get("file")  # Expecting a file field named 'file'

        if not uploaded_file:
            return Response(
                {"error": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST
            )

        if not uploaded_file.name.endswith(".txt"):
            return Response(
                {"error": "Invalid file type. Please upload a .txt file."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        codenames = [
            line.decode("utf-8").strip() for line in uploaded_file if line.strip()
        ]

        if not codenames:
            return Response(
                {"error": "File is empty or invalid."},
                status=status.HTTP_400_BAD_REQUEST,
            )

            # Dummy content type for now
        created_permissions = []
        for codename in codenames:
            name = codename.replace("_", " ").title()  # Convert to proper name format
            last_word = name.split()[-1]
            # Check if permission already exists
            permission, created = Permission.objects.get_or_create(
                codename=codename, content_type_id=4, defaults={"name": name}
            )
            if created or permission:
                # Create associated PermissionExtension
                PermissionExtension.objects.create(
                    permission=permission, type=last_word
                )

                created_permissions.append(
                    {"codename": codename, "name": name, "type": last_word}
                )

            if created:
                created_permissions.append({"codename": codename, "name": name})

        return Response(
            {
                "message": "Permissions created successfully.",
                "permissions": created_permissions,
            },
            status=status.HTTP_201_CREATED,
        )


class LogoutView(APIView):
    """
    POST /api/logout/
    
    Blacklist the refresh token to logout the user.
    The access token will be invalidated when it expires.
    """
    from rest_framework.permissions import IsAuthenticated
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            from rest_framework_simplejwt.tokens import RefreshToken
            
            refresh_token = request.data.get("refresh_token")
            if not refresh_token:
                return Response(
                    {"detail": "refresh_token is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Blacklist the refresh token
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            return Response(
                {"detail": "Successfully logged out"},
                status=status.HTTP_205_RESET_CONTENT
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
