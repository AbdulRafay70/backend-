from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from tickets.models import Hotels, HotelRooms, RoomDetails, HotelBooking
from drf_spectacular.utils import extend_schema
from django.db import transaction
from django.db.models import Q
from datetime import datetime
from drf_spectacular.openapi import AutoSchema


class HotelBookingAPIView(APIView):
    schema = AutoSchema()
    """
    API for creating hotel room bookings with date ranges.
    Allows multiple bookings on the same bed for different date periods.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Create Hotel Room Booking",
        description="""
        Create a new hotel room booking with customer details and date range.
        
        **Features:**
        - Creates booking record with date range
        - Checks for date conflicts with existing bookings
        - Allows same bed to be booked for different date periods
        - Beds remain AVAILABLE (not marked as OCCUPIED)
        
        **Required Fields:**
        - hotel: Hotel ID
        - room: Room ID
        - guest_first_name: Guest's first name
        - guest_last_name: Guest's last name
        - gender_type: Mr/Mrs/Child
        - document_type: CNIC/Passport
        - document_number: Document number
        - checkin_date: Check-in date (YYYY-MM-DD)
        - checkout_date: Check-out date (YYYY-MM-DD)
        """,
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'hotel': {'type': 'integer', 'example': 56},
                    'room': {'type': 'integer', 'example': 123},
                    'guest_first_name': {'type': 'string', 'example': 'John'},
                    'guest_last_name': {'type': 'string', 'example': 'Doe'},
                    'gender_type': {'type': 'string', 'enum': ['Mr', 'Mrs', 'Child'], 'example': 'Mr'},
                    'document_type': {'type': 'string', 'enum': ['CNIC', 'Passport'], 'example': 'Passport'},
                    'document_number': {'type': 'string', 'example': 'AB1234567'},
                    'checkin_date': {'type': 'string', 'format': 'date', 'example': '2026-01-20'},
                    'checkout_date': {'type': 'string', 'format': 'date', 'example': '2026-01-27'},
                },
                'required': ['hotel', 'room', 'guest_first_name', 'guest_last_name', 'document_number', 'checkin_date', 'checkout_date']
            }
        },
        responses={
            201: {
                'description': 'Booking created successfully',
                'content': {
                    'application/json': {
                        'example': {
                            'message': 'Booking created successfully',
                            'booking_reference': 'BK-A1B2C3D4',
                            'room_number': '101',
                            'bed_number': 'A',
                            'guest_name': 'Mr John Doe',
                            'checkin_date': '2026-01-20',
                            'checkout_date': '2026-01-27',
                            'duration_days': 7
                        }
                    }
                }
            },
            400: {'description': 'Bad Request - Invalid data or date conflict'},
            404: {'description': 'Hotel or Room not found'},
        },
        tags=['Hotels']
    )
    def post(self, request):
        """Create a new hotel room booking with date range"""
        # Extract data from request
        hotel_id = request.data.get('hotel')
        room_id = request.data.get('room')
        guest_first_name = request.data.get('guest_first_name')
        guest_last_name = request.data.get('guest_last_name')
        gender_type = request.data.get('gender_type', 'Mr')
        document_type = request.data.get('document_type', 'CNIC')
        document_number = request.data.get('document_number')
        checkin_date = request.data.get('checkin_date')
        checkout_date = request.data.get('checkout_date')
        
        # Agent information (optional - only if booked by agent)
        agent_id = request.data.get('agent_id')
        agent_name = request.data.get('agent_name')
        agent_organization = request.data.get('agent_organization')
        
        # Validate required fields
        if not all([hotel_id, room_id, guest_first_name, guest_last_name, document_number, checkin_date, checkout_date]):
            return Response({
                'error': 'Missing required fields',
                'detail': 'hotel, room, guest_first_name, guest_last_name, document_number, checkin_date, and checkout_date are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Convert dates to date objects
        try:
            checkin = datetime.strptime(checkin_date, '%Y-%m-%d').date()
            checkout = datetime.strptime(checkout_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({
                'error': 'Invalid date format',
                'detail': 'Dates must be in YYYY-MM-DD format'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate checkout is after checkin
        if checkout <= checkin:
            return Response({
                'error': 'Invalid date range',
                'detail': 'Check-out date must be after check-in date'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Verify hotel exists
            hotel = Hotels.objects.get(id=hotel_id)
        except Hotels.DoesNotExist:
            return Response({
                'error': 'Hotel not found',
                'detail': f'Hotel with id {hotel_id} does not exist'
            }, status=status.HTTP_404_NOT_FOUND)
        
        try:
            # Verify room exists
            room = HotelRooms.objects.get(id=room_id, hotel=hotel)
        except HotelRooms.DoesNotExist:
            return Response({
                'error': 'Room not found',
                'detail': f'Room with id {room_id} does not exist for this hotel'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get all beds in the room
        all_beds = RoomDetails.objects.filter(room=room)
        
        if not all_beds.exists():
            return Response({
                'error': 'No beds found',
                'detail': 'This room has no beds configured'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find a bed that is available for the requested date range
        available_bed = None
        for bed in all_beds:
            # Check if this bed has any conflicting bookings
            conflicting_bookings = HotelBooking.objects.filter(
                bed=bed,
                # Check for date overlap: booking conflicts if:
                # (existing_checkin < new_checkout) AND (existing_checkout > new_checkin)
                checkin_date__lt=checkout,
                checkout_date__gt=checkin
            )
            
            if not conflicting_bookings.exists():
                # This bed is available for the requested dates
                available_bed = bed
                break
        
        if not available_bed:
            return Response({
                'error': 'No available beds for selected dates',
                'detail': f'All beds in this room are booked for the period {checkin_date} to {checkout_date}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # Create the booking record
                booking = HotelBooking.objects.create(
                    hotel=hotel,
                    room=room,
                    bed=available_bed,
                    guest_first_name=guest_first_name,
                    guest_last_name=guest_last_name,
                    gender_type=gender_type,
                    document_type=document_type,
                    document_number=document_number,
                    checkin_date=checkin,
                    checkout_date=checkout,
                    # Agent information (if provided)
                    booked_by_agent_id=agent_id if agent_id else None,
                    agent_name=agent_name if agent_name else None,
                    agent_organization=agent_organization if agent_organization else None
                )
                
                # Note: We do NOT mark the bed as OCCUPIED
                # The bed remains AVAILABLE so it can be booked for other dates
                
                duration = (checkout - checkin).days
                
                return Response({
                    'message': 'Booking created successfully',
                    'booking_reference': booking.booking_reference,
                    'booking_id': booking.id,
                    'room_number': room.room_number,
                    'bed_number': available_bed.bed_number,
                    'guest_name': booking.guest_full_name,
                    'checkin_date': checkin_date,
                    'checkout_date': checkout_date,
                    'duration_days': duration
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response({
                'error': 'Booking failed',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
