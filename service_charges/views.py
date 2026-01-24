from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ServiceChargeRule, HotelServiceCharge
from .serializers import (
    ServiceChargeRuleSerializer,
    HotelServiceChargeSerializer,
    HotelServiceChargeDetailSerializer
)


class ServiceChargeRuleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing service charge rules.
    
    Provides CRUD operations for service charge rules.
    """
    queryset = ServiceChargeRule.objects.all()
    serializer_class = ServiceChargeRuleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter by organization if provided in query params"""
        queryset = super().get_queryset()
        org_id = self.request.query_params.get('organization_id')
        if org_id:
            queryset = queryset.filter(organization_id=org_id)
        return queryset
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle active status of a service charge rule"""
        rule = self.get_object()
        rule.active = not rule.active
        rule.save()
        serializer = self.get_serializer(rule)
        return Response(serializer.data)


class HotelServiceChargeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing hotel service charges.
    
    Provides CRUD operations for hotel service charges with room type breakdown.
    """
    queryset = HotelServiceCharge.objects.select_related('service_charge_rule').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Use detailed serializer for list and retrieve actions"""
        if self.action in ['list', 'retrieve']:
            return HotelServiceChargeDetailSerializer
        return HotelServiceChargeSerializer
    
    def get_queryset(self):
        """Filter by service charge rule if provided"""
        queryset = super().get_queryset()
        rule_id = self.request.query_params.get('service_charge_rule')
        if rule_id:
            queryset = queryset.filter(service_charge_rule_id=rule_id)
        return queryset
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """
        Bulk create hotel service charges.
        
        Expected payload:
        {
            "service_charge_rule": 1,
            "hotel_charges": [
                {
                    "quint_charge": 100,
                    "quad_charge": 150,
                    ...
                    "hotel_ids": [1, 2, 3]
                }
            ]
        }
        """
        service_charge_rule_id = request.data.get('service_charge_rule')
        hotel_charges_data = request.data.get('hotel_charges', [])
        
        if not service_charge_rule_id:
            return Response(
                {'error': 'service_charge_rule is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_charges = []
        errors = []
        
        for charge_data in hotel_charges_data:
            charge_data['service_charge_rule'] = service_charge_rule_id
            serializer = HotelServiceChargeSerializer(data=charge_data)
            
            if serializer.is_valid():
                serializer.save()
                created_charges.append(serializer.data)
            else:
                errors.append(serializer.errors)
        
        return Response({
            'created': created_charges,
            'errors': errors,
            'total_created': len(created_charges),
            'total_errors': len(errors)
        }, status=status.HTTP_201_CREATED if created_charges else status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['delete'])
    def bulk_delete(self, request):
        """
        Bulk delete hotel service charges by IDs.
        
        Expected payload:
        {
            "ids": [1, 2, 3]
        }
        """
        ids = request.data.get('ids', [])
        
        if not ids:
            return Response(
                {'error': 'ids list is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        deleted_count, _ = HotelServiceCharge.objects.filter(id__in=ids).delete()
        
        return Response({
            'deleted_count': deleted_count,
            'message': f'Successfully deleted {deleted_count} hotel service charges'
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], url_path='by-hotel/(?P<hotel_id>[^/.]+)')
    def get_by_hotel(self, request, hotel_id=None):
        """
        Get service charges for a specific hotel.
        
        Returns the service charges (sharing, double, triple, quad, quint) for the given hotel ID.
        
        Example: GET /api/hotel-service-charges/by-hotel/123/
        
        Response:
        {
            "hotel_id": 123,
            "service_charges": {
                "sharing": 300,
                "double": 400,
                "triple": 350,
                "quad": 300,
                "quint": 250,
                "other": 200
            },
            "service_charge_rule": {
                "id": 1,
                "name": "Standard Service Charge"
            }
        }
        """
        if not hotel_id:
            return Response(
                {'error': 'hotel_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            hotel_id = int(hotel_id)
        except ValueError:
            return Response(
                {'error': 'hotel_id must be a valid integer'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find active hotel service charge that includes this hotel ID
        hotel_charges = HotelServiceCharge.objects.filter(
            hotel_ids__contains=[hotel_id],
            active=True
        ).select_related('service_charge_rule').first()
        
        if not hotel_charges:
            # No service charges found for this hotel
            return Response({
                'hotel_id': hotel_id,
                'service_charges': {
                    'sharing': 0,
                    'double': 0,
                    'triple': 0,
                    'quad': 0,
                    'quint': 0,
                    'other': 0
                },
                'service_charge_rule': None,
                'message': 'No service charges configured for this hotel'
            }, status=status.HTTP_200_OK)
        
        return Response({
            'hotel_id': hotel_id,
            'service_charges': {
                'sharing': float(hotel_charges.sharing_charge),
                'double': float(hotel_charges.double_charge),
                'triple': float(hotel_charges.triple_charge),
                'quad': float(hotel_charges.quad_charge),
                'quint': float(hotel_charges.quint_charge),
                'other': float(hotel_charges.other_charge)
            },
            'service_charge_rule': {
                'id': hotel_charges.service_charge_rule.id,
                'name': hotel_charges.service_charge_rule.name
            } if hotel_charges.service_charge_rule else None
        }, status=status.HTTP_200_OK)
