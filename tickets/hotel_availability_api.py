from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q, Count, Sum
from django.utils import timezone
from tickets.models import Hotels, HotelRooms, RoomDetails
from booking.models import BookingHotelDetails, BookingPersonDetail

class HotelAvailabilityAPIView(APIView):
    """
    GET /api/hotels/availability?hotel_id=123&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&owner_organization=10
    
    Display real-time hotel room and bed availability with visual floor map.
    Shows which rooms are occupied, partially occupied, or available.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        hotel_id = request.query_params.get('hotel_id')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        owner_org_id = request.query_params.get('owner_organization')
        
        # Validate required parameters
        if not all([hotel_id, date_from, date_to, owner_org_id]):
            return Response({
                'error': "Missing required parameters",
                'detail': "Required: 'owner_organization', 'hotel_id', 'date_from', 'date_to'"
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if user has access to this organization (unless superuser)
        if not request.user.is_superuser:
            user_organizations = request.user.organizations.values_list('id', flat=True)
            if int(owner_org_id) not in user_organizations:
                raise PermissionDenied("You don't have access to this organization.")

        # Fetch hotel filtered by organization
        try:
            hotel = Hotels.objects.get(id=hotel_id, organization_id=owner_org_id, is_active=True)
        except Hotels.DoesNotExist:
            return Response({
                'error': 'Hotel not found or not accessible for this organization.'
            }, status=status.HTTP_404_NOT_FOUND)

        # Fetch all rooms for this hotel with their details
        rooms = HotelRooms.objects.filter(
            hotel_id=hotel_id, 
            hotel__organization_id=owner_org_id
        ).prefetch_related('details').order_by('floor', 'room_number')
        
        # Count total rooms
        total_rooms = rooms.count()
        
        # Get room type breakdowns
        room_type_counts = {}
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
            available_beds = beds.filter(is_assigned=False).count()
            occupied_beds = total_beds_in_room - available_beds
            
            # Track totals
            total_available_beds += available_beds
            total_occupied_beds += occupied_beds
            
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
        
        # Build final response
        response_data = {
            'hotel_id': hotel.id,
            'hotel_name': hotel.name,
            'total_rooms': total_rooms,
            'available_rooms': available_rooms_count,
            'occupied_rooms': occupied_rooms_count,
            'available_beds': total_available_beds,
            'occupied_beds': total_occupied_beds,
            'floors': sorted(floors.values(), key=lambda x: x['floor_no'])
        }
        
        # Add room type breakdowns
        for room_type, counts in room_type_counts.items():
            response_data[f'total_{room_type}_rooms'] = counts['total']
            response_data[f'available_{room_type}_rooms'] = counts['available']
            response_data[f'occupied_{room_type}_rooms'] = counts['occupied']
        
        return Response(response_data, status=status.HTTP_200_OK)
