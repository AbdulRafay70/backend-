from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"users", views.UserViewSet, basename="user")
router.register(r"groups", views.GroupViewSet, basename="group")
router.register(r"permissions", views.PermissionViewSet, basename="permission")

urlpatterns = [
    path("api/", include(router.urls)),
    path(
        "api/user-permissions/<int:user_id>/",
        views.UserPermissionsAPIView.as_view(),
        name="user-permissions",
    ),
    path(
        "api/grouped-permission/",
        views.PermissionGroupedByTypeAPIView.as_view(),
        name="grouped-permission",
    ),
    path(
        "api/upload-permission/",
        views.UploadPermissionsFileAPIView.as_view(),
        name="upload-permission",
    ),
    path(
        "api/logout/",
        views.LogoutView.as_view(),
        name="logout",
    ),
]
