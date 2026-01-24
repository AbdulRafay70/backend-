from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from tickets.models import HotelRooms, HotelBooking
from drf_spectacular.utils import extend_schema


class RoomOccupiedDatesAPIView(APIView):
    """
    API to get occupied date ranges for a specific room.
    Returns list of bookings with their date ranges.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Get Occupied Dates for Room",
        description="""
        Returns all occupied date ranges for a specific room.
        Shows which dates are booked so users can see availability.
        """,
        responses={
            200: {
                'description': 'List of occupied date ranges',
                'content': {
                    'application/json': {
                        'example': {
                            'room_id': 123,
                            'room_number': '101',
                            'occupied_dates': [
                                {
                                    'checkin_date': '2026-01-20',
                                    'checkout_date': '2026-01-22',
                                    'guest_name': 'Mr John Doe',
                                    'booking_reference': 'BK-A1B2C3D4'
                                },
                                {
                                    'checkin_date': '2026-01-25',
                                    'checkout_date': '2026-01-27',
                                    'guest_name': 'Mrs Jane Smith',
                                    'booking_reference': 'BK-E5F6G7H8'
                                }
                            ]
                        }
                    }
                }
            },
            404: {'description': 'Room not found'},
        },
        tags=['Hotels']
    )
    def get(self, request, room_id):
        """Get occupied dates for a room"""
        try:
            room = HotelRooms.objects.get(id=room_id)
        except HotelRooms.DoesNotExist:
            return Response({
                'error': 'Room not found',
                'detail': f'Room with id {room_id} does not exist'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get all bookings for this room
        bookings = HotelBooking.objects.filter(room=room).order_by('checkin_date')
        
        # Format occupied dates
        occupied_dates = []
        for booking in bookings:
            occupied_dates.append({
                'checkin_date': booking.checkin_date.strftime('%Y-%m-%d'),
                'checkout_date': booking.checkout_date.strftime('%Y-%m-%d'),
                'guest_name': booking.guest_full_name,
                'booking_reference': booking.booking_reference,
                'bed_number': booking.bed.bed_number
            })
        
        return Response({
            'room_id': room.id,
            'room_number': room.room_number,
            'occupied_dates': occupied_dates
        }, status=status.HTTP_200_OK)
