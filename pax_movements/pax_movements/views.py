from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q, Count
from datetime import datetime, date
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample

from .models import (
    PaxMovement, AirportTransfer, AirportTransferPax,
    Transport, TransportPax, Ziyarat, ZiyaratPax,
    FoodService, FoodServicePax
)
from booking.models import Booking
from .serializers import (
    PaxMovementSerializer, PaxMovementUpdateSerializer,
    PaxMovementVerifyExitSerializer, PaxMovementSummarySerializer,
    AirportTransferSerializer, AirportTransferUpdateSerializer,
    TransportSerializer, TransportUpdateSerializer,
    ZiyaratSerializer, ZiyaratUpdateSerializer,
    FoodServiceSerializer, FoodServiceUpdateSerializer,
    PaxFullDetailsSerializer
)
from .mixins import EmptyDataMixin


@extend_schema_view(
    list=extend_schema(
        description="Get list of passenger movements with optional filters",
        parameters=[
            OpenApiParameter(
                name="pax_id",
                type=str,
                location=OpenApiParameter.QUERY,
                description="Filter by PAX ID",
                required=False,
            ),
            OpenApiParameter(
                name="status",
                type=str,
                location=OpenApiParameter.QUERY,
                description="Filter by status: in_pakistan, entered_ksa, in_ksa, exited_ksa",
                required=False,
            ),
            OpenApiParameter(
                name="booking_id",
                type=str,
                location=OpenApiParameter.QUERY,
                description="Filter by booking number",
                required=False,
            ),
        ],
    ),
    create=extend_schema(
        description="Create a new passenger movement record (auto-created on booking)",
    ),
    retrieve=extend_schema(
        description="Get details of a specific passenger movement",
    ),
    update=extend_schema(
        description="Update passenger movement details",
    ),
    partial_update=extend_schema(
        description="Partially update passenger movement details",
    ),
)
class PaxMovementViewSet(EmptyDataMixin, viewsets.ModelViewSet):
    """
    Passenger Movement Tracking API
    
    Endpoints:
    - GET /pax-movement/status/{id}/ - Get movement status for a pax
    - PUT /pax-movement/update/{id}/ - Update movement status
    - GET /pax-movement/summary/ - Get summary statistics
    - POST /pax-movement/verify-exit/{id}/ - Verify passenger exit
    - POST /pax-movement/notify-agent/{id}/ - Send notification to agent
    """
    queryset = PaxMovement.objects.all()
    serializer_class = PaxMovementSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by pax_id if provided
        pax_id = self.request.query_params.get('pax_id')
        if pax_id:
            queryset = queryset.filter(pax_id=pax_id)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by booking
        booking_id = self.request.query_params.get('booking_id')
        if booking_id:
            queryset = queryset.filter(booking__booking_number=booking_id)
        
        return queryset
    
    @extend_schema(
        description="Get current status of a passenger movement",
        responses={200: PaxMovementSerializer}
    )
    @action(detail=True, methods=['get'], url_path='status')
    def get_status(self, request, pk=None):
        """GET /pax-movement/{id}/status/"""
        pax_movement = self.get_object()
        serializer = self.get_serializer(pax_movement)
        return Response({
            "message": "Passenger status retrieved successfully",
            "data": serializer.data
        })
    
    @extend_schema(
        description="Update passenger movement status and flight information. Auto-resets reported_to_shirka if flight details change.",
        request=PaxMovementUpdateSerializer,
        responses={200: PaxMovementSerializer},
        examples=[
            OpenApiExample(
                "Update Flight Details",
                value={
                    "flight_number_to_ksa": "SV740",
                    "flight_date_to_ksa": "2025-12-15T10:30:00Z",
                    "departure_airport": "Karachi (KHI)",
                    "arrival_airport": "Jeddah (JED)",
                    "status": "entered_ksa",
                    "current_city": 1
                },
                request_only=True
            )
        ]
    )
    @action(detail=True, methods=['put'], url_path='update')
    def update_status(self, request, pk=None):
        """PUT /pax-movement/{id}/update/"""
        pax_movement = self.get_object()
        serializer = PaxMovementUpdateSerializer(data=request.data, partial=True)
        
        if serializer.is_valid():
            for key, value in serializer.validated_data.items():
                setattr(pax_movement, key, value)
            
            pax_movement.updated_by = request.user
            pax_movement.save()
            
            response_serializer = PaxMovementSerializer(pax_movement)
            return Response({
                "message": "Passenger movement updated successfully",
                "data": response_serializer.data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @extend_schema(
        description="Get summary statistics of all passenger movements: counts by status, city, and verification status",
        responses={200: PaxMovementSummarySerializer}
    )
    @action(detail=False, methods=['get'], url_path='summary')
    def get_summary(self, request):
        """
        GET /pax-movement/summary/
        
        Returns summary statistics:
        - How many in Pakistan
        - How many in KSA
        - How many exited
        - How many in each city (Makkah, Madinah, Jeddah, etc.)
        """
        queryset = self.get_queryset()
        
        # Count by status
        total_pax = queryset.count()
        in_pakistan = queryset.filter(status='in_pakistan').count()
        entered_ksa = queryset.filter(status='entered_ksa').count()
        in_ksa = queryset.filter(status='in_ksa').count()
        exited_ksa = queryset.filter(status='exited_ksa').count()
        
        # Count verified vs not verified exits
        verified_exits = queryset.filter(
            status='exited_ksa', 
            exit_verification='verified'
        ).count()
        not_verified_exits = queryset.filter(
            status='exited_ksa', 
            exit_verification='not_verified'
        ).count()
        
        # Count by city (for those in KSA)
        by_city = {}
        city_counts = queryset.filter(
            status__in=['entered_ksa', 'in_ksa'],
            current_city__isnull=False
        ).values('current_city__name').annotate(count=Count('id'))
        
        for item in city_counts:
            city_name = item['current_city__name']
            by_city[city_name] = item['count']
        
        summary_data = {
            'total_pax': total_pax,
            'in_pakistan': in_pakistan,
            'entered_ksa': entered_ksa,
            'in_ksa': in_ksa,
            'exited_ksa': exited_ksa,
            'verified_exits': verified_exits,
            'not_verified_exits': not_verified_exits,
            'by_city': by_city
        }
        
        serializer = PaxMovementSummarySerializer(summary_data)
        return Response({
            "message": "Summary retrieved successfully",
            "data": serializer.data
        })
    
    @extend_schema(
        description="Admin manually verifies passenger exit from KSA based on PNR/exit report",
        request=PaxMovementVerifyExitSerializer,
        responses={200: PaxMovementSerializer},
        examples=[
            OpenApiExample(
                "Verify Exit",
                value={"exit_verification": "verified"},
                request_only=True
            ),
            OpenApiExample(
                "Reject Exit Claim",
                value={"exit_verification": "not_verified"},
                request_only=True
            )
        ]
    )
    @action(detail=True, methods=['post'], url_path='verify-exit')
    def verify_exit(self, request, pk=None):
        """POST /pax-movement/{id}/verify-exit/"""
        pax_movement = self.get_object()
        serializer = PaxMovementVerifyExitSerializer(data=request.data)
        
        if serializer.is_valid():
            pax_movement.exit_verification = serializer.validated_data['exit_verification']
            pax_movement.verified_by = request.user
            pax_movement.verified_at = timezone.now()
            
            # If not already exited, update status
            if pax_movement.status != 'exited_ksa':
                pax_movement.status = 'exited_ksa'
                pax_movement.exit_date = timezone.now()
            
            pax_movement.save()
            
            response_serializer = PaxMovementSerializer(pax_movement)
            return Response({
                'message': 'Exit verification updated successfully',
                'data': response_serializer.data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @extend_schema(
        description="Send notification to agent if passenger has not exited as claimed. Auto-notification system for updating flight info.",
        responses={200: dict}
    )
    @action(detail=True, methods=['post'], url_path='notify-agent')
    def notify_agent(self, request, pk=None):
        """POST /pax-movement/{id}/notify-agent/"""
        pax_movement = self.get_object()
        
        # Update notification tracking
        pax_movement.agent_notified = True
        pax_movement.last_notification_sent = timezone.now()
        pax_movement.save()
        
        # TODO: Implement actual notification logic (email/SMS)
        # For now, just mark as notified
        
        return Response({
            'message': f'Agent notified successfully for {pax_movement.pax_id}',
            'data': {
                'pax_id': pax_movement.pax_id,
                'notification_sent_at': pax_movement.last_notification_sent,
                'agent_notified': pax_movement.agent_notified
            }
        })
        pax_movement.last_notification_sent = timezone.now()
        pax_movement.save()
        
        # TODO: Implement actual notification logic (email/SMS)
        # For now, just mark as notified
        
        return Response({
            'message': f'Agent notified successfully for {pax_movement.pax_id}',
            'data': {
                'pax_id': pax_movement.pax_id,
                'notification_sent_at': pax_movement.last_notification_sent,
                'agent_notified': pax_movement.agent_notified
            }
        })


@extend_schema_view(
    list=extend_schema(
        description="Get list of airport transfers with optional date filter",
        parameters=[
            OpenApiParameter(
                name="date",
                type=str,
                location=OpenApiParameter.QUERY,
                description="Filter by date (YYYY-MM-DD format)",
                required=False,
            ),
        ],
    ),
    create=extend_schema(
        description="Create a new airport transfer record"
    ),
    retrieve=extend_schema(
        description="Get details of a specific airport transfer"
    ),
    update=extend_schema(
        description="Update airport transfer details"
    ),
)
class AirportTransferViewSet(EmptyDataMixin, viewsets.ModelViewSet):
    """
    Airport Pickup/Drop Management API
    
    Endpoints:
    - GET /daily/airport?date=2025-10-17 - Get daily airport transfers
    - PUT /daily/airport/update - Update pax status in transfer
    """
    queryset = AirportTransfer.objects.all()
    serializer_class = AirportTransferSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by date
        date_param = self.request.query_params.get('date')
        if date_param:
            try:
                filter_date = datetime.strptime(date_param, '%Y-%m-%d').date()
                queryset = queryset.filter(flight_date=filter_date)
            except ValueError:
                pass
        
        return queryset.select_related('booking').prefetch_related('passengers__person')
    
    @action(detail=False, methods=['get'], url_path='daily')
    def daily_transfers(self, request):
        """GET /daily/airport?date=2025-10-17"""
        date_param = request.query_params.get('date', str(date.today()))
        
        try:
            filter_date = datetime.strptime(date_param, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        transfers = self.queryset.filter(flight_date=filter_date).select_related('booking').prefetch_related('passengers__person')
        
        # Format response
        airport_transfers = []
        for transfer in transfers:
            pax_list = []
            for pax in transfer.passengers.all():
                pax_list.append({
                    'pax_id': pax.pax_movement.pax_id,
                    'first_name': pax.person.first_name,
                    'last_name': pax.person.last_name,
                    'contact_no': pax.person.contact_number
                })
            
            airport_transfers.append({
                'booking_id': transfer.booking.booking_number,
                'transfer_type': transfer.transfer_type,
                'flight_number': transfer.flight_number,
                'flight_time': transfer.flight_time.strftime('%H:%M'),
                'pickup_point': transfer.pickup_point,
                'drop_point': transfer.drop_point,
                'status': transfer.status,
                'pax_list': pax_list
            })
        
        return Response({
            'date': date_param,
            'airport_transfers': airport_transfers
        })
    
    @action(detail=False, methods=['put'], url_path='update')
    def update_pax_status(self, request):
        """PUT /daily/airport/update"""
        serializer = AirportTransferUpdateSerializer(data=request.data)
        
        if serializer.is_valid():
            booking_id = serializer.validated_data['booking_id']
            pax_id = serializer.validated_data['pax_id']
            new_status = serializer.validated_data['status']
            updated_by_id = serializer.validated_data['updated_by']
            
            # Find the transfer and pax
            try:
                pax_movement = PaxMovement.objects.get(pax_id=pax_id)
                transfer = AirportTransfer.objects.get(booking__booking_number=booking_id)
                transfer_pax = AirportTransferPax.objects.get(
                    transfer=transfer,
                    pax_movement=pax_movement
                )
                
                # Update status
                transfer_pax.status = new_status
                transfer_pax.updated_by = User.objects.get(id=updated_by_id)
                transfer_pax.save()
                
                return Response({
                    'message': 'Status updated successfully',
                    'pax_id': pax_id,
                    'new_status': new_status
                })
            
            except (PaxMovement.DoesNotExist, AirportTransfer.DoesNotExist, AirportTransferPax.DoesNotExist):
                return Response(
                    {'error': 'Transfer or passenger not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema_view(
    list=extend_schema(
        description="Get list of city-to-city transports with optional date filter",
        parameters=[
            OpenApiParameter(
                name="date",
                type=str,
                location=OpenApiParameter.QUERY,
                description="Filter by scheduled date (YYYY-MM-DD format)",
                required=False,
            ),
        ],
    ),
    create=extend_schema(
        description="Create a new transport schedule"
    ),
)
class TransportViewSet(EmptyDataMixin, viewsets.ModelViewSet):
    """
    City-to-City Transport Management API
    
    Endpoints:
    - GET /daily/transport?date=2025-10-17 - Get daily transports
    - PUT /daily/transport/update - Update pax status in transport
    """
    queryset = Transport.objects.all()
    serializer_class = TransportSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by date
        date_param = self.request.query_params.get('date')
        if date_param:
            try:
                filter_date = datetime.strptime(date_param, '%Y-%m-%d').date()
                queryset = queryset.filter(scheduled_date=filter_date)
            except ValueError:
                pass
        
        return queryset.select_related('booking').prefetch_related('passengers__person')
    
    @action(detail=False, methods=['get'], url_path='daily')
    def daily_transports(self, request):
        """GET /daily/transport?date=2025-10-17"""
        date_param = request.query_params.get('date', str(date.today()))
        
        try:
            filter_date = datetime.strptime(date_param, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        transports = self.queryset.filter(scheduled_date=filter_date).select_related('booking').prefetch_related('passengers__person')
        
        # Format response
        transport_list = []
        for transport in transports:
            pax_list = []
            for pax in transport.passengers.all():
                pax_list.append({
                    'pax_id': pax.pax_movement.pax_id,
                    'first_name': pax.person.first_name,
                    'last_name': pax.person.last_name,
                    'contact_no': pax.person.contact_number
                })
            
            transport_list.append({
                'booking_id': transport.booking.booking_number,
                'pickup': transport.pickup_location,
                'drop': transport.drop_location,
                'vehicle': transport.vehicle_type,
                'driver_name': transport.driver_name,
                'status': transport.status,
                'pax_list': pax_list
            })
        
        return Response({
            'date': date_param,
            'transports': transport_list
        })
    
    @action(detail=False, methods=['put'], url_path='update')
    def update_pax_status(self, request):
        """PUT /daily/transport/update"""
        serializer = TransportUpdateSerializer(data=request.data)
        
        if serializer.is_valid():
            booking_id = serializer.validated_data['booking_id']
            pax_id = serializer.validated_data['pax_id']
            new_status = serializer.validated_data['status']
            updated_by_id = serializer.validated_data['updated_by']
            
            try:
                pax_movement = PaxMovement.objects.get(pax_id=pax_id)
                transport = Transport.objects.get(booking__booking_number=booking_id)
                transport_pax = TransportPax.objects.get(
                    transport=transport,
                    pax_movement=pax_movement
                )
                
                transport_pax.status = new_status
                transport_pax.updated_by = User.objects.get(id=updated_by_id)
                transport_pax.save()
                
                return Response({
                    'message': 'Status updated successfully',
                    'pax_id': pax_id,
                    'new_status': new_status
                })
            
            except (PaxMovement.DoesNotExist, Transport.DoesNotExist, TransportPax.DoesNotExist):
                return Response(
                    {'error': 'Transport or passenger not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema_view(
    list=extend_schema(
        description="Get list of Ziyarat schedules with optional date filter",
        parameters=[
            OpenApiParameter(
                name="date",
                type=str,
                location=OpenApiParameter.QUERY,
                description="Filter by scheduled date (YYYY-MM-DD format)",
                required=False,
            ),
        ],
    ),
    create=extend_schema(
        description="Create a new Ziyarat schedule"
    ),
)
class ZiyaratViewSet(EmptyDataMixin, viewsets.ModelViewSet):
    """
    Ziyarat Management API
    
    Endpoints:
    - GET /daily/ziyarats?date=2025-10-17 - Get daily ziyarats
    - PUT /daily/ziyarats/update - Update pax status in ziyarat
    """
    queryset = Ziyarat.objects.all()
    serializer_class = ZiyaratSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by date
        date_param = self.request.query_params.get('date')
        if date_param:
            try:
                filter_date = datetime.strptime(date_param, '%Y-%m-%d').date()
                queryset = queryset.filter(scheduled_date=filter_date)
            except ValueError:
                pass
        
        return queryset.select_related('booking').prefetch_related('passengers__person')
    
    @action(detail=False, methods=['get'], url_path='daily')
    def daily_ziyarats(self, request):
        """GET /daily/ziyarats?date=2025-10-17"""
        date_param = request.query_params.get('date', str(date.today()))
        
        try:
            filter_date = datetime.strptime(date_param, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        ziyarats = self.queryset.filter(scheduled_date=filter_date).select_related('booking').prefetch_related('passengers__person')
        
        # Format response
        ziyarat_list = []
        for ziyarat in ziyarats:
            pax_list = []
            for pax in ziyarat.passengers.all():
                pax_list.append({
                    'pax_id': pax.pax_movement.pax_id,
                    'first_name': pax.person.first_name,
                    'last_name': pax.person.last_name,
                    'contact_no': pax.person.contact_number
                })
            
            ziyarat_list.append({
                'booking_id': ziyarat.booking.booking_number,
                'location': ziyarat.location,
                'pickup_time': ziyarat.pickup_time.strftime('%I:%M %p'),
                'status': ziyarat.status,
                'pax_list': pax_list
            })
        
        return Response({
            'date': date_param,
            'ziyarats': ziyarat_list
        })
    
    @action(detail=False, methods=['put'], url_path='update')
    def update_pax_status(self, request):
        """PUT /daily/ziyarats/update"""
        serializer = ZiyaratUpdateSerializer(data=request.data)
        
        if serializer.is_valid():
            booking_id = serializer.validated_data['booking_id']
            pax_id = serializer.validated_data['pax_id']
            new_status = serializer.validated_data['status']
            updated_by_id = serializer.validated_data['updated_by']
            
            try:
                pax_movement = PaxMovement.objects.get(pax_id=pax_id)
                ziyarat = Ziyarat.objects.get(booking__booking_number=booking_id)
                ziyarat_pax = ZiyaratPax.objects.get(
                    ziyarat=ziyarat,
                    pax_movement=pax_movement
                )
                
                ziyarat_pax.status = new_status
                ziyarat_pax.updated_by = User.objects.get(id=updated_by_id)
                ziyarat_pax.save()
                
                return Response({
                    'message': 'Status updated successfully',
                    'pax_id': pax_id,
                    'new_status': new_status
                })
            
            except (PaxMovement.DoesNotExist, Ziyarat.DoesNotExist, ZiyaratPax.DoesNotExist):
                return Response(
                    {'error': 'Ziyarat or passenger not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema_view(
    list=extend_schema(
        description="Get list of food services with optional date filter",
        parameters=[
            OpenApiParameter(
                name="date",
                type=str,
                location=OpenApiParameter.QUERY,
                description="Filter by service date (YYYY-MM-DD format)",
                required=False,
            ),
        ],
    ),
    create=extend_schema(
        description="Create a new food service record"
    ),
)
class FoodServiceViewSet(EmptyDataMixin, viewsets.ModelViewSet):
    """
    Food Service Management API
    
    Endpoints:
    - GET /daily/food?date=2025-10-17 - Get daily meals
    - PUT /daily/food/update - Update pax status in food service
    """
    queryset = FoodService.objects.all()
    serializer_class = FoodServiceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by date
        date_param = self.request.query_params.get('date')
        if date_param:
            try:
                filter_date = datetime.strptime(date_param, '%Y-%m-%d').date()
                queryset = queryset.filter(service_date=filter_date)
            except ValueError:
                pass
        
        return queryset.select_related('booking').prefetch_related('passengers__person')
    
    @action(detail=False, methods=['get'], url_path='daily')
    def daily_meals(self, request):
        """GET /daily/food?date=2025-10-17"""
        date_param = request.query_params.get('date', str(date.today()))
        
        try:
            filter_date = datetime.strptime(date_param, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        meals = self.queryset.filter(service_date=filter_date).select_related('booking').prefetch_related('passengers__person')
        
        # Format response
        meal_list = []
        for meal in meals:
            pax_list = []
            for pax in meal.passengers.all():
                pax_list.append({
                    'pax_id': pax.pax_movement.pax_id,
                    'first_name': pax.person.first_name,
                    'last_name': pax.person.last_name,
                    'contact_no': pax.person.contact_number
                })
            
            meal_list.append({
                'booking_id': meal.booking.booking_number,
                'meal_type': meal.meal_type.capitalize(),
                'time': meal.service_time.strftime('%I:%M %p'),
                'menu': meal.menu,
                'location': meal.location,
                'status': meal.status,
                'pax_list': pax_list
            })
        
        return Response({
            'date': date_param,
            'meals': meal_list
        })
    
    @action(detail=False, methods=['put'], url_path='update')
    def update_pax_status(self, request):
        """PUT /daily/food/update"""
        serializer = FoodServiceUpdateSerializer(data=request.data)
        
        if serializer.is_valid():
            booking_id = serializer.validated_data['booking_id']
            pax_id = serializer.validated_data['pax_id']
            new_status = serializer.validated_data['status']
            updated_by_id = serializer.validated_data['updated_by']
            
            try:
                pax_movement = PaxMovement.objects.get(pax_id=pax_id)
                food_service = FoodService.objects.get(booking__booking_number=booking_id)
                food_pax = FoodServicePax.objects.get(
                    food_service=food_service,
                    pax_movement=pax_movement
                )
                
                food_pax.status = new_status
                food_pax.updated_by = User.objects.get(id=updated_by_id)
                food_pax.save()
                
                return Response({
                    'message': 'Status updated successfully',
                    'pax_id': pax_id,
                    'new_status': new_status
                })
            
            except (PaxMovement.DoesNotExist, FoodService.DoesNotExist, FoodServicePax.DoesNotExist):
                return Response(
                    {'error': 'Food service or passenger not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema_view(
    retrieve=extend_schema(
        description="Get complete passenger details across all modules (PAX movement, booking, hotel, transport, ziyarat, food service)",
        parameters=[
            OpenApiParameter(
                name="pk",
                type=str,
                location=OpenApiParameter.PATH,
                description="Passenger ID (pax_id)",
                required=True,
            ),
        ],
    ),
)
class PaxDetailsViewSet(viewsets.ViewSet):
    """
    Passenger Full Details API
    
    Endpoint:
    - GET /pax/details/{pax_id}/ - Get complete passenger details across all modules
    """
    permission_classes = [IsAuthenticated]
    
    def retrieve(self, request, pk=None):
        """GET /pax/details/{pax_id}/"""
        pax_id = pk
        
        try:
            pax_movement = PaxMovement.objects.select_related(
                'person', 'booking'
            ).get(pax_id=pax_id)
        except PaxMovement.DoesNotExist:
            return Response(
                {'error': f'Passenger with ID {pax_id} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        person = pax_movement.person
        booking = pax_movement.booking
        
        # Flight details
        flight_data = {
            'departure': 'LHE',  # You may want to get this from booking flight details
            'arrival': 'JED',
            'flight_time_to_ksa': pax_movement.flight_date_to_ksa.isoformat() if pax_movement.flight_date_to_ksa else None,
            'flight_number_to_ksa': pax_movement.flight_number_to_ksa,
            'flight_time_from_ksa': pax_movement.flight_date_from_ksa.isoformat() if pax_movement.flight_date_from_ksa else None,
            'flight_number_from_ksa': pax_movement.flight_number_from_ksa,
        }
        
        # Hotel details
        hotel_data = []
        for hotel_detail in booking.hotel_details.all():
            hotel_data.append({
                'name': hotel_detail.hotel.name if hotel_detail.hotel else hotel_detail.self_hotel_name,
                'check_in': hotel_detail.check_in_date.isoformat() if hotel_detail.check_in_date else None,
                'check_out': hotel_detail.check_out_date.isoformat() if hotel_detail.check_out_date else None,
                'room_type': hotel_detail.room_type,
                'status': hotel_detail.check_in_status
            })
        
        # Transport details
        transport_data = []
        for transport_pax in pax_movement.transports.all():
            transport = transport_pax.transport
            transport_data.append({
                'pickup': transport.pickup_location,
                'drop': transport.drop_location,
                'scheduled_date': transport.scheduled_date.isoformat(),
                'status': transport_pax.status
            })
        
        # Ziyarat details
        ziyarat_data = []
        for ziyarat_pax in pax_movement.ziyarats.all():
            ziyarat = ziyarat_pax.ziyarat
            ziyarat_data.append({
                'location': ziyarat.location,
                'scheduled_date': ziyarat.scheduled_date.isoformat(),
                'pickup_time': ziyarat.pickup_time.strftime('%H:%M'),
                'status': ziyarat_pax.status
            })
        
        # Food details
        food_data = []
        for food_pax in pax_movement.food_services.all():
            food = food_pax.food_service
            food_data.append({
                'meal_type': food.meal_type.capitalize(),
                'service_date': food.service_date.isoformat(),
                'service_time': food.service_time.strftime('%H:%M'),
                'menu': food.menu,
                'status': food_pax.status
            })
        
        # Build full response
        full_details = {
            'pax_id': pax_movement.pax_id,
            'first_name': person.first_name,
            'last_name': person.last_name,
            'passport_no': person.passport_number,
            'booking_id': booking.booking_number,
            'movement_status': pax_movement.status,
            'current_city': pax_movement.current_city.name if pax_movement.current_city else None,
            'flight': flight_data,
            'hotel': hotel_data,
            'transport': transport_data,
            'ziyarats': ziyarat_data,
            'food': food_data
        }
        
        serializer = PaxFullDetailsSerializer(full_details)
        return Response(serializer.data)
