from django.urls import path
from .views import SystemLogCreateView, SystemLogListView

urlpatterns = [
    path("create", SystemLogCreateView.as_view(), name="logs-create"),
    path("list", SystemLogListView.as_view(), name="logs-list"),
]
