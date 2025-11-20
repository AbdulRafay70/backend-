from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VisaViewSet,
    PackageViewSet,
    RiyalRateViewSet,
    ShirkaViewSet,
    UmrahVisaPriceViewSet,
    UmrahVisaPriceTwoViewSet,
    TransportSectorPriceViewSet,
    AirlinesViewSet,
    CityViewSet,
    BookingExpiryViewSet,
    UmrahPackageViewSet,
    CustomUmrahPackageViewSet,
    OnlyVisaPriceViewSet,
    SetVisaTypeViewSet,
    FoodPriceViewSet,
    ZiaratPriceViewSet,
    AllPricesAPIView,
    AllPricesByOrgAPIView,
    PublicUmrahPackageListAPIView,
    PublicUmrahPackageDetailAPIView,
)

router = DefaultRouter()

# New enhanced endpoints for Visa and Package inventory
router.register(r'visa', VisaViewSet, basename='visa')
router.register(r'packages', PackageViewSet, basename='package')

# Existing endpoints
router.register(r'riyal-rates', RiyalRateViewSet, basename='riyalrate')
router.register(r'shirkas', ShirkaViewSet, basename='shirka')
router.register(r'umrah-visa-prices', UmrahVisaPriceViewSet, basename='umrahvisaprice')
router.register(r'umrah-visa-type-two', UmrahVisaPriceTwoViewSet, basename='umrahvisatypetwo')
router.register(r'only-visa-prices', OnlyVisaPriceViewSet, basename='onlyvisaprice')
router.register(r'transport-sector-prices', TransportSectorPriceViewSet, basename='transportsectorprice')
router.register(r'airlines', AirlinesViewSet, basename='airlines')
router.register(r'cities', CityViewSet, basename='city')
router.register(r'set-visa-type', SetVisaTypeViewSet, basename='setvisatype')
router.register(r'food-prices', FoodPriceViewSet, basename='foodprice')
router.register(r'ziarat-prices', ZiaratPriceViewSet, basename='ziaratprice')
router.register(r'booking-expiry', BookingExpiryViewSet, basename='bookingexpiry')
router.register(r'umrah-packages', UmrahPackageViewSet, basename='umrahpackage')
router.register(r'custom-umrah-packages', CustomUmrahPackageViewSet, basename='customumrahpackage')

urlpatterns = [
    path('api/', include(router.urls)),  # ✅ your app’s API is now under /api/
    path('api/all-prices/', AllPricesAPIView.as_view(), name='all-prices'),
    path('api/all-prices/<int:organization_id>/', AllPricesByOrgAPIView.as_view(), name='all-prices-by-org'),
    # Public package browsing endpoints
    path('api/public/packages/', PublicUmrahPackageListAPIView.as_view(), name='public-packages-list'),
    path('api/public/packages/<str:identifier>/', PublicUmrahPackageDetailAPIView.as_view(), name='public-packages-detail'),
]
