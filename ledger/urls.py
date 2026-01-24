from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LedgerCreateAPIView, 
    LedgerListAPIView, 
    LedgerDetailAPIView,
    LedgerReverseAPIView,
    LedgerAccountsAPIView,
    LedgerSummaryAPIView,
)

# Import the new 5-level ledger views
from .views_levels import (
    OrganizationLedgerAPIView,
    BranchLedgerAPIView,
    AgencyLedgerAPIView,
    AreaAgencyLedgerAPIView,
    OrgToOrgLedgerAPIView,
)

# Import the new pending balance views
from .views_pending_balances import (
    agents_pending_balances, 
    area_agents_pending_balances, 
    branch_pending_balances, 
    organization_pending_balances, 
    final_balance
)

# Import inter-org views
from .views_interorg import (
    InterOrgFinancialSummaryView,
    InterOrgPaymentViewSet,
    InterOrgTransactionHistoryView,
)

# Setup router for viewsets
router = DefaultRouter()
router.register(r'inter-org-payments', InterOrgPaymentViewSet, basename='interorg-payment')

urlpatterns = [
    # Main ledger endpoints (matching specification)
    path("api/ledger/", LedgerListAPIView.as_view(), name="ledger-list"),
    path("api/ledger/<int:pk>/", LedgerDetailAPIView.as_view(), name="ledger-detail"),
    path("api/ledger/create/", LedgerCreateAPIView.as_view(), name="ledger-create"),
    path("api/ledger/<int:pk>/reverse/", LedgerReverseAPIView.as_view(), name="ledger-reverse"),
    path("api/ledger/accounts/", LedgerAccountsAPIView.as_view(), name="ledger-accounts"),
    path("api/ledger/summary/", LedgerSummaryAPIView.as_view(), name="ledger-summary"),

    # 🔹 5-LEVEL LEDGER ENDPOINTS
    # 1️⃣ Organization Ledger (with all its branches & linked orgs)
    path("api/ledger/organization/<int:organization_id>/", 
         OrganizationLedgerAPIView.as_view(), 
         name="ledger-organization"),
    
    # 2️⃣ Branch Ledger
    path("api/ledger/branch/<int:branch_id>/", 
         BranchLedgerAPIView.as_view(), 
         name="ledger-branch"),
    
    # 3️⃣ Agency Ledger
    path("api/ledger/agency/<int:agency_id>/", 
         AgencyLedgerAPIView.as_view(), 
         name="ledger-agency"),
    
    # 4️⃣ Area Agency Ledger
    path("api/ledger/area-agency/<int:area_agency_id>/", 
         AreaAgencyLedgerAPIView.as_view(), 
         name="ledger-area-agency"),
    
    # 5️⃣ Organization-to-Organization Ledger
    path("api/ledger/org-to-org/<int:org1_id>/<int:org2_id>/", 
         OrgToOrgLedgerAPIView.as_view(), 
         name="ledger-org-to-org"),

    # 🔹 INTER-ORG RESELLER ENDPOINTS
    # Inter-org financial summary
    path("api/ledger/inter-org-summary/",
         InterOrgFinancialSummaryView.as_view(),
         name="interorg-financial-summary"),
    
    # Inter-org transaction history
    path("api/ledger/inter-org-transactions/",
         InterOrgTransactionHistoryView.as_view(),
         name="interorg-transaction-history"),
    
    # Router URLs (inter-org payments CRUD + custom actions)
    path("api/ledger/", include(router.urls)),

    # Legacy/additional balance endpoints
    path("api/agents/pending-balances", agents_pending_balances, name="agents-pending-balances"),
    path("api/area-agents/pending-balances", area_agents_pending_balances, name="area-agents-pending-balances"),
    path("api/branch/pending-balances", branch_pending_balances, name="branch-pending-balances"),
    path("api/organization/pending-balances", organization_pending_balances, name="organization-pending-balances"),
    path("api/final-balance", final_balance, name="final-balance"),
]
