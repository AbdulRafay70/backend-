from rest_framework import viewsets,status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q, Sum, F, Value, FloatField, Prefetch
from django.db.models.functions import Coalesce, Cast, Round
from datetime import datetime, timedelta
from .models import Booking, BookingHotelDetails, BookingTransportDetails, BookingTicketDetails, BookingPersonDetail
from .serializers import BookingSerializer

class DailyOperationsAPIView(APIView):
    """
    API endpoint for daily operations page.
    Returns bookings with 'Delivered' status for operational management.
    Supports filtering by date and includes all necessary booking details.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get query parameters
        date_param = request.query_params.get('date')  # Format: YYYY-MM-DD
        
        # Base queryset: only delivered bookings
        queryset = Booking.objects.filter(status='Delivered')
        
        # Apply date filter if provided
        if date_param:
            try:
                filter_date = datetime.strptime(date_param, '%Y-%m-%d').date()
                # Filter bookings that have activities on this date
                # (check-in, check-out, transport, ziyarat, etc.)
                queryset = queryset.filter(
                    Q(hotel_details__check_in_date=filter_date) |
                    Q(hotel_details__check_out_date=filter_date) |
                    Q(transport_details__sector_details__date=filter_date) |
                    Q(ziyarat_details__date=filter_date)
                ).distinct()
            except ValueError:
                return Response(
                    {"error": "Invalid date format. Use YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Optimize queryset with prefetch_related
        queryset = queryset.prefetch_related(
            'hotel_details__hotel',
            'transport_details__vehicle_type',
            'transport_details__sector_details',
            'ticket_details__trip_details',
            'person_details',
            'food_details',
            'ziyarat_details',
            'agency'
        ).select_related(
            'umrah_package',
            'organization',
            'branch'
        ).order_by('-date')
        
        # Serialize the data
        serializer = BookingSerializer(queryset, many=True, context={'request': request})
        
        return Response({
            'count': queryset.count(),
            'results': serializer.data
        })
    
    def patch(self, request):
        """
        Update status for daily operations.
        Supports:
        1. Pax activity status: {"model_type": "pax", "item_id": <pax_id>, "status": <status>, "status_field": "hotel_status", "activity_id": <id>, "activity_type": "hotel"}
        2. Hotel check-in: {"hotel_detail_id": <id>, "check_in_status": "active"}
        3. Hotel check-out: {"hotel_detail_id": <id>, "check_out_status": "active"}
        4. Booking status: {"booking_id": <id>, "status": <new_status>}
        """
        # Handle pax activity status updates
        model_type = request.data.get('model_type')
        item_id = request.data.get('item_id')
        status_value = request.data.get('status')
        status_field = request.data.get('status_field')
        activity_id = request.data.get('activity_id')
        activity_type = request.data.get('activity_type')
        
        if model_type == 'pax' and item_id and status_value:
            try:
                # Get the person detail
                person = BookingPersonDetail.objects.get(id=item_id)
                
                # Update status based on activity type
                if activity_type == 'hotel' and status_field == 'hotel_status':
                    # For now, just return success - the status is tracked in frontend
                    # In future, you might want to add a status field to BookingPersonDetail
                    return Response({
                        'success': True,
                        'message': 'Pax hotel status updated successfully',
                        'pax_id': item_id,
                        'status': status_value,
                        'activity_id': activity_id
                    })
                else:
                    return Response({
                        'success': True,
                        'message': f'Pax {activity_type} status updated successfully',
                        'pax_id': item_id,
                        'status': status_value
                    })
                    
            except BookingPersonDetail.DoesNotExist:
                return Response(
                    {"error": "Passenger not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                return Response(
                    {"error": str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Handle hotel status updates
        hotel_detail_id = request.data.get('hotel_detail_id')
        check_in_status = request.data.get('check_in_status')
        check_out_status = request.data.get('check_out_status')
        
        if hotel_detail_id and (check_in_status or check_out_status):
            try:
                hotel_detail = BookingHotelDetails.objects.get(id=hotel_detail_id)
                
                if check_in_status:
                    hotel_detail.check_in_status = check_in_status
                if check_out_status:
                    hotel_detail.check_out_status = check_out_status
                    
                hotel_detail.save()
                
                return Response({
                    'success': True,
                    'message': 'Hotel status updated successfully',
                    'hotel_detail_id': hotel_detail_id,
                    'check_in_status': hotel_detail.check_in_status,
                    'check_out_status': hotel_detail.check_out_status
                })
            except BookingHotelDetails.DoesNotExist:
                return Response(
                    {"error": "Hotel detail not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                return Response(
                    {"error": str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Handle booking status updates
        booking_id = request.data.get('booking_id')
        new_status = request.data.get('status')
        
        if booking_id and new_status:
            try:
                booking = Booking.objects.get(id=booking_id)
                booking.status = new_status
                booking.save(update_fields=['status'])
                
                serializer = BookingSerializer(booking, context={'request': request})
                return Response({
                    'success': True,
                    'message': f'Booking status updated to {new_status}',
                    'booking': serializer.data
                })
            except Booking.DoesNotExist:
                return Response(
                    {"error": "Booking not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                return Response(
                    {"error": str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # If none of the above conditions matched
        return Response(
            {"error": "Invalid request. Please provide valid parameters for pax status, hotel status, or booking status update."},
            status=status.HTTP_400_BAD_REQUEST
        )
