from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q, Count, Sum
from django.utils import timezone
from tickets.models import Hotels, HotelRooms, RoomDetails
from booking.models import BookingHotelDetails, BookingPersonDetail
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes


@extend_schema(
    summary="Get Hotel Room & Bed Availability",
    description="""
    Retrieve real-time hotel room and bed availability with visual floor mapping.
    
    **Features:**
    - Shows occupancy status: occupied, available, or partially occupied
    - Provides room type breakdowns (quint, quad, triple, double, single)
    - Calculates available sharing beds for multi-bed rooms
    - Returns guest information and booking details for occupied rooms
    - Includes floor-wise room distribution
    
    **Use Cases:**
    - Hotel availability management dashboard
    - Room assignment and allocation
    - Visual floor map displays
    - Booking availability checks
    """,
    parameters=[
        OpenApiParameter(
            name='hotel_id',
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            required=True,
            description='Unique identifier of the hotel'
        ),
        OpenApiParameter(
            name='date_from',
            type=OpenApiTypes.DATE,
            location=OpenApiParameter.QUERY,
            required=True,
            description='Start date for availability check (format: YYYY-MM-DD)',
            examples=[
                OpenApiExample('Example Date', value='2025-01-15')
            ]
        ),
        OpenApiParameter(
            name='date_to',
            type=OpenApiTypes.DATE,
            location=OpenApiParameter.QUERY,
            required=True,
            description='End date for availability check (format: YYYY-MM-DD)',
            examples=[
                OpenApiExample('Example Date', value='2025-01-20')
            ]
        ),
        OpenApiParameter(
            name='owner_organization',
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            required=False,
            description='Organization ID that owns the hotel (optional for backward compatibility)'
        ),
    ],
    responses={
        200: {
            'description': 'Hotel availability data with room and bed details',
            'content': {
                'application/json': {
                    'example': {
                        "hotel_id": 123,
                        "hotel_name": "Hilton Makkah",
                        "total_rooms": 120,
                        "total_quint_rooms": 30,
                        "total_quad_rooms": 25,
                        "total_triple_rooms": 35,
                        "total_double_rooms": 30,
                        "available_rooms": 35,
                        "available_beds": 85,
                        "available_sharing_beds": 42,
                        "available_quint_rooms": 10,
                        "available_quad_rooms": 8,
                        "available_triple_rooms": 12,
                        "available_double_rooms": 5,
                        "occupied_rooms": 85,
                        "floors": [
                            {
                                "floor_no": "1",
                                "floor_map_url": "https://cdn.saer.pk/maps/floor_1.png",
                                "rooms": [
                                    {
                                        "room_id": 101,
                                        "room_no": "101",
                                        "room_type": "Double",
                                        "capacity": 2,
                                        "available_beds": 0,
                                        "occupied_beds": 2,
                                        "status": "occupied",
                                        "current_booking_id": 5023,
                                        "guest_names": ["Ali Raza", "Ahmed Khan"],
                                        "checkin_date": "2025-10-17",
                                        "checkout_date": "2025-10-20"
                                    },
                                    {
                                        "room_id": 102,
                                        "room_no": "102",
                                        "room_type": "Triple",
                                        "capacity": 3,
                                        "available_beds": 1,
                                        "occupied_beds": 2,
                                        "status": "partially_occupied",
                                        "current_booking_id": 5024,
                                        "guest_names": ["Usman Ali"],
                                        "checkin_date": "2025-10-17",
                                        "checkout_date": "2025-10-21"
                                    },
                                    {
                                        "room_id": 103,
                                        "room_no": "103",
                                        "room_type": "Quad",
                                        "capacity": 4,
                                        "available_beds": 4,
                                        "occupied_beds": 0,
                                        "status": "available",
                                        "current_booking_id": None,
                                        "guest_names": [],
                                        "checkin_date": None,
                                        "checkout_date": None
                                    }
                                ]
                            }
                        ]
                    }
                }
            }
        },
        400: {
            'description': 'Bad Request - Missing required parameters',
            'content': {
                'application/json': {
                    'example': {
                        "error": "Missing required parameters",
                        "detail": "Required: 'hotel_id', 'date_from', 'date_to'. Optional: 'owner_organization'"
                    }
                }
            }
        },
        403: {
            'description': 'Forbidden - No access to this organization',
            'content': {
                'application/json': {
                    'example': {
                        "detail": "You don't have access to this organization."
                    }
                }
            }
        },
        404: {
            'description': 'Not Found - Hotel not found or inactive',
            'content': {
                'application/json': {
                    'example': {
                        "error": "Hotel not found or not active."
                    }
                }
            }
        }
    },
    tags=['Hotels']
)
class HotelAvailabilityAPIView(APIView):
    """
    GET /api/hotels/availability?hotel_id=123&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&owner_organization=10
    
    Display real-time hotel room and bed availability with visual floor map.
    Shows which rooms are occupied, partially occupied, or available.
    Includes room type breakdowns (quint, quad, triple, double) and sharing bed availability.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        hotel_id = request.query_params.get('hotel_id')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        owner_org_id = request.query_params.get('owner_organization')
        
        # Validate required parameters (owner_organization is optional for backward compatibility)
        if not all([hotel_id, date_from, date_to]):
            return Response({
                'error': "Missing required parameters",
                'detail': "Required: 'hotel_id', 'date_from', 'date_to'. Optional: 'owner_organization'"
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if user has access to this organization (unless superuser)
        if owner_org_id and not request.user.is_superuser:
            user_organizations = request.user.organizations.values_list('id', flat=True)
            if int(owner_org_id) not in user_organizations:
                raise PermissionDenied("You don't have access to this organization.")

        # Fetch hotel filtered by organization (if provided)
        try:
            if owner_org_id:
                hotel = Hotels.objects.get(id=hotel_id, organization_id=owner_org_id, is_active=True)
            else:
                hotel = Hotels.objects.get(id=hotel_id, is_active=True)
        except Hotels.DoesNotExist:
            return Response({
                'error': 'Hotel not found or not active.'
            }, status=status.HTTP_404_NOT_FOUND)

        # Fetch all rooms for this hotel with their details
        if owner_org_id:
            rooms = HotelRooms.objects.filter(
                hotel_id=hotel_id, 
                hotel__organization_id=owner_org_id
            ).prefetch_related('details').order_by('floor', 'room_number')
        else:
            rooms = HotelRooms.objects.filter(
                hotel_id=hotel_id
            ).prefetch_related('details').order_by('floor', 'room_number')
        
        # Count total rooms
        total_rooms = rooms.count()
        
        # Get room type breakdowns with proper naming (quint, quad, triple, double)
        room_type_counts = {
            'quint': {'total': 0, 'available': 0, 'occupied': 0},
            'quad': {'total': 0, 'available': 0, 'occupied': 0},
            'triple': {'total': 0, 'available': 0, 'occupied': 0},
            'double': {'total': 0, 'available': 0, 'occupied': 0},
            'single': {'total': 0, 'available': 0, 'occupied': 0},
        }
        
        for room in rooms:
            rt = room.room_type.lower()
            if rt not in room_type_counts:
                room_type_counts[rt] = {'total': 0, 'available': 0, 'occupied': 0}
            room_type_counts[rt]['total'] += 1
        
        # Build floors structure
        floors = {}
        available_rooms_count = 0
        occupied_rooms_count = 0
        total_available_beds = 0
        total_occupied_beds = 0
        total_available_sharing_beds = 0  # Track sharing beds separately
        
        for room in rooms:
            floor_no = room.floor
            
            # Initialize floor if not exists
            if floor_no not in floors:
                floors[floor_no] = {
                    'floor_no': floor_no,
                    'floor_map_url': f'/media/hotel_maps/{hotel_id}/floor_{floor_no}.png',  # CDN link
                    'rooms': []
                }
            
            # Get bed details for this room
            beds = room.details.all()
            total_beds_in_room = beds.count() or room.total_beds
            
            # Check bed availability by status field (AVAILABLE, OCCUPIED, etc.)
            # A bed is available if its status is 'AVAILABLE' and not assigned
            available_beds = beds.filter(
                status='AVAILABLE'
            ).count()
            
            # If no beds with status info, fallback to is_assigned field
            if total_beds_in_room > 0 and available_beds == 0 and beds.filter(status='AVAILABLE').count() == 0:
                # Check if using is_assigned instead
                available_beds = beds.filter(is_assigned=False, status__in=['AVAILABLE', '']).count()
            
            occupied_beds = total_beds_in_room - available_beds
            
            # Track totals
            total_available_beds += available_beds
            total_occupied_beds += occupied_beds
            
            # For sharing beds calculation (beds available for shared occupancy)
            # Typically applies to multi-bed rooms (triple, quad, quint, etc.)
            if room.room_type.lower() in ['triple', 'quad', 'quint', 'sharing'] and available_beds > 0:
                total_available_sharing_beds += available_beds
            
            # Determine room status
            if available_beds == 0:
                room_status = 'occupied'
                occupied_rooms_count += 1
            elif available_beds == total_beds_in_room:
                room_status = 'available'
                available_rooms_count += 1
            else:
                room_status = 'partially_occupied'
                occupied_rooms_count += 1  # Partially occupied counts as occupied
            
            # Update room type counts
            rt = room.room_type.lower()
            if room_status == 'available':
                room_type_counts[rt]['available'] += 1
            else:
                room_type_counts[rt]['occupied'] += 1
            
            # Find current booking for this room in the date range
            guest_names = []
            current_booking_id = None
            checkin_date = None
            checkout_date = None
            
            # Query bookings that overlap with the requested date range
            booking_details = BookingHotelDetails.objects.filter(
                hotel_id=hotel_id,
                room_type=room.room_type,
                check_in_date__lte=date_to,
                check_out_date__gte=date_from
            ).select_related('booking').prefetch_related('booking__pax_details')
            
            if booking_details.exists():
                booking_detail = booking_details.first()
                current_booking_id = booking_detail.booking_id
                checkin_date = str(booking_detail.check_in_date) if booking_detail.check_in_date else None
                checkout_date = str(booking_detail.check_out_date) if booking_detail.check_out_date else None
                
                # Get guest names from PAX details
                pax_details = BookingPersonDetail.objects.filter(booking_id=booking_detail.booking_id)
                guest_names = [f"{p.first_name} {p.last_name}" for p in pax_details if p.first_name]
            
            # Build room data
            room_data = {
                'room_id': room.id,
                'room_no': room.room_number,
                'room_type': room.room_type,
                'capacity': total_beds_in_room,
                'available_beds': available_beds,
                'occupied_beds': occupied_beds,
                'status': room_status,
                'current_booking_id': current_booking_id,
                'guest_names': guest_names,
                'checkin_date': checkin_date,
                'checkout_date': checkout_date
            }
            
            floors[floor_no]['rooms'].append(room_data)
        
        # Build final response matching documented structure
        response_data = {
            'hotel_id': hotel.id,
            'hotel_name': hotel.name,
            'total_rooms': total_rooms,
            'available_rooms': available_rooms_count,
            'occupied_rooms': occupied_rooms_count,
            'available_beds': total_available_beds,
            'available_sharing_beds': total_available_sharing_beds,  # Sharing bed availability
            'floors': sorted(floors.values(), key=lambda x: x['floor_no'])
        }
        
        # Add room type breakdowns with proper naming
        for room_type, counts in room_type_counts.items():
            response_data[f'total_{room_type}_rooms'] = counts['total']
            response_data[f'available_{room_type}_rooms'] = counts['available']
        
        return Response(response_data, status=status.HTTP_200_OK)
