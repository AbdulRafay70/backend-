from django.urls import path
from . import views

app_name = 'payments'

urlpatterns = [
    # Kuickpay API endpoints
    path('api/kuickpay/bill-inquiry/', views.KuickpayBillInquiryAPIView.as_view(), name='kuickpay-bill-inquiry'),
    path('api/kuickpay/bill-payment/', views.KuickpayBillPaymentAPIView.as_view(), name='kuickpay-bill-payment'),
]