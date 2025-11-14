from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DynamicFormViewSet, FormSubmitAPIView, FormByURLAPIView

# Router for viewsets
router = DefaultRouter()
router.register(r'forms', DynamicFormViewSet, basename='forms')

urlpatterns = [
    # Router URLs (CRUD for forms)
    path('api/', include(router.urls)),
    
    # Public form submission endpoint
    path('api/forms/<str:form_unique_id>/submit/', FormSubmitAPIView.as_view(), name='form-submit'),
    
    # Get form by URL
    path('api/forms/by-url/', FormByURLAPIView.as_view(), name='form-by-url'),
]
