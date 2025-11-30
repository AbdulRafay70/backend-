from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'employees', views.EmployeeViewSet)
router.register(r'salary-history', views.SalaryHistoryViewSet)
router.register(r'commissions', views.CommissionViewSet)
router.register(r'attendance', views.AttendanceViewSet)
router.register(r'movements', views.MovementLogViewSet)
router.register(r'punctuality', views.PunctualityViewSet)

urlpatterns = [
    path('api/hr/', include(router.urls)),
]
