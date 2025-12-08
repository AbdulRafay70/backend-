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
router.register(r'commission-groups', views.CommissionGroupViewSet)
router.register(r'leave-requests', views.LeaveRequestViewSet)
router.register(r'fines', views.FineViewSet)
router.register(r'salary-payments', views.SalaryPaymentViewSet)

urlpatterns = [
    path('api/hr/', include(router.urls)),
]
