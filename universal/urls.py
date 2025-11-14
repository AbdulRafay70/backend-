from django.urls import path
from . import views

from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'registration-rules', views.RegistrationRuleViewSet, basename='registrationrule')

app_name = "universal"

urlpatterns = [
    path("register/", views.UniversalRegisterView.as_view(), name="register"),
    path("list/", views.UniversalListView.as_view(), name="list"),
    path("available-parents/", views.AvailableParentsView.as_view(), name="available-parents"),
    path("<str:id>/", views.UniversalDetailView.as_view(), name="detail"),
    path("update/<str:id>/", views.UniversalUpdateView.as_view(), name="update"),
    path("delete/<str:id>/", views.UniversalDeleteView.as_view(), name="delete"),
    path("<str:id>/approve/", views.ApproveRegistrationView.as_view(), name="approve"),
    path("<str:id>/reject/", views.RejectRegistrationView.as_view(), name="reject"),
]

# Add router URLs
urlpatterns += router.urls
