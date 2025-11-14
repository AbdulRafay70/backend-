from rest_framework.routers import DefaultRouter
from django.urls import path, include
from . import views

router = DefaultRouter()
router.register(r"blogs", views.BlogViewSet, basename="blog")
router.register(r"comments", views.BlogCommentViewSet, basename="blogcomment")
router.register(r"forms", views.LeadFormViewSet, basename="leadform")
router.register(r"submissions", views.FormSubmissionViewSet, basename="formsubmission")

urlpatterns = [
    path("", include(router.urls)),
]
