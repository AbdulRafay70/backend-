from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConsumerViewSet
from .mock_kuickpay_views import MockKuickpayBillInquiryView, MockKuickpayBillPaymentView

router = DefaultRouter()
router.register(r'consumers', ConsumerViewSet, basename='consumer')

urlpatterns = [
    path('', include(router.urls)),
    # KuickPay Integration Endpoints (for testing)
    path('kuickpay/bill-inquiry/', MockKuickpayBillInquiryView.as_view(), name='kuickpay-bill-inquiry'),
    path('kuickpay/bill-payment/', MockKuickpayBillPaymentView.as_view(), name='kuickpay-bill-payment'),
]