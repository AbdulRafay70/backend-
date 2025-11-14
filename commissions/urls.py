from django.urls import path
from . import views

urlpatterns = [
    path('rule/create', views.CommissionRuleCreateView.as_view(), name='commission-rule-create'),
    path('rules', views.CommissionRuleListView.as_view(), name='commission-rules-list'),
    path('earning/auto', views.CommissionEarningAutoCreateView.as_view(), name='commission-earning-auto'),
    path('earning/update_status/<int:pk>', views.CommissionEarningUpdateStatusView.as_view(), name='commission-earning-update-status'),
    path('redeem/<int:pk>', views.CommissionEarningRedeemView.as_view(), name='commission-earning-redeem'),
    path('earnings', views.CommissionEarningListView.as_view(), name='commission-earnings-list'),
    path('report/summary', views.CommissionReportSummaryView.as_view(), name='commission-report-summary'),
]
