from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView   # ✅ added import


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api-auth/", include("rest_framework.urls")),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # ✅ Redirect homepage to Swagger UI
    path("", RedirectView.as_view(url="/api/schema/swagger-ui/", permanent=False)),

    # ✅ Include all app routes
    path("", include("users.urls")),
    path("", include("organization.urls")),
    path("", include("packages.urls")),  
    path("", include("tickets.urls")), 
    path("", include("booking.urls")),
    path("", include("ledger.urls")),
    path("", include("finance.urls")),  # Finance & Reports Module
    path("", include("payments.urls")),  # Kuickpay Payment Gateway
    path("api/operations/", include("operations.urls")),  # Operations Module
    path("api/leads/", include("leads.urls")),
    path("api/area-leads/", include("area_leads.urls")),
    path("api/logs/", include("logs.urls")),
    path("api/commissions/", include("commissions.urls")),
    path("api/universal/", include("universal.urls")),
    path("api/blog/", include("blog.urls")),
    path("api/promotion-center/", include("promotion_center.urls")),
    path("api/", include("pax_movements.urls")),
    path("api/", include("passport_leads.urls")),  # Passport Leads & Follow-up Module
    path("api/", include("customers.urls")),  # Customer Auto-Collection API
    path("", include("forms.urls")),  # Dynamic Forms for Lead Generation

    # ✅ Debug & API Docs
    path("__debug__/", include("debug_toolbar.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/schema/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
