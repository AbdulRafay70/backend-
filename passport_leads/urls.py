from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PassportLeadViewSet, PaxProfileViewSet, TodayFollowUpsView
from .views import UpdatePassportLeadView
from .views import PaxUpdateView, PaxListView

router = DefaultRouter()
router.register(r'passport-leads', PassportLeadViewSet, basename='passportlead')
router.register(r'pax', PaxProfileViewSet, basename='pax')

urlpatterns = [
    # explicit update endpoint to support /passport-leads/update/{lead_id}/
    path('passport-leads/update/<int:lead_id>/', UpdatePassportLeadView.as_view(), name='passport-lead-update'),
    path('followups/today/', TodayFollowUpsView.as_view(), name='passport-followups-today'),
    path('pax/update/<int:pax_id>/', PaxUpdateView.as_view(), name='pax-update'),
    path('pax/list/', PaxListView.as_view(), name='pax-list'),
    path('', include(router.urls)),
]
