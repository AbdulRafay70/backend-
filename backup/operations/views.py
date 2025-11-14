from rest_framework import viewsets, status as status_code
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q, Count
from django.utils import timezone
from datetime import datetime
from collections import defaultdict
from django.db import transaction
from django.shortcuts import get_object_or_404

from .models import RoomMap, HotelOperation, TransportOperation, FoodOperation, AirportOperation, ZiyaratOperation, OperationLog
from .serializers import (
    RoomMapSerializer,
    RoomMapListSerializer,
    RoomAvailabilitySerializer,
    HotelOperationSerializer,
    HotelOperationListSerializer,
    HotelStatusUpdateSerializer,
    BulkHotelOperationCreateSerializer,
    DailyHotelOperationResponseSerializer,
    TransportOperationSerializer,
    TransportOperationListSerializer,
    TransportStatusUpdateSerializer,
    BulkTransportOperationCreateSerializer,
    FoodOperationSerializer,
    FoodOperationListSerializer,
    FoodStatusUpdateSerializer,
    BulkFoodOperationCreateSerializer,
    AirportOperationSerializer,
    AirportOperationListSerializer,
    AirportStatusUpdateSerializer,
    BulkAirportOperationCreateSerializer,
    ZiyaratOperationSerializer,
    ZiyaratOperationListSerializer,
    ZiyaratStatusUpdateSerializer,
    BulkZiyaratOperationCreateSerializer,
    PaxDetailSerializer,
    PaxFullDetailSerializer
)
from .serializers import AssignRoomSerializer
from .serializers import HotelRoomMapSerializer
from .serializers import SetRoomStatusSerializer
from rest_framework.permissions import IsAdminUser
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiResponse, OpenApiParameter, OpenApiTypes
from booking.models import Booking, BookingPersonDetail, VehicleType


@extend_schema_view(
    list=extend_schema(
        summary="List Room Maps",
        description="Get list of all room mappings with filters for hotel, floor, availability status",
        parameters=[
            OpenApiParameter(name="hotel_id", type=OpenApiTypes.INT, location=OpenApiParameter.QUERY, description="Filter by hotel ID"),
            OpenApiParameter(name="floor_no", type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description="Filter by floor number"),
            OpenApiParameter(name="availability_status", type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description="Filter by availability status"),
        ],
    ),
    create=extend_schema(
        summary="Create Room Map",
        description="Create a new room mapping for hotel inventory management"
    ),
    retrieve=extend_schema(
        summary="Get Room Map Details",
        description="Retrieve detailed information about a specific room"
    ),
    update=extend_schema(
        summary="Update Room Map",
        description="Update room mapping details"
    ),
    partial_update=extend_schema(
        summary="Partial Update Room Map",
        description="Partially update room mapping details"
    ),
    destroy=extend_schema(
        summary="Delete Room Map",
        description="Delete a room mapping"
    ),
)
class RoomMapViewSet(viewsets.ModelViewSet):
    @action(detail=False, methods=['get'], url_path='availability')
    def availability(self, request):
        hotel_id = request.query_params.get('hotel_id')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        organization_id = request.query_params.get('organization')
        if not hotel_id or not date_from or not date_to or not organization_id:
            return Response({'detail': "Missing 'organization', 'hotel_id', 'date_from', or 'date_to' query parameter."}, status=status_code.HTTP_400_BAD_REQUEST)

        # Fetch hotel
        from tickets.models import Hotels, HotelRooms, RoomDetails
        from booking.models import BookingHotelDetails, BookingPersonDetail
        hotel = Hotels.objects.filter(id=hotel_id, organization_id=organization_id).first()
        if not hotel:
            return Response({'error': 'Hotel not found or not accessible for this organization.'}, status=status_code.HTTP_404_NOT_FOUND)

        # Fetch rooms and beds
        rooms = HotelRooms.objects.filter(hotel_id=hotel_id, hotel__organization_id=organization_id).prefetch_related('details')
        total_rooms = rooms.count()
        room_type_counts = rooms.values('room_type').annotate(count=Count('id'))
        floors = {}
        for room in rooms:
            floor_no = room.floor
            if floor_no not in floors:
                floors[floor_no] = {
                    'floor_no': floor_no,
                    'floor_map_url': '',  # Add logic for map URL if available
                    'rooms': []
                }
            beds = room.details.all()
            available_beds = beds.filter(is_assigned=False).count()
            guest_names = []
            current_booking_id = None
            checkin_date = None
            checkout_date = None
            booking_detail = BookingHotelDetails.objects.filter(
                hotel_id=hotel_id,
                room_type=room.room_type,
                check_in_date__lte=date_to,
                check_out_date__gte=date_from
            ).first()
            if booking_detail:
                current_booking_id = booking_detail.booking_id
                checkin_date = booking_detail.check_in_date
                checkout_date = booking_detail.check_out_date
                pax_details = BookingPersonDetail.objects.filter(booking_id=booking_detail.booking_id)
                guest_names = [f"{p.first_name} {p.last_name}" for p in pax_details]
            status = 'available'
            if available_beds == 0:
                status = 'occupied'
            elif available_beds < room.total_beds:
                status = 'partially_occupied'
            floors[floor_no]['rooms'].append({
                'room_id': room.id,
                'room_no': room.room_number,
                'room_type': room.room_type,
                'capacity': room.total_beds,
                'available_beds': available_beds,
                'status': status,
                'current_booking_id': current_booking_id,
                'guest_names': guest_names,
                'checkin_date': checkin_date,
                'checkout_date': checkout_date
            })
        available_rooms = sum(1 for r in rooms if any(b.is_assigned==False for b in r.details.all()))
        occupied_rooms = total_rooms - available_rooms
        available_beds = sum(beds.filter(is_assigned=False).count() for beds in [r.details.all() for r in rooms])
        response = {
            'hotel_id': hotel.id,
            'hotel_name': hotel.name,
            'total_rooms': total_rooms,
            'available_rooms': available_rooms,
            'occupied_rooms': occupied_rooms,
            'available_beds': available_beds,
            'floors': list(floors.values())
        }
        for rt in room_type_counts:
            response[f"total_{rt['room_type'].lower()}-rooms"] = rt['count']
            response[f"available_{rt['room_type'].lower()}-rooms"] = sum(1 for r in rooms if r.room_type==rt['room_type'] and any(b.is_assigned==False for b in r.details.all()))
        return Response(response)

    @extend_schema(request=AssignRoomSerializer, responses={200: HotelOperationSerializer})
    @action(detail=False, methods=['post'], url_path='assign-room')
    def assign_room(self, request):
        """Assign a pax to a specific room/bed atomically.

        Expected JSON body:
        {
          "booking_id": 5024,
          "hotel_id": 123,
          "pax_id": 987,
          "room_id": 102,
          "bed_no": 2,
          "assigned_by": "admin_001",
          "checkin_date": "2025-10-17",
          "checkout_date": "2025-10-21"
        }
        """
        data = request.data or {}
        required = ["booking_id", "hotel_id", "pax_id", "room_id", "bed_no", "checkin_date", "checkout_date"]
        missing = [f for f in required if not data.get(f) and data.get(f) != 0]
        if missing:
            return Response({"detail": f"Missing fields: {', '.join(missing)}"}, status=status_code.HTTP_400_BAD_REQUEST)

        booking_id = data.get("booking_id")
        hotel_id = data.get("hotel_id")
        pax_id = data.get("pax_id")
        room_id = data.get("room_id")
        bed_no = str(data.get("bed_no"))
        checkin_date = data.get("checkin_date")
        checkout_date = data.get("checkout_date")

        # Validate booking and pax
        booking = get_object_or_404(Booking, pk=booking_id)
        pax = BookingPersonDetail.objects.filter(pk=pax_id, booking_id=booking_id).first()
        if not pax:
            return Response({"detail": "Pax not found or does not belong to booking"}, status=status_code.HTTP_404_NOT_FOUND)

        # Resolve hotel and room
        from tickets.models import Hotels, HotelRooms, RoomDetails

        hotel = Hotels.objects.filter(id=hotel_id).first()
        if not hotel:
            return Response({"detail": "Hotel not found"}, status=status_code.HTTP_404_NOT_FOUND)

        # Try to find HotelRooms by id
        hotel_room = HotelRooms.objects.filter(pk=room_id, hotel_id=hotel_id).first()
        # Fallback: room_id might be a RoomMap id; try to map
        if not hotel_room:
            # attempt fallback via RoomMap -> match room_no
            roommap = RoomMap.objects.filter(pk=room_id, hotel_id=hotel_id).first()
            if roommap:
                hotel_room = HotelRooms.objects.filter(hotel_id=hotel_id, room_number=roommap.room_no).first()

        if not hotel_room:
            return Response({"detail": "Room not found for this hotel"}, status=status_code.HTTP_404_NOT_FOUND)

        # Atomic assign
        try:
            with transaction.atomic():
                bed = RoomDetails.objects.select_for_update().filter(room=hotel_room, bed_number=bed_no).first()
                if not bed:
                    return Response({"detail": "Bed not found in specified room"}, status=status_code.HTTP_404_NOT_FOUND)
                if bed.is_assigned:
                    return Response({"detail": "Bed already assigned"}, status=status_code.HTTP_409_CONFLICT)

                # mark bed assigned
                bed.is_assigned = True
                bed.save()

                # Create HotelOperation record
                roommap = RoomMap.objects.filter(hotel_id=hotel_id, room_no=hotel_room.room_number).first()
                op = HotelOperation.objects.create(
                    booking=booking,
                    pax=pax,
                    pax_id_str=str(pax.id),
                    pax_first_name=pax.first_name or '',
                    pax_last_name=pax.last_name or '',
                    booking_id_str=str(booking.id),
                    hotel=hotel,
                    hotel_name=hotel.name,
                    city=hotel.city.name if getattr(hotel, 'city', None) else '',
                    room=roommap,
                    room_no=hotel_room.room_number,
                    bed_no=bed_no,
                    date=checkin_date,
                    check_in_date=checkin_date,
                    check_out_date=checkout_date,
                    status='checked_in',
                    created_by=request.user if request.user and request.user.is_authenticated else None,
                    updated_by=request.user if request.user and request.user.is_authenticated else None,
                )

                # mark the RoomMap occupied to sync views
                if roommap:
                    roommap.mark_occupied()

        except Exception as e:
            return Response({"detail": f"Error assigning bed: {str(e)}"}, status=status_code.HTTP_500_INTERNAL_SERVER_ERROR)

        assigned_details = {
            "room_id": hotel_room.id,
            "room_no": hotel_room.room_number,
            "bed_no": bed.bed_number,
            "pax_id": pax.id,
            "hotel_id": hotel.id,
            "status": "occupied",
        }

        return Response({"success": True, "message": "Room assigned successfully", "assigned_details": assigned_details})
    """
    ViewSet for managing hotel room inventory (RoomMap).
    
    Endpoints:
    - GET /api/room-map/ - List all rooms (with filters)
    - POST /api/room-map/ - Create new room
    - GET /api/room-map/{id}/ - Get specific room details
    - PUT/PATCH /api/room-map/{id}/ - Update room details
    - DELETE /api/room-map/{id}/ - Delete room
    - GET /api/room-map/by-hotel/?hotel_id=X - List rooms by hotel
    - GET /api/room-map/available/?hotel_id=X - List available rooms
    - POST /api/room-map/{id}/mark-occupied/ - Mark room as occupied
    - POST /api/room-map/{id}/mark-available/ - Mark room as available
    """
    
    queryset = RoomMap.objects.all()
    serializer_class = RoomMapSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter queryset based on query parameters.
        Supports filtering by hotel_id, floor_no, availability_status, room_type
        """
        queryset = RoomMap.objects.select_related('hotel', 'hotel__city', 'created_by')
        
        # Filter by hotel
        hotel_id = self.request.query_params.get('hotel_id')
        if hotel_id:
            queryset = queryset.filter(hotel_id=hotel_id)
        
        # Filter by floor
        floor_no = self.request.query_params.get('floor_no')
        if floor_no:
            queryset = queryset.filter(floor_no=floor_no)
        
        # Filter by availability status
        availability = self.request.query_params.get('availability_status')
        if availability:
            queryset = queryset.filter(availability_status=availability)
        
        # Filter by room type
        room_type = self.request.query_params.get('room_type')
        if room_type:
            queryset = queryset.filter(room_type__icontains=room_type)
        
        # Filter by minimum beds
        min_beds = self.request.query_params.get('min_beds')
        if min_beds:
            queryset = queryset.filter(beds__gte=int(min_beds))
        
        # Search by room number
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(room_no__icontains=search) | 
                Q(hotel__name__icontains=search)
            )
        
        # Date filtering - created_at
        created_after = self.request.query_params.get('created_after')
        if created_after:
            queryset = queryset.filter(created_at__gte=created_after)
        
        created_before = self.request.query_params.get('created_before')
        if created_before:
            queryset = queryset.filter(created_at__lte=created_before)
        
        # Date filtering - updated_at
        updated_after = self.request.query_params.get('updated_after')
        if updated_after:
            queryset = queryset.filter(updated_at__gte=updated_after)
        
        updated_before = self.request.query_params.get('updated_before')
        if updated_before:
            queryset = queryset.filter(updated_at__lte=updated_before)
        
        # Specific date filter (for exact day)
        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(created_at__date=date)
        
        return queryset.order_by('hotel__name', 'floor_no', 'room_no')
    
    def get_serializer_class(self):
        """Use lightweight serializer for list view"""
        if self.action == 'list':
            return RoomMapListSerializer
        return RoomMapSerializer
    
    def perform_create(self, serializer):
        """Set created_by to current user on create"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'], url_path='by-hotel')
    def by_hotel(self, request):
        """
        GET /api/room-map/by-hotel/?hotel_id=X
        
        List all rooms for a specific hotel with summary stats.
        """
        hotel_id = request.query_params.get('hotel_id')
        
        if not hotel_id:
            return Response(
                {"error": "hotel_id parameter is required"},
                status=status_code.HTTP_400_BAD_REQUEST
            )
        
        rooms = RoomMap.objects.filter(hotel_id=hotel_id).select_related('hotel')
        
        if not rooms.exists():
            return Response(
                {"error": f"No rooms found for hotel_id={hotel_id}"},
                status=status_code.HTTP_404_NOT_FOUND
            )
        
        # Get summary statistics
        summary = rooms.aggregate(
            total_rooms=Count('id'),
            available_rooms=Count('id', filter=Q(availability_status='available')),
            occupied_rooms=Count('id', filter=Q(availability_status='occupied')),
            maintenance_rooms=Count('id', filter=Q(availability_status='maintenance'))
        )
        
        serializer = RoomMapListSerializer(rooms, many=True)
        
        response_data = {
            'hotel_id': int(hotel_id),
            'hotel_name': rooms.first().hotel.name if rooms.exists() else '',
            'summary': summary,
            'rooms': serializer.data
        }
        
        return Response(response_data, status=status_code.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], url_path='available')
    def available_rooms(self, request):
        """
        GET /api/room-map/available/?hotel_id=X&floor_no=Y&min_beds=Z
        
        List all available rooms with optional filters.
        """
        hotel_id = request.query_params.get('hotel_id')
        floor_no = request.query_params.get('floor_no')
        min_beds = request.query_params.get('min_beds')
        
        if not hotel_id:
            return Response(
                {"error": "hotel_id parameter is required"},
                status=status_code.HTTP_400_BAD_REQUEST
            )
        
        queryset = RoomMap.objects.filter(
            hotel_id=hotel_id,
            availability_status='available'
        ).select_related('hotel')
        
        if floor_no:
            queryset = queryset.filter(floor_no=floor_no)
        
        if min_beds:
            queryset = queryset.filter(beds__gte=int(min_beds))
        
        serializer = RoomMapListSerializer(queryset, many=True)
        
        return Response({
            'hotel_id': int(hotel_id),
            'available_count': queryset.count(),
            'rooms': serializer.data
        }, status=status_code.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], url_path='mark-occupied')
    def mark_occupied(self, request, pk=None):
        """
        POST /api/room-map/{id}/mark-occupied/
        
        Mark a room as occupied.
        """
        room = self.get_object()
        
        if room.availability_status == 'occupied':
            return Response(
                {"message": "Room is already marked as occupied"},
                status=status_code.HTTP_200_OK
            )
        
        room.mark_occupied()
        serializer = self.get_serializer(room)
        
        return Response({
            "message": f"Room {room.room_no} marked as occupied",
            "data": serializer.data
        }, status=status_code.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], url_path='mark-available')
    def mark_available(self, request, pk=None):
        """
        POST /api/room-map/{id}/mark-available/
        
        Mark a room as available.
        """
        room = self.get_object()
        
        if room.availability_status == 'available':
            return Response(
                {"message": "Room is already marked as available"},
                status=status_code.HTTP_200_OK
            )
        
        room.mark_available()
        serializer = self.get_serializer(room)
        
        return Response({
            "message": f"Room {room.room_no} marked as available",
            "data": serializer.data
        }, status=status_code.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='cleaning-done')
    def cleaning_done(self, request, pk=None):
        """Housekeeping endpoint: mark cleaning done and set room available."""
        room = self.get_object()

        # call service to mark room available (keeps service boundary)
        try:
            from . import services as ops_services
            ops_services.mark_room_available(room, user=request.user if request.user and request.user.is_authenticated else None)
        except Exception as e:
            return Response({"detail": f"Error marking cleaning done: {str(e)}"}, status=status_code.HTTP_500_INTERNAL_SERVER_ERROR)

        # audit log for housekeeping
        import logging
        logger = logging.getLogger('operations.roommap.audit')
        logger.info('cleaning_done', extra={
            'room_id': room.id,
            'hotel_id': room.hotel_id,
            'changed_by': getattr(request.user, 'id', None),
            'changed_by_username': getattr(request.user, 'username', None),
            'prev_status': 'cleaning_pending',
            'new_status': 'available',
        })

        # persist audit to DB and update HotelOperation housekeeping flag
        try:
            OperationLog.objects.create(
                action='cleaning_done',
                room=room,
                hotel_id=room.hotel_id,
                performed_by=request.user if request.user and request.user.is_authenticated else None,
                performed_by_username=getattr(request.user, 'username', None),
                prev_status='cleaning_pending',
                new_status='available',
            )
        except Exception:
            pass

        try:
            ops = HotelOperation.objects.filter(room=room, status='checked_out', housekeeping_done=False)
            for op in ops:
                op.housekeeping_done = True
                note = (op.notes or '') + f"\nHousekeeping: cleaning_done by {getattr(request.user,'username', 'system')}"
                op.notes = note
                op.save()
        except Exception:
            pass

        serializer = self.get_serializer(room)
        return Response({
            "message": f"Room {room.room_no} marked as available after cleaning",
            "data": serializer.data
        }, status=status_code.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='set-status', permission_classes=[IsAuthenticated, IsAdminUser])
    def set_status(self, request, pk=None):
        """Manual override to set room availability status with audit logging."""
        room = self.get_object()
        serializer = SetRoomStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['status']
        reason = serializer.validated_data.get('reason', '')

        prev_status = room.availability_status
        room.availability_status = new_status
        # record who updated
        try:
            room.updated_by = request.user
        except Exception:
            pass
        room.save()

        import logging
        logger = logging.getLogger('operations.roommap.audit')
        logger.info('room_status_override', extra={
            'room_id': room.id,
            'hotel_id': room.hotel_id,
            'changed_by': getattr(request.user, 'id', None),
            'changed_by_username': getattr(request.user, 'username', None),
            'prev_status': prev_status,
            'new_status': new_status,
            'reason': reason,
        })

        # persist audit to DB
        try:
            OperationLog.objects.create(
                action='manual_override',
                room=room,
                hotel_id=room.hotel_id,
                performed_by=request.user if request.user and request.user.is_authenticated else None,
                performed_by_username=getattr(request.user, 'username', None),
                prev_status=prev_status,
                new_status=new_status,
                reason=reason,
            )
        except Exception:
            pass

        return Response({
            'success': True,
            'room_id': room.id,
            'prev_status': prev_status,
            'new_status': new_status,
            'reason': reason
        }, status=status_code.HTTP_200_OK)
    
    @action(detail=False, methods=['post'], url_path='bulk-update-status')
    def bulk_update_status(self, request):
        """
        POST /api/room-map/bulk-update-status/
        
        Body:
        {
            "room_ids": [1, 2, 3],
            "status": "available"
        }
        
        Bulk update status for multiple rooms.
        """
        room_ids = request.data.get('room_ids', [])
        new_status = request.data.get('status')
        
        if not room_ids or not new_status:
            return Response(
                {"error": "room_ids and status are required"},
                status=status_code.HTTP_400_BAD_REQUEST
            )
        
        valid_statuses = ['available', 'occupied', 'maintenance', 'reserved', 'blocked']
        if new_status not in valid_statuses:
            return Response(
                {"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"},
                status=status_code.HTTP_400_BAD_REQUEST
            )
        
        updated_count = RoomMap.objects.filter(id__in=room_ids).update(
            availability_status=new_status
        )
        
        return Response({
            "message": f"Updated {updated_count} room(s) to status '{new_status}'",
            "updated_count": updated_count
        }, status=status_code.HTTP_200_OK)


class HotelRoomMapAPIView(APIView):
    """POST /api/hotels/room-map

    Accepts the nested payload to create/update floor map, rooms and beds.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        serializer = HotelRoomMapSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        from tickets.models import HotelRooms, RoomDetails, Hotels
        hotel = Hotels.objects.get(id=data['hotel_id'])

        created_rooms = 0
        updated_rooms = 0
        created_beds = 0
        updated_beds = 0

        # Basic payload validation: duplicate room numbers, duplicate bed numbers and capacity consistency
        rooms_list = data.get('rooms', []) or []
        # check duplicate room numbers in payload
        room_numbers = [r.get('room_no') for r in rooms_list]
        if len(set(room_numbers)) != len(room_numbers):
            # find duplicates for better error message
            seen = set()
            dups = []
            for rn in room_numbers:
                if rn in seen and rn not in dups:
                    dups.append(rn)
                seen.add(rn)
            return Response({'detail': f"Duplicate room numbers in payload: {', '.join([str(d) for d in dups])}"}, status=status_code.HTTP_400_BAD_REQUEST)

        for room_payload in rooms_list:
            room_no = room_payload.get('room_no')
            # capacity must be a positive integer
            capacity = room_payload.get('capacity')
            try:
                capacity_int = int(capacity)
            except Exception:
                return Response({'detail': f"Invalid capacity for room {room_no}: must be an integer"}, status=status_code.HTTP_400_BAD_REQUEST)
            if capacity_int < 1:
                return Response({'detail': f"Invalid capacity for room {room_no}: must be >= 1"}, status=status_code.HTTP_400_BAD_REQUEST)

            bed_list = room_payload.get('beds', []) or []
            bed_numbers = [str(b.get('bed_no')) for b in bed_list]
            # duplicate bed numbers in room payload
            if len(set(bed_numbers)) != len(bed_numbers):
                return Response({'detail': f"Duplicate bed numbers found in room {room_no}"}, status=status_code.HTTP_400_BAD_REQUEST)
            # capacity vs beds equality (must match)
            if len(bed_numbers) != capacity_int:
                return Response({'detail': f"Capacity mismatch for room {room_no}: capacity={capacity_int} but {len(bed_numbers)} beds provided"}, status=status_code.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                floor_no = data.get('floor_no')

                for room_payload in data.get('rooms', []):
                    room_no = room_payload['room_no']
                    capacity = room_payload['capacity']
                    room_type = room_payload.get('room_type', '')

                    # Upsert RoomMap entry
                    roommap_obj, created = RoomMap.objects.update_or_create(
                        hotel=hotel,
                        room_no=room_no,
                        defaults={
                            'floor_no': floor_no,
                            'beds': capacity,
                            'room_type': room_type,
                            'created_by': request.user
                        }
                    )
                    if created:
                        created_rooms += 1
                    else:
                        updated_rooms += 1

                    # Upsert canonical HotelRooms
                    hotel_room_obj, hr_created = HotelRooms.objects.get_or_create(
                        hotel=hotel,
                        room_number=room_no,
                        defaults={'floor': floor_no, 'room_type': room_type, 'total_beds': capacity}
                    )
                    if not hr_created:
                        # Ensure totalsync
                        hotel_room_obj.floor = floor_no
                        hotel_room_obj.room_type = room_type
                        hotel_room_obj.total_beds = capacity
                        hotel_room_obj.save()

                    # Beds
                    for bed_payload in room_payload.get('beds', []):
                        bed_no = str(bed_payload['bed_no'])
                        status = bed_payload.get('status', 'available')
                        is_assigned = True if status.lower() in ['occupied', 'assigned'] else False

                        bed_obj, bed_created = RoomDetails.objects.get_or_create(
                            room=hotel_room_obj,
                            bed_number=bed_no,
                            defaults={'is_assigned': is_assigned}
                        )
                        if bed_created:
                            created_beds += 1
                        else:
                            # Update status if changed
                            prev = bed_obj.is_assigned
                            if prev != is_assigned:
                                bed_obj.is_assigned = is_assigned
                                bed_obj.save()
                                updated_beds += 1

        except Exception as e:
            return Response({'detail': f'Error processing payload: {str(e)}'}, status=status_code.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'success': True,
            'hotel_id': hotel.id,
            'floor_no': data.get('floor_no'),
            'rooms_created': created_rooms,
            'rooms_updated': updated_rooms,
            'beds_created': created_beds,
            'beds_updated': updated_beds
        }, status=status_code.HTTP_200_OK)


@extend_schema_view(
    list=extend_schema(
        summary="List Hotel Operations",
        description="Get daily hotel check-in/check-out operations with filtering by date, status, hotel, city",
        parameters=[
            OpenApiParameter(name="date", type=OpenApiTypes.DATE, location=OpenApiParameter.QUERY, description="Filter by operation date (YYYY-MM-DD)"),
            OpenApiParameter(name="type", type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description="Filter by operation type: 'checkin' or 'checkout'", enum=['checkin', 'checkout']),
            OpenApiParameter(name="hotel_id", type=OpenApiTypes.INT, location=OpenApiParameter.QUERY, description="Filter by hotel ID"),
            OpenApiParameter(name="city", type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description="Filter by city (Makkah, Madinah)"),
            OpenApiParameter(name="status", type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description="Filter by status", enum=['pending', 'checked_in', 'checked_out', 'canceled']),
            OpenApiParameter(name="check_in_date", type=OpenApiTypes.DATE, location=OpenApiParameter.QUERY, description="Filter by check-in date"),
            OpenApiParameter(name="check_out_date", type=OpenApiTypes.DATE, location=OpenApiParameter.QUERY, description="Filter by check-out date"),
        ],
    ),
    create=extend_schema(
        summary="Create Hotel Operation",
        description="Create a new hotel operation for passenger check-in/check-out tracking"
    ),
    retrieve=extend_schema(
        summary="Get Hotel Operation Details",
        description="Retrieve detailed information about a specific hotel operation"
    ),
    update=extend_schema(
        summary="Update Hotel Operation",
        description="Update hotel operation details"
    ),
    partial_update=extend_schema(
        summary="Partial Update Hotel Operation",
        description="Partially update hotel operation details"
    ),
    destroy=extend_schema(
        summary="Delete Hotel Operation",
        description="Delete a hotel operation"
    ),
)
class HotelOperationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing daily hotel check-in/check-out operations.
    
    Main Endpoints:
    - GET /api/daily/hotels/?date=YYYY-MM-DD&type=checkin|checkout - List operations by date (grouped)
    - POST /api/daily/hotels/ - Create new hotel operation
    - GET /api/daily/hotels/{id}/ - Get specific operation details
    - PUT/PATCH /api/daily/hotels/{id}/ - Update operation
    - DELETE /api/daily/hotels/{id}/ - Delete operation
    
    Custom Actions:
    - PUT /api/daily/hotels/update-status/ - Update status for specific pax
    - POST /api/daily/hotels/bulk-create/ - Create operations for all pax in a booking
    - GET /api/daily/hotels/by-booking/?booking_id=X - List operations by booking
    - GET /api/daily/hotels/pending/ - List pending operations
    - GET /api/daily/hotels/statistics/ - Get operation statistics
    """
    
    queryset = HotelOperation.objects.all()
    serializer_class = HotelOperationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter queryset based on query parameters with date filtering support.
        """
        # Check if user is superuser
        if self.request.user.is_superuser:
            # Superadmin can see all hotel operations
            queryset = HotelOperation.objects.select_related(
                'booking',
                'pax',
                'hotel',
                'room',
                'created_by',
                'updated_by'
            )
        else:
            # Get organization from query parameter or user's group
            organization_id = self.request.query_params.get("organization")
            
            if not organization_id:
                # Try to get organization from user's group
                user_group = self.request.user.groups.first()
                if user_group and hasattr(user_group, 'extended'):
                    organization_id = user_group.extended.organization_id
                else:
                    raise PermissionDenied("Missing 'organization' query parameter and user has no organization assigned.")

            # Validate user has access to this organization
            user_orgs = []
            for group in self.request.user.groups.all():
                if hasattr(group, 'extended') and group.extended.organization:
                    user_orgs.append(group.extended.organization.id)
            
            if int(organization_id) not in user_orgs and not self.request.user.is_superuser:
                raise PermissionDenied("You don't have access to this organization.")

            queryset = HotelOperation.objects.filter(
                hotel__organization_id=organization_id
            ).select_related(
                'booking',
                'pax',
                'hotel',
                'room',
                'created_by',
                'updated_by'
            )
        
        # Date filtering - primary date field
        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(date=date)
        
        # Date range filtering
        date_after = self.request.query_params.get('date_after')
        if date_after:
            queryset = queryset.filter(date__gte=date_after)
        
        date_before = self.request.query_params.get('date_before')
        if date_before:
            queryset = queryset.filter(date__lte=date_before)
        
        # Check-in date filtering
        check_in_date = self.request.query_params.get('check_in_date')
        if check_in_date:
            queryset = queryset.filter(check_in_date=check_in_date)
        
        check_in_after = self.request.query_params.get('check_in_after')
        if check_in_after:
            queryset = queryset.filter(check_in_date__gte=check_in_after)
        
        check_in_before = self.request.query_params.get('check_in_before')
        if check_in_before:
            queryset = queryset.filter(check_in_date__lte=check_in_before)
        
        # Check-out date filtering
        check_out_date = self.request.query_params.get('check_out_date')
        if check_out_date:
            queryset = queryset.filter(check_out_date=check_out_date)
        
        check_out_after = self.request.query_params.get('check_out_after')
        if check_out_after:
            queryset = queryset.filter(check_out_date__gte=check_out_after)
        
        check_out_before = self.request.query_params.get('check_out_before')
        if check_out_before:
            queryset = queryset.filter(check_out_date__lte=check_out_before)
        
        # Filter by operation type (check-in or check-out)
        operation_type = self.request.query_params.get('type')
        if operation_type == 'checkin' and date:
            queryset = queryset.filter(check_in_date=date)
        elif operation_type == 'checkout' and date:
            queryset = queryset.filter(check_out_date=date)
        
        # Filter by booking
        booking_id = self.request.query_params.get('booking_id')
        if booking_id:
            queryset = queryset.filter(Q(booking_id_str=booking_id) | Q(booking__booking_reference=booking_id))
        
        # Filter by pax
        pax_id = self.request.query_params.get('pax_id')
        if pax_id:
            queryset = queryset.filter(pax_id_str=pax_id)
        
        # Filter by hotel
        hotel_id = self.request.query_params.get('hotel_id')
        if hotel_id:
            queryset = queryset.filter(hotel_id=hotel_id)
        
        # Filter by city
        city = self.request.query_params.get('city')
        if city:
            queryset = queryset.filter(city__icontains=city)
        
        # Filter by status
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Search by pax name or booking ID
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(pax_first_name__icontains=search) |
                Q(pax_last_name__icontains=search) |
                Q(booking_id_str__icontains=search) |
                Q(pax_id_str__icontains=search)
            )
        
        return queryset.order_by('date', 'hotel', 'booking')
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return HotelOperationListSerializer
        return HotelOperationSerializer
    
    def perform_create(self, serializer):
        """Set created_by user on create"""
        serializer.save(created_by=self.request.user)
    
    def perform_update(self, serializer):
        """Set updated_by user on update"""
        serializer.save(updated_by=self.request.user)
    
    def list(self, request, *args, **kwargs):
        """
        List hotel operations with grouping by booking and hotel.
        
        Query params:
        - date: YYYY-MM-DD (required)
        - type: checkin|checkout (optional - filter by check-in or check-out date)
        
        Returns grouped format:
        {
            "date": "2025-10-17",
            "hotels": [
                {
                    "booking_id": "BKG-101",
                    "Contact no of family head": "+92300-0709017",
                    "hotel_name": "Hilton Makkah",
                    "city": "Makkah",
                    "check_in": "2025-10-17",
                    "check_out": "2025-10-20",
                    "status": "checked_in",
                    "pax_list": [
                        {
                            "pax_id": "PAX001",
                            "first_name": "Ali",
                            "last_name": "Raza",
                            "Contact no of pex": "+92300-0709017",
                            "room_no": "204",
                            "bed_no": "B1"
                        }
                    ]
                }
            ]
        }
        """
        date = request.query_params.get('date')
        
        if not date:
            return Response(
                {"error": "date parameter is required (format: YYYY-MM-DD)"},
                status=status_code.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.filter_queryset(self.get_queryset())
        
        # Group operations by booking_id + hotel_id
        grouped_data = {}
        
        for operation in queryset:
            key = f"{operation.booking_id_str}_{operation.hotel_id}"
            
            if key not in grouped_data:
                grouped_data[key] = {
                    'booking_id': operation.booking_id_str,
                    'Contact no of family head': operation.family_head_contact or '',
                    'hotel_name': operation.hotel_name,
                    'city': operation.city,
                    'check_in': str(operation.check_in_date),
                    'check_out': str(operation.check_out_date),
                    'status': operation.status,
                    'pax_list': []
                }
            
            grouped_data[key]['pax_list'].append({
                'pax_id': operation.pax_id_str,
                'first_name': operation.pax_first_name,
                'last_name': operation.pax_last_name,
                'Contact no of pex': operation.contact_no or '',
                'room_no': operation.room_no or '',
                'bed_no': operation.bed_no or ''
            })
        
        return Response({
            'date': date,
            'hotels': list(grouped_data.values())
        })
    
    @action(detail=False, methods=['put'], url_path='update-status')
    def update_status(self, request):
        """
        Update status for specific hotel operation.
        
        Request body:
        {
            "booking_id": "BKG-101",
            "pax_id": "PAX001",
            "status": "checked_in",
            "updated_by": "EMP-12"
        }
        """
        serializer = HotelStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        operation = serializer.validated_data['operation']
        new_status = serializer.validated_data['status']
        updated_by = serializer.validated_data['updated_by']
        
        # Update status using model methods
        if new_status == 'checked_in':
            operation.mark_checked_in(user=request.user)
        elif new_status == 'checked_out':
            operation.mark_checked_out(user=request.user)
        elif new_status == 'canceled':
            operation.cancel_operation(user=request.user)
        else:
            operation.status = new_status
            operation.updated_by = request.user
            operation.save()
        
        return Response({
            "message": f"Status updated to '{new_status}' for booking {operation.booking_id_str}, pax {operation.pax_id_str}",
            "operation": HotelOperationSerializer(operation).data
        }, status=status_code.HTTP_200_OK)
    
    @action(detail=False, methods=['post'], url_path='bulk-create')
    def bulk_create(self, request):
        """
        Bulk create hotel operations for all pax in a booking.
        
        Request body:
        {
            "booking_id": 123,
            "hotel_id": 45,
            "check_in_date": "2025-11-01",
            "check_out_date": "2025-11-05",
            "city": "Makkah"
        }
        """
        serializer = BulkHotelOperationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        booking_id = serializer.validated_data['booking_id']
        hotel_id = serializer.validated_data['hotel_id']
        check_in_date = serializer.validated_data['check_in_date']
        check_out_date = serializer.validated_data['check_out_date']
        city = serializer.validated_data['city']
        
        try:
            booking = Booking.objects.get(id=booking_id)
            from tickets.models import Hotels
            hotel = Hotels.objects.get(id=hotel_id)
            
            # Get all pax for this booking
            pax_list = BookingPersonDetail.objects.filter(booking=booking)
            
            if not pax_list.exists():
                return Response(
                    {"error": f"No pax found for booking {booking.booking_reference}"},
                    status=status_code.HTTP_400_BAD_REQUEST
                )
            
            # Create operations for each pax
            created_operations = []
            for pax in pax_list:
                operation = HotelOperation.objects.create(
                    booking=booking,
                    booking_id_str=booking.booking_reference,
                    pax=pax,
                    pax_id_str=pax.pax_id,
                    pax_first_name=pax.first_name,
                    pax_last_name=pax.last_name,
                    contact_no=pax.contact_no if hasattr(pax, 'contact_no') else '',
                    family_head_contact=pax.family_head_contact if hasattr(pax, 'family_head_contact') else '',
                    hotel=hotel,
                    hotel_name=hotel.name,
                    city=city,
                    date=check_in_date,  # Use check-in date as operation date
                    check_in_date=check_in_date,
                    check_out_date=check_out_date,
                    status='pending',
                    created_by=request.user
                )
                created_operations.append(operation)
            
            return Response({
                "message": f"Created {len(created_operations)} hotel operations for booking {booking.booking_reference}",
                "count": len(created_operations),
                "operations": HotelOperationSerializer(created_operations, many=True).data
            }, status=status_code.HTTP_201_CREATED)
            
        except Booking.DoesNotExist:
            return Response(
                {"error": f"Booking {booking_id} not found"},
                status=status_code.HTTP_404_NOT_FOUND
            )
        except Hotels.DoesNotExist:
            return Response(
                {"error": f"Hotel {hotel_id} not found"},
                status=status_code.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'], url_path='by-booking')
    def by_booking(self, request):
        """
        List all hotel operations for a specific booking.
        Query param: booking_id (booking reference or ID)
        """
        booking_id = request.query_params.get('booking_id')
        
        if not booking_id:
            return Response(
                {"error": "booking_id parameter is required"},
                status=status_code.HTTP_400_BAD_REQUEST
            )
        
        operations = self.get_queryset().filter(
            Q(booking_id_str=booking_id) | Q(booking__booking_reference=booking_id)
        )
        
        serializer = HotelOperationListSerializer(operations, many=True)
        
        return Response({
            "booking_id": booking_id,
            "count": operations.count(),
            "operations": serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """
        List all pending hotel operations.
        Optional query params: date, hotel_id, city
        """
        operations = self.get_queryset().filter(status='pending')
        
        serializer = HotelOperationListSerializer(operations, many=True)
        
        return Response({
            "count": operations.count(),
            "operations": serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get statistics for hotel operations.
        Optional query params: date, hotel_id, city
        """
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'by_status': {
                'pending': queryset.filter(status='pending').count(),
                'checked_in': queryset.filter(status='checked_in').count(),
                'checked_out': queryset.filter(status='checked_out').count(),
                'canceled': queryset.filter(status='canceled').count(),
            },
            'by_city': {}
        }
        
        # Get count by city
        city_counts = queryset.values('city').annotate(count=Count('id'))
        for item in city_counts:
            stats['by_city'][item['city']] = item['count']
        
        return Response(stats)
    
    @action(detail=True, methods=['post'], url_path='mark-checked-in')
    def mark_checked_in(self, request, pk=None):
        """Mark specific operation as checked in"""
        operation = self.get_object()
        operation.mark_checked_in(user=request.user)
        
        return Response({
            "message": f"Operation {pk} marked as checked in",
            "operation": HotelOperationSerializer(operation).data
        })
    
    @action(detail=True, methods=['post'], url_path='mark-checked-out')
    def mark_checked_out(self, request, pk=None):
        """Mark specific operation as checked out"""
        operation = self.get_object()
        operation.mark_checked_out(user=request.user)
        
        return Response({
            "message": f"Operation {pk} marked as checked out",
            "operation": HotelOperationSerializer(operation).data
        })
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel specific operation"""
        operation = self.get_object()
        operation.cancel_operation(user=request.user)
        
        return Response({
            "message": f"Operation {pk} canceled",
            "operation": HotelOperationSerializer(operation).data
        })


# ===============================================
# TRANSPORT OPERATION VIEWSET
# ===============================================

@extend_schema_view(
    list=extend_schema(
        summary="List Transport Operations",
        description="Get daily transport operations with filtering by date, status, vehicle, location",
        parameters=[
            OpenApiParameter(name="date", type=OpenApiTypes.DATE, location=OpenApiParameter.QUERY, description="Filter by operation date (YYYY-MM-DD)"),
            OpenApiParameter(name="status", type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description="Filter by status", enum=['pending', 'departed', 'arrived', 'canceled']),
            OpenApiParameter(name="vehicle_id", type=OpenApiTypes.INT, location=OpenApiParameter.QUERY, description="Filter by vehicle ID"),
            OpenApiParameter(name="pickup_location", type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description="Filter by pickup location"),
            OpenApiParameter(name="drop_location", type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description="Filter by drop location"),
        ],
    ),
    create=extend_schema(summary="Create Transport Operation", description="Create a new transport operation for passenger pickup/drop"),
    retrieve=extend_schema(summary="Get Transport Operation", description="Retrieve specific transport operation details"),
    update=extend_schema(summary="Update Transport Operation", description="Update transport operation details"),
    partial_update=extend_schema(summary="Partial Update Transport Operation", description="Partially update transport operation"),
    destroy=extend_schema(summary="Delete Transport Operation", description="Delete a transport operation"),
)
class TransportOperationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing daily transport operations (pickup/drop).
    
    Endpoints:
    - GET /api/daily/transport/ - List all transport operations (with date filtering and grouping)
    - POST /api/daily/transport/ - Create new transport operation
    - GET /api/daily/transport/{id}/ - Get specific transport operation
    - PUT/PATCH /api/daily/transport/{id}/ - Update transport operation
    - DELETE /api/daily/transport/{id}/ - Delete transport operation
    - GET /api/daily/transport/today/ - Get today's transport operations (grouped)
    - PUT /api/daily/transport/update-status/ - Update status of transport operation
    - POST /api/daily/transport/bulk-create/ - Create operations for all pax in a booking
    - GET /api/daily/transport/by-booking/?booking_id=X - Get operations by booking
    - GET /api/daily/transport/by-vehicle/?vehicle_id=X - Get operations by vehicle
    - GET /api/daily/transport/pending/ - Get all pending transport operations
    """
    
    queryset = TransportOperation.objects.all()
    serializer_class = TransportOperationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter queryset based on query parameters.
        Supports filtering by date, booking_id, vehicle_id, status
        """
        queryset = TransportOperation.objects.select_related(
            'booking', 
            'pax', 
            'vehicle',
            'created_by',
            'updated_by'
        )
        
        # Filter by date
        date_param = self.request.query_params.get('date', None)
        if date_param:
            queryset = queryset.filter(date=date_param)
        
        # Filter by booking
        booking_id = self.request.query_params.get('booking_id', None)
        if booking_id:
            queryset = queryset.filter(booking_id=booking_id)
        
        # Filter by vehicle
        vehicle_id = self.request.query_params.get('vehicle_id', None)
        if vehicle_id:
            queryset = queryset.filter(vehicle_id=vehicle_id)
        
        # Filter by status
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by pickup location
        pickup = self.request.query_params.get('pickup_location', None)
        if pickup:
            queryset = queryset.filter(pickup_location__icontains=pickup)
        
        # Filter by drop location
        drop = self.request.query_params.get('drop_location', None)
        if drop:
            queryset = queryset.filter(drop_location__icontains=drop)
        
        return queryset.order_by('date', 'pickup_time', 'booking')
    
    def get_serializer_class(self):
        """Use list serializer for list action"""
        if self.action == 'list':
            return TransportOperationListSerializer
        return TransportOperationSerializer
    
    def list(self, request, *args, **kwargs):
        """
        List transport operations with optional grouping.
        Query params:
        - date: Filter by specific date (YYYY-MM-DD)
        - grouped: If 'true', group by booking (default: false)
        - booking_id, vehicle_id, status: Additional filters
        """
        queryset = self.get_queryset()
        
        # Check if grouped response is requested
        grouped = request.query_params.get('grouped', 'false').lower() == 'true'
        
        if grouped:
            return self._return_grouped_response(queryset, request)
        
        # Standard list response
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def _return_grouped_response(self, queryset, request):
        """
        Return grouped response format:
        {
            "date": "2025-10-28",
            "transports": [
                {
                    "booking_id": "BKG-101",
                    "pickup": "Makkah Hotel",
                    "drop": "Madinah Hotel",
                    "vehicle": "Hiace",
                    "driver_name": "Abdullah",
                    "status": "departed",
                    "pax_list": [...]
                }
            ]
        }
        """
        # Get date from request or use None
        date_param = request.query_params.get('date')
        
        # Group operations by booking + route (pickup + drop)
        transport_groups = defaultdict(list)
        
        for operation in queryset:
            # Create composite key: booking + pickup + drop
            key = (
                operation.booking_id_str,
                operation.pickup_location,
                operation.drop_location
            )
            transport_groups[key].append(operation)
        
        # Build response
        transports_list = []
        
        for (booking_id, pickup, drop), operations in transport_groups.items():
            # Get common info from first operation in group
            first_op = operations[0]
            
            transport_group = {
                "booking_id": booking_id,
                "pickup": pickup,
                "drop": drop,
                "vehicle": first_op.vehicle_name or "N/A",
                "driver_name": first_op.driver_name or "N/A",
                "status": first_op.status,
                "pax_list": []
            }
            
            # Add all pax in this transport group
            for op in operations:
                transport_group["pax_list"].append({
                    "id": op.id,  # operation_id for status updates
                    "pax_id": op.pax_id_str,
                    "first_name": op.pax_first_name,
                    "last_name": op.pax_last_name,
                    "contact_no": op.contact_no or "N/A",
                    "status": op.status
                })
            
            transports_list.append(transport_group)
        
        response_data = {
            "date": date_param,
            "transports": transports_list
        }
        
        return Response(response_data)
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """
        Get today's transport operations in grouped format.
        GET /api/daily/transport/today/
        """
        today = datetime.now().date()
        queryset = self.get_queryset().filter(date=today)
        
        return self._return_grouped_response(queryset, request)
    
    @action(detail=False, methods=['put'], url_path='update-status')
    def update_status(self, request):
        """
        Update status of a transport operation.
        PUT /api/daily/transport/update-status/
        
        Request body:
        {
            "operation_id": 123,
            "status": "departed",
            "notes": "Left on time"
        }
        """
        serializer = TransportStatusUpdateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status_code.HTTP_400_BAD_REQUEST
            )
        
        operation_id = serializer.validated_data['operation_id']
        new_status = serializer.validated_data['status']
        notes = serializer.validated_data.get('notes', '')
        
        try:
            operation = TransportOperation.objects.get(id=operation_id)
            
            # Update status using helper methods
            if new_status == 'departed':
                operation.mark_departed(user=request.user)
            elif new_status == 'arrived':
                operation.mark_arrived(user=request.user)
            elif new_status == 'canceled':
                operation.cancel_operation(user=request.user)
            else:
                operation.status = new_status
                operation.updated_by = request.user
                operation.save()
            
            # Update notes if provided
            if notes:
                operation.notes = notes
                operation.save()
            
            return Response({
                "message": f"Transport operation {operation_id} updated to {new_status}",
                "operation": TransportOperationSerializer(operation).data
            })
        
        except TransportOperation.DoesNotExist:
            return Response(
                {"error": f"Transport operation {operation_id} not found"},
                status=status_code.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'], url_path='bulk-create')
    def bulk_create(self, request):
        """
        Create transport operations for all pax in a booking.
        POST /api/daily/transport/bulk-create/
        
        Request body:
        {
            "booking_id": 1,
            "date": "2025-10-28",
            "pickup_location": "Makkah Hotel",
            "drop_location": "Madinah Hotel",
            "vehicle_id": 5,
            "driver_name": "Abdullah",
            "driver_contact": "+966501234567",
            "pickup_time": "08:00:00"
        }
        """
        serializer = BulkTransportOperationCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status_code.HTTP_400_BAD_REQUEST
            )
        
        # Extract validated data
        booking_id = serializer.validated_data['booking_id']
        date = serializer.validated_data['date']
        pickup_location = serializer.validated_data['pickup_location']
        drop_location = serializer.validated_data['drop_location']
        vehicle_id = serializer.validated_data.get('vehicle_id')
        driver_name = serializer.validated_data.get('driver_name', '')
        driver_contact = serializer.validated_data.get('driver_contact', '')
        pickup_time = serializer.validated_data.get('pickup_time')
        
        # Get booking and all pax
        try:
            booking = Booking.objects.get(id=booking_id)
            pax_list = BookingPersonDetail.objects.filter(booking=booking)
            
            if not pax_list.exists():
                return Response(
                    {"error": f"No passengers found for booking {booking.booking_number}"},
                    status=status_code.HTTP_400_BAD_REQUEST
                )
            
            # Get vehicle if provided
            vehicle = None
            if vehicle_id:
                try:
                    vehicle = VehicleType.objects.get(id=vehicle_id)
                except VehicleType.DoesNotExist:
                    return Response(
                        {"error": f"Vehicle with id {vehicle_id} not found"},
                        status=status_code.HTTP_400_BAD_REQUEST
                    )
            
            # Create operations for all pax
            created_operations = []
            
            for pax in pax_list:
                operation = TransportOperation.objects.create(
                    booking=booking,
                    pax=pax,
                    pax_id_str=str(pax.id),
                    pax_first_name=pax.first_name,
                    pax_last_name=pax.last_name,
                    booking_id_str=booking.booking_number,
                    contact_no=pax.contact_number if hasattr(pax, 'contact_number') else '',
                    pickup_location=pickup_location,
                    drop_location=drop_location,
                    vehicle=vehicle,
                    vehicle_name=vehicle.vehicle_name if vehicle else '',
                    driver_name=driver_name,
                    driver_contact=driver_contact,
                    date=date,
                    pickup_time=pickup_time,
                    status='pending',
                    created_by=request.user
                )
                created_operations.append(operation)
            
            return Response({
                "message": f"Created {len(created_operations)} transport operations",
                "count": len(created_operations),
                "operations": TransportOperationSerializer(created_operations, many=True).data
            }, status=status_code.HTTP_201_CREATED)
        
        except Booking.DoesNotExist:
            return Response(
                {"error": f"Booking with id {booking_id} not found"},
                status=status_code.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'], url_path='by-booking')
    def by_booking(self, request):
        """
        Get all transport operations for a specific booking.
        Query param: booking_id
        """
        booking_id = request.query_params.get('booking_id')
        
        if not booking_id:
            return Response(
                {"error": "booking_id query parameter is required"},
                status=status_code.HTTP_400_BAD_REQUEST
            )
        
        operations = self.get_queryset().filter(booking_id=booking_id)
        serializer = TransportOperationListSerializer(operations, many=True)
        
        return Response({
            "booking_id": booking_id,
            "count": operations.count(),
            "operations": serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='by-vehicle')
    def by_vehicle(self, request):
        """
        Get all transport operations for a specific vehicle.
        Query param: vehicle_id
        """
        vehicle_id = request.query_params.get('vehicle_id')
        
        if not vehicle_id:
            return Response(
                {"error": "vehicle_id query parameter is required"},
                status=status_code.HTTP_400_BAD_REQUEST
            )
        
        operations = self.get_queryset().filter(vehicle_id=vehicle_id)
        serializer = TransportOperationListSerializer(operations, many=True)
        
        return Response({
            "vehicle_id": vehicle_id,
            "count": operations.count(),
            "operations": serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """
        Get all pending transport operations.
        """
        operations = self.get_queryset().filter(status='pending')
        serializer = TransportOperationListSerializer(operations, many=True)
        
        return Response({
            "count": operations.count(),
            "operations": serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get statistics for transport operations.
        Optional query params: date, vehicle_id
        """
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'by_status': {
                'pending': queryset.filter(status='pending').count(),
                'departed': queryset.filter(status='departed').count(),
                'arrived': queryset.filter(status='arrived').count(),
                'canceled': queryset.filter(status='canceled').count(),
            }
        }
        
        return Response(stats)
    
    @action(detail=True, methods=['post'], url_path='mark-departed')
    def mark_departed(self, request, pk=None):
        """Mark specific operation as departed"""
        operation = self.get_object()
        operation.mark_departed(user=request.user)
        
        return Response({
            "message": f"Operation {pk} marked as departed",
            "operation": TransportOperationSerializer(operation).data
        })
    
    @action(detail=True, methods=['post'], url_path='mark-arrived')
    def mark_arrived(self, request, pk=None):
        """Mark specific operation as arrived"""
        operation = self.get_object()
        operation.mark_arrived(user=request.user)
        
        return Response({
            "message": f"Operation {pk} marked as arrived",
            "operation": TransportOperationSerializer(operation).data
        })
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel specific operation"""
        operation = self.get_object()
        operation.cancel_operation(user=request.user)
        
        return Response({
            "message": f"Operation {pk} canceled",
            "operation": TransportOperationSerializer(operation).data
        })


# ===============================================
# FOOD OPERATION VIEWSET
# ===============================================

@extend_schema_view(
    list=extend_schema(
        summary="List Food Operations",
        description="Get daily food/meal service operations with filtering by date, status, meal type",
        parameters=[
            OpenApiParameter(name="date", type=OpenApiTypes.DATE, location=OpenApiParameter.QUERY, description="Filter by service date (YYYY-MM-DD)"),
            OpenApiParameter(name="status", type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description="Filter by status", enum=['pending', 'served', 'not_served', 'canceled']),
            OpenApiParameter(name="meal_type", type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description="Filter by meal type", enum=['breakfast', 'lunch', 'dinner', 'snack']),
        ],
    ),
    create=extend_schema(summary="Create Food Operation", description="Create a new food service operation"),
    retrieve=extend_schema(summary="Get Food Operation", description="Retrieve specific food operation details"),
    update=extend_schema(summary="Update Food Operation", description="Update food operation details"),
    partial_update=extend_schema(summary="Partial Update Food Operation", description="Partially update food operation"),
    destroy=extend_schema(summary="Delete Food Operation", description="Delete a food operation"),
)
class FoodOperationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing daily food operations (meal service).
    
    Endpoints:
    - GET /api/daily/food/ - List all food operations (with date filtering and grouping)
    - POST /api/daily/food/ - Create new food operation
    - GET /api/daily/food/{id}/ - Get specific food operation
    - PUT/PATCH /api/daily/food/{id}/ - Update food operation
    - DELETE /api/daily/food/{id}/ - Delete food operation
    - GET /api/daily/food/today/ - Get today's food operations (grouped)
    - PUT /api/daily/food/update-status/ - Update status of food operation
    - POST /api/daily/food/bulk-create/ - Create operations for all pax in a booking
    - GET /api/daily/food/by-booking/?booking_id=X - Get operations by booking
    - GET /api/daily/food/by-meal-type/?meal_type=breakfast - Get operations by meal type
    - GET /api/daily/food/pending/ - Get all pending food operations
    """
    
    queryset = FoodOperation.objects.all()
    serializer_class = FoodOperationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter queryset based on query parameters.
        Supports filtering by date, booking_id, meal_type, status
        """
        queryset = FoodOperation.objects.select_related(
            'booking', 
            'pax',
            'created_by',
            'updated_by'
        )
        
        # Filter by date
        date_param = self.request.query_params.get('date', None)
        if date_param:
            queryset = queryset.filter(date=date_param)
        
        # Filter by booking
        booking_id = self.request.query_params.get('booking_id', None)
        if booking_id:
            queryset = queryset.filter(booking_id=booking_id)
        
        # Filter by meal type
        meal_type = self.request.query_params.get('meal_type', None)
        if meal_type:
            queryset = queryset.filter(meal_type=meal_type)
        
        # Filter by status
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by location
        location = self.request.query_params.get('location', None)
        if location:
            queryset = queryset.filter(location__icontains=location)
        
        # Filter by city
        city = self.request.query_params.get('city', None)
        if city:
            queryset = queryset.filter(city__icontains=city)
        
        return queryset.order_by('date', 'meal_time', 'booking')
    
    def get_serializer_class(self):
        """Use list serializer for list action"""
        if self.action == 'list':
            return FoodOperationListSerializer
        return FoodOperationSerializer
    
    def list(self, request, *args, **kwargs):
        """
        List food operations with optional grouping.
        Query params:
        - date: Filter by specific date (YYYY-MM-DD)
        - grouped: If 'true', group by booking and meal type (default: false)
        - booking_id, meal_type, status: Additional filters
        """
        queryset = self.get_queryset()
        
        # Check if grouped response is requested
        grouped = request.query_params.get('grouped', 'false').lower() == 'true'
        
        if grouped:
            return self._return_grouped_response(queryset, request)
        
        # Standard list response
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def _return_grouped_response(self, queryset, request):
        """
        Return grouped response format:
        {
            "date": "2025-10-28",
            "meals": [
                {
                    "booking_id": "BKG-101",
                    "meal_type": "breakfast",
                    "location": "Makkah Hotel Restaurant",
                    "city": "Makkah",
                    "meal_time": "07:00:00",
                    "status": "pending",
                    "pax_list": [...]
                }
            ]
        }
        """
        # Get date from request or use None
        date_param = request.query_params.get('date')
        
        # Group operations by booking + meal_type
        meal_groups = defaultdict(list)
        
        for operation in queryset:
            # Create composite key: booking + meal_type
            key = (
                operation.booking_id_str,
                operation.meal_type
            )
            meal_groups[key].append(operation)
        
        # Build response
        meals_list = []
        
        for (booking_id, meal_type), operations in meal_groups.items():
            # Get common info from first operation in group
            first_op = operations[0]
            
            meal_group = {
                "booking_id": booking_id,
                "meal_type": meal_type,
                "location": first_op.location or "N/A",
                "city": first_op.city or "N/A",
                "meal_time": str(first_op.meal_time) if first_op.meal_time else "N/A",
                "status": first_op.status,
                "pax_list": []
            }
            
            # Add all pax in this meal group
            for op in operations:
                meal_group["pax_list"].append({
                    "id": op.id,  # operation_id for status updates
                    "pax_id": op.pax_id_str,
                    "first_name": op.pax_first_name,
                    "last_name": op.pax_last_name,
                    "contact_no": op.contact_no or "N/A",
                    "status": op.status,
                    "special_requirements": op.special_requirements or ""
                })
            
            meals_list.append(meal_group)
        
        response_data = {
            "date": date_param,
            "meals": meals_list
        }
        
        return Response(response_data)
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """
        Get today's food operations in grouped format.
        GET /api/daily/food/today/
        """
        today = datetime.now().date()
        queryset = self.get_queryset().filter(date=today)
        
        return self._return_grouped_response(queryset, request)
    
    @action(detail=False, methods=['put'], url_path='update-status')
    def update_status(self, request):
        """
        Update status of a food operation.
        PUT /api/daily/food/update-status/
        
        Request body:
        {
            "booking_id": "BKG-101",
            "pax_id": "12",
            "meal_type": "breakfast",
            "status": "served"
        }
        """
        serializer = FoodStatusUpdateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status_code.HTTP_400_BAD_REQUEST
            )
        
        # Get the operation from validated data
        operation = serializer.validated_data['operation']
        new_status = serializer.validated_data['status']
        
        # Update status using helper methods
        if new_status == 'served':
            operation.mark_served(user=request.user)
        elif new_status == 'canceled':
            operation.cancel_operation(user=request.user)
        else:
            operation.status = new_status
            operation.updated_by = request.user
            operation.save()
        
        return Response({
            "message": f"Food operation updated to {new_status}",
            "operation": FoodOperationSerializer(operation).data
        })
    
    @action(detail=False, methods=['post'], url_path='bulk-create')
    def bulk_create(self, request):
        """
        Create food operations for all pax in a booking.
        POST /api/daily/food/bulk-create/
        
        Request body:
        {
            "booking_id": 1,
            "meal_type": "breakfast",
            "location": "Makkah Hotel Restaurant",
            "city": "Makkah",
            "date": "2025-10-28",
            "meal_time": "07:00:00"
        }
        """
        serializer = BulkFoodOperationCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status_code.HTTP_400_BAD_REQUEST
            )
        
        # Extract validated data
        booking_id = serializer.validated_data['booking_id']
        meal_type = serializer.validated_data['meal_type']
        location = serializer.validated_data['location']
        city = serializer.validated_data.get('city', '')
        date = serializer.validated_data['date']
        meal_time = serializer.validated_data.get('meal_time')
        
        # Get booking and all pax
        try:
            booking = Booking.objects.get(id=booking_id)
            pax_list = BookingPersonDetail.objects.filter(booking=booking)
            
            if not pax_list.exists():
                return Response(
                    {"error": f"No passengers found for booking {booking.booking_number}"},
                    status=status_code.HTTP_400_BAD_REQUEST
                )
            
            # Create operations for all pax
            created_operations = []
            
            for pax in pax_list:
                # Skip pax without names
                if not pax.first_name or not pax.last_name:
                    continue
                    
                operation = FoodOperation.objects.create(
                    booking=booking,
                    pax=pax,
                    pax_id_str=str(pax.id),
                    pax_first_name=pax.first_name,
                    pax_last_name=pax.last_name,
                    booking_id_str=booking.booking_number,
                    contact_no=pax.contact_number if hasattr(pax, 'contact_number') else '',
                    meal_type=meal_type,
                    location=location,
                    city=city,
                    date=date,
                    meal_time=meal_time,
                    status='pending',
                    created_by=request.user
                )
                created_operations.append(operation)
            
            return Response({
                "message": f"Created {len(created_operations)} food operations",
                "count": len(created_operations),
                "operations": FoodOperationSerializer(created_operations, many=True).data
            }, status=status_code.HTTP_201_CREATED)
        
        except Booking.DoesNotExist:
            return Response(
                {"error": f"Booking with id {booking_id} not found"},
                status=status_code.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'], url_path='by-booking')
    def by_booking(self, request):
        """
        Get all food operations for a specific booking.
        Query param: booking_id
        """
        booking_id = request.query_params.get('booking_id')
        
        if not booking_id:
            return Response(
                {"error": "booking_id query parameter is required"},
                status=status_code.HTTP_400_BAD_REQUEST
            )
        
        operations = self.get_queryset().filter(booking_id=booking_id)
        serializer = FoodOperationListSerializer(operations, many=True)
        
        return Response({
            "booking_id": booking_id,
            "count": operations.count(),
            "operations": serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='by-meal-type')
    def by_meal_type(self, request):
        """
        Get all food operations for a specific meal type.
        Query param: meal_type (breakfast/lunch/dinner/snack)
        """
        meal_type = request.query_params.get('meal_type')
        
        if not meal_type:
            return Response(
                {"error": "meal_type query parameter is required"},
                status=status_code.HTTP_400_BAD_REQUEST
            )
        
        operations = self.get_queryset().filter(meal_type=meal_type)
        serializer = FoodOperationListSerializer(operations, many=True)
        
        return Response({
            "meal_type": meal_type,
            "count": operations.count(),
            "operations": serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """
        Get all pending food operations.
        """
        operations = self.get_queryset().filter(status='pending')
        serializer = FoodOperationListSerializer(operations, many=True)
        
        return Response({
            "count": operations.count(),
            "operations": serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get statistics for food operations.
        Optional query params: date, meal_type
        """
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'by_status': {
                'pending': queryset.filter(status='pending').count(),
                'served': queryset.filter(status='served').count(),
                'canceled': queryset.filter(status='canceled').count(),
            },
            'by_meal_type': {
                'breakfast': queryset.filter(meal_type='breakfast').count(),
                'lunch': queryset.filter(meal_type='lunch').count(),
                'dinner': queryset.filter(meal_type='dinner').count(),
                'snack': queryset.filter(meal_type='snack').count(),
            }
        }
        
        return Response(stats)
    
    @action(detail=True, methods=['post'], url_path='mark-served')
    def mark_served(self, request, pk=None):
        """Mark specific operation as served"""
        operation = self.get_object()
        operation.mark_served(user=request.user)
        
        return Response({
            "message": f"Operation {pk} marked as served",
            "operation": FoodOperationSerializer(operation).data
        })
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel specific operation"""
        operation = self.get_object()
        operation.cancel_operation(user=request.user)
        
        return Response({
            "message": f"Operation {pk} canceled",
            "operation": FoodOperationSerializer(operation).data
        })


# ===============================================
# PAX DETAILS VIEWSET
# ===============================================

@extend_schema_view(
    list=extend_schema(
        summary="List Passengers",
        description="Get list of all passengers with basic details",
        parameters=[
            OpenApiParameter(name="booking_id", type=OpenApiTypes.INT, location=OpenApiParameter.QUERY, description="Filter by booking ID"),
        ],
    ),
    retrieve=extend_schema(
        summary="Get Passenger Details",
        description="Retrieve full passenger details with all operations across modules"
    ),
)
class PaxDetailViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for getting passenger (pax) details.
    Endpoint for clicking on a pax name to get full details.
    
    Endpoints:
    - GET /api/pax/{id}/ - Get full pax details with all operations
    """
    
    queryset = BookingPersonDetail.objects.all()
    serializer_class = PaxDetailSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Optimize query with select_related"""
        return BookingPersonDetail.objects.select_related('booking')

    @action(detail=True, methods=['get'], url_path='details')
    def details(self, request, pk=None):
        """
        GET /api/pax/details/{pax_id}/?date=YYYY-MM-DD
        Returns full details for a pax, combining all modules.
        """
        try:
            pax = BookingPersonDetail.objects.select_related('booking').get(pk=pk)
        except BookingPersonDetail.DoesNotExist:
            return Response({'error': 'Pax not found'}, status=status_code.HTTP_404_NOT_FOUND)

        serializer = PaxFullDetailSerializer(pax, context={'request': request})
        return Response(serializer.data)


# ===============================================
# AIRPORT OPERATION VIEWSET
# ===============================================

@extend_schema_view(
    list=extend_schema(
        summary="List Airport Operations",
        description="Get airport pickup/drop operations with filtering by date, status, transfer type",
        parameters=[
            OpenApiParameter(name="date", type=OpenApiTypes.DATE, location=OpenApiParameter.QUERY, description="Filter by operation date (YYYY-MM-DD)"),
            OpenApiParameter(name="status", type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description="Filter by status", enum=['waiting', 'picked_up', 'dropped', 'canceled']),
            OpenApiParameter(name="transfer_type", type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description="Filter by transfer type", enum=['pickup', 'drop']),
            OpenApiParameter(name="airport", type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description="Filter by airport name"),
        ],
    ),
    create=extend_schema(summary="Create Airport Operation", description="Create a new airport transfer operation"),
    retrieve=extend_schema(summary="Get Airport Operation", description="Retrieve specific airport operation details"),
    update=extend_schema(summary="Update Airport Operation", description="Update airport operation details"),
    partial_update=extend_schema(summary="Partial Update Airport Operation", description="Partially update airport operation"),
    destroy=extend_schema(summary="Delete Airport Operation", description="Delete an airport operation"),
)
class AirportOperationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing airport pickup/drop operations.
    
    Endpoints:
    - GET /api/daily/airport/ - List all airport operations (with date filtering and grouping)
    - POST /api/daily/airport/ - Create new airport operation
    - GET /api/daily/airport/{id}/ - Get specific airport operation
    - PUT/PATCH /api/daily/airport/{id}/ - Update airport operation
    - DELETE /api/daily/airport/{id}/ - Delete airport operation
    - GET /api/daily/airport/today/ - Get today's airport operations (grouped)
    - PUT /api/daily/airport/update-status/ - Update status of airport operation
    - POST /api/daily/airport/bulk-create/ - Create operations for all pax in a booking
    - GET /api/daily/airport/by-booking/?booking_id=X - Get operations by booking
    - GET /api/daily/airport/by-transfer-type/?transfer_type=pickup - Get operations by type
    - GET /api/daily/airport/waiting/ - Get all waiting operations
    """
    
    queryset = AirportOperation.objects.all()
    serializer_class = AirportOperationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter queryset based on query parameters.
        Supports filtering by date, booking_id, transfer_type, status, flight_number
        """
        queryset = AirportOperation.objects.select_related(
            'booking', 
            'pax',
            'created_by',
            'updated_by'
        )
        
        # Filter by date
        date_param = self.request.query_params.get('date', None)
        if date_param:
            queryset = queryset.filter(date=date_param)
        
        # Filter by booking
        booking_id = self.request.query_params.get('booking_id', None)
        if booking_id:
            queryset = queryset.filter(booking_id=booking_id)
        
        # Filter by transfer type
        transfer_type = self.request.query_params.get('transfer_type', None)
        if transfer_type:
            queryset = queryset.filter(transfer_type=transfer_type)
        
        # Filter by status
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by flight number
        flight_number = self.request.query_params.get('flight_number', None)
        if flight_number:
            queryset = queryset.filter(flight_number__icontains=flight_number)
        
        # Filter by pickup point
        pickup_point = self.request.query_params.get('pickup_point', None)
        if pickup_point:
            queryset = queryset.filter(pickup_point__icontains=pickup_point)
        
        # Filter by drop point
        drop_point = self.request.query_params.get('drop_point', None)
        if drop_point:
            queryset = queryset.filter(drop_point__icontains=drop_point)
        
        return queryset.order_by('date', 'flight_time', 'booking')
    
    def get_serializer_class(self):
        """Use list serializer for list action"""
        if self.action == 'list':
            return AirportOperationListSerializer
        return AirportOperationSerializer
    
    def list(self, request, *args, **kwargs):
        """
        List airport operations with optional grouping.
        Query params:
        - date: Filter by specific date (YYYY-MM-DD)
        - grouped: If 'true', group by booking and transfer type (default: false)
        - booking_id, transfer_type, status: Additional filters
        """
        queryset = self.get_queryset()
        
        # Check if grouped response is requested
        grouped = request.query_params.get('grouped', 'false').lower() == 'true'
        
        if grouped:
            return self._return_grouped_response(queryset, request)
        
        # Standard list response
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def _return_grouped_response(self, queryset, request):
        """
        Return grouped response format (YOUR EXACT FORMAT):
        {
            "date": "2025-10-17",
            "airport_transfers": [
                {
                    "booking_id": "BKG-101",
                    "transfer_type": "pickup",
                    "flight_number": "SV802",
                    "flight_time": "15:30",
                    "pickup_point": "Jeddah Airport",
                    "drop_point": "Makkah Hotel",
                    "status": "waiting",
                    "pax_list": [...]
                }
            ]
        }
        """
        # Get date from request or use None
        date_param = request.query_params.get('date')
        
        # Group operations by booking + transfer_type + flight
        transfer_groups = defaultdict(list)
        
        for operation in queryset:
            # Create composite key: booking + transfer_type + flight
            key = (
                operation.booking_id_str,
                operation.transfer_type,
                operation.flight_number
            )
            transfer_groups[key].append(operation)
        
        # Build response
        transfers_list = []
        
        for (booking_id, transfer_type, flight_number), operations in transfer_groups.items():
            # Get common info from first operation in group
            first_op = operations[0]
            
            transfer_group = {
                "booking_id": booking_id,
                "transfer_type": transfer_type,
                "flight_number": flight_number,
                "flight_time": str(first_op.flight_time),
                "pickup_point": first_op.pickup_point,
                "drop_point": first_op.drop_point,
                "status": first_op.status,
                "pax_list": []
            }
            
            # Add all pax in this transfer group
            for op in operations:
                transfer_group["pax_list"].append({
                    "id": op.id,  # operation_id
                    "pax_id": op.pax_id_str,
                    "first_name": op.pax_first_name,
                    "last_name": op.pax_last_name,
                    "contact_no": op.contact_no or "N/A",
                    "status": op.status
                })
            
            transfers_list.append(transfer_group)
        
        response_data = {
            "date": date_param,
            "airport_transfers": transfers_list
        }
        
        return Response(response_data)
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """
        Get today's airport operations in grouped format.
        GET /api/daily/airport/today/
        """
        today = datetime.now().date()
        queryset = self.get_queryset().filter(date=today)
        
        return self._return_grouped_response(queryset, request)
    
    @action(detail=False, methods=['put'], url_path='update-status')
    def update_status(self, request):
        """
        Update status of an airport operation (YOUR EXACT FORMAT).
        PUT /api/daily/airport/update-status/
        
        Request body:
        {
            "booking_id": "BKG-101",
            "pax_id": "PAX001",
            "status": "departed",
            "updated_by": "EMP-12"
        }
        """
        serializer = AirportStatusUpdateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status_code.HTTP_400_BAD_REQUEST
            )
        
        # Get the operation from validated data
        operation = serializer.validated_data['operation']
        new_status = serializer.validated_data['status']
        
        # Update status using helper methods
        if new_status == 'departed':
            operation.mark_departed(user=request.user)
        elif new_status == 'arrived':
            operation.mark_arrived(user=request.user)
        elif new_status == 'not_picked':
            operation.mark_not_picked(user=request.user)
        else:
            operation.status = new_status
            operation.updated_by = request.user
            operation.save()
        
        return Response({
            "message": f"Airport operation updated to {new_status}",
            "operation": AirportOperationSerializer(operation).data
        })
    
    @action(detail=False, methods=['post'], url_path='bulk-create')
    def bulk_create(self, request):
        """
        Create airport operations for all pax in a booking.
        POST /api/daily/airport/bulk-create/
        
        Request body:
        {
            "booking_id": 1,
            "transfer_type": "pickup",
            "flight_number": "SV802",
            "flight_time": "15:30",
            "date": "2025-10-17",
            "pickup_point": "Jeddah Airport",
            "drop_point": "Makkah Hotel"
        }
        """
        serializer = BulkAirportOperationCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status_code.HTTP_400_BAD_REQUEST
            )
        
        # Extract validated data
        booking_id = serializer.validated_data['booking_id']
        transfer_type = serializer.validated_data['transfer_type']
        flight_number = serializer.validated_data['flight_number']
        flight_time = serializer.validated_data['flight_time']
        date = serializer.validated_data['date']
        pickup_point = serializer.validated_data['pickup_point']
        drop_point = serializer.validated_data['drop_point']
        notes = serializer.validated_data.get('notes', '')
        
        # Get booking and all pax
        try:
            booking = Booking.objects.get(id=booking_id)
            pax_list = BookingPersonDetail.objects.filter(booking=booking)
            
            if not pax_list.exists():
                return Response(
                    {"error": f"No passengers found for booking {booking.booking_number}"},
                    status=status_code.HTTP_400_BAD_REQUEST
                )
            
            # Create operations for all pax
            created_operations = []
            
            for pax in pax_list:
                # Skip pax without names
                if not pax.first_name or not pax.last_name:
                    continue
                    
                operation = AirportOperation.objects.create(
                    booking=booking,
                    pax=pax,
                    pax_id_str=str(pax.id),
                    pax_first_name=pax.first_name,
                    pax_last_name=pax.last_name,
                    booking_id_str=booking.booking_number,
                    contact_no=pax.contact_number if hasattr(pax, 'contact_number') else '',
                    transfer_type=transfer_type,
                    flight_number=flight_number,
                    flight_time=flight_time,
                    date=date,
                    pickup_point=pickup_point,
                    drop_point=drop_point,
                    status='waiting',
                    notes=notes,
                    created_by=request.user
                )
                created_operations.append(operation)
            
            return Response({
                "message": f"Created {len(created_operations)} airport operations",
                "count": len(created_operations),
                "operations": AirportOperationSerializer(created_operations, many=True).data
            }, status=status_code.HTTP_201_CREATED)
        
        except Booking.DoesNotExist:
            return Response(
                {"error": f"Booking with id {booking_id} not found"},
                status=status_code.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'], url_path='by-booking')
    def by_booking(self, request):
        """
        Get all airport operations for a specific booking.
        Query param: booking_id
        """
        booking_id = request.query_params.get('booking_id')
        
        if not booking_id:
            return Response(
                {"error": "booking_id query parameter is required"},
                status=status_code.HTTP_400_BAD_REQUEST
            )
        
        operations = self.get_queryset().filter(booking_id=booking_id)
        serializer = AirportOperationListSerializer(operations, many=True)
        
        return Response({
            "booking_id": booking_id,
            "count": operations.count(),
            "operations": serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='by-transfer-type')
    def by_transfer_type(self, request):
        """
        Get all airport operations for a specific transfer type.
        Query param: transfer_type (pickup/drop)
        """
        transfer_type = request.query_params.get('transfer_type')
        
        if not transfer_type:
            return Response(
                {"error": "transfer_type query parameter is required"},
                status=status_code.HTTP_400_BAD_REQUEST
            )
        
        operations = self.get_queryset().filter(transfer_type=transfer_type)
        serializer = AirportOperationListSerializer(operations, many=True)
        
        return Response({
            "transfer_type": transfer_type,
            "count": operations.count(),
            "operations": serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def waiting(self, request):
        """
        Get all waiting airport operations.
        """
        operations = self.get_queryset().filter(status='waiting')
        serializer = AirportOperationListSerializer(operations, many=True)
        
        return Response({
            "count": operations.count(),
            "operations": serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get statistics for airport operations.
        Optional query params: date, transfer_type
        """
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'by_status': {
                'waiting': queryset.filter(status='waiting').count(),
                'departed': queryset.filter(status='departed').count(),
                'arrived': queryset.filter(status='arrived').count(),
                'not_picked': queryset.filter(status='not_picked').count(),
            },
            'by_transfer_type': {
                'pickup': queryset.filter(transfer_type='pickup').count(),
                'drop': queryset.filter(transfer_type='drop').count(),
            }
        }
        
        return Response(stats)
    
    @action(detail=True, methods=['post'], url_path='mark-departed')
    def mark_departed(self, request, pk=None):
        """Mark specific operation as departed"""
        operation = self.get_object()
        operation.mark_departed(user=request.user)
        
        return Response({
            "message": f"Operation {pk} marked as departed",
            "operation": AirportOperationSerializer(operation).data
        })
    
    @action(detail=True, methods=['post'], url_path='mark-arrived')
    def mark_arrived(self, request, pk=None):
        """Mark specific operation as arrived"""
        operation = self.get_object()
        operation.mark_arrived(user=request.user)
        
        return Response({
            "message": f"Operation {pk} marked as arrived",
            "operation": AirportOperationSerializer(operation).data
        })
    
    @action(detail=True, methods=['post'], url_path='mark-not-picked')
    def mark_not_picked(self, request, pk=None):
        """Mark specific operation as not picked"""
        operation = self.get_object()
        operation.mark_not_picked(user=request.user)
        
        return Response({
            "message": f"Operation {pk} marked as not picked",
            "operation": AirportOperationSerializer(operation).data
        })


# ============================================
# ZIYARAT OPERATION VIEWSET
# ============================================

@extend_schema_view(
    list=extend_schema(
        summary="List Ziyarat Operations",
        description="Get Ziyarat (religious site visits) operations with filtering by date, status, location",
        parameters=[
            OpenApiParameter(name="date", type=OpenApiTypes.DATE, location=OpenApiParameter.QUERY, description="Filter by ziyarat date (YYYY-MM-DD)"),
            OpenApiParameter(name="status", type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description="Filter by status", enum=['pending', 'started', 'completed', 'not_picked', 'canceled']),
            OpenApiParameter(name="location", type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description="Filter by ziyarat location"),
            OpenApiParameter(name="city", type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description="Filter by city (Makkah, Madinah)"),
        ],
    ),
    create=extend_schema(summary="Create Ziyarat Operation", description="Create a new ziyarat operation"),
    retrieve=extend_schema(summary="Get Ziyarat Operation", description="Retrieve specific ziyarat operation details"),
    update=extend_schema(summary="Update Ziyarat Operation", description="Update ziyarat operation details"),
    partial_update=extend_schema(summary="Partial Update Ziyarat Operation", description="Partially update ziyarat operation"),
    destroy=extend_schema(summary="Delete Ziyarat Operation", description="Delete a ziyarat operation"),
)
class ZiyaratOperationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Ziyarat Operations.
    
    Endpoints:
    - GET /api/daily/ziyarats/ - List all ziyarat operations
    - POST /api/daily/ziyarats/ - Create new ziyarat operation
    - GET /api/daily/ziyarats/{id}/ - Get specific ziyarat operation
    - PUT /api/daily/ziyarats/{id}/ - Update ziyarat operation
    - DELETE /api/daily/ziyarats/{id}/ - Delete ziyarat operation
    - GET /api/daily/ziyarats/today/ - Get today's ziyarats (grouped)
    - PUT /api/daily/ziyarats/update-status/ - Update status by booking_id + pax_id
    - POST /api/daily/ziyarats/bulk-create/ - Create for all pax in booking
    - GET /api/daily/ziyarats/by-booking/?booking_number={booking_number} - Filter by booking
    - GET /api/daily/ziyarats/by-location/?location={location} - Filter by location
    - GET /api/daily/ziyarats/pending/ - Get pending ziyarats
    - GET /api/daily/ziyarats/statistics/ - Get statistics
    - POST /api/daily/ziyarats/{id}/mark-started/ - Mark as started
    - POST /api/daily/ziyarats/{id}/mark-completed/ - Mark as completed
    - POST /api/daily/ziyarats/{id}/mark-not-picked/ - Mark as not picked
    """
    queryset = ZiyaratOperation.objects.all()
    serializer_class = ZiyaratOperationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'list':
            return ZiyaratOperationListSerializer
        elif self.action == 'update_status':
            return ZiyaratStatusUpdateSerializer
        elif self.action == 'bulk_create':
            return BulkZiyaratOperationCreateSerializer
        return ZiyaratOperationSerializer
    
    def get_queryset(self):
        """
        Filter queryset based on query parameters.
        """
        queryset = ZiyaratOperation.objects.all()
        
        # Filter by date
        date = self.request.query_params.get('date', None)
        if date:
            queryset = queryset.filter(date=date)
        
        # Filter by status
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by location
        location = self.request.query_params.get('location', None)
        if location:
            queryset = queryset.filter(location__icontains=location)
        
        # Filter by booking_number
        booking_number = self.request.query_params.get('booking_number', None)
        if booking_number:
            queryset = queryset.filter(booking_id_str=booking_number)
        
        return queryset.select_related('booking', 'pax')
    
    @action(detail=False, methods=['get'], url_path='today')
    def today(self, request):
        """
        Get today's ziyarat operations grouped by booking_id + location.
        User's exact format with pax_list.
        """
        today = timezone.now().date()
        operations = ZiyaratOperation.objects.filter(date=today).select_related('booking', 'pax')
        
        # Group by booking_id + location
        grouped = {}
        for op in operations:
            key = f"{op.booking_id_str}_{op.location}"
            if key not in grouped:
                grouped[key] = {
                    'booking_id': op.booking_id_str,
                    'location': op.location,
                    'pickup_time': op.pickup_time.strftime('%I:%M %p'),
                    'status': op.status,
                    'guide_name': op.guide_name,
                    'pax_list': []
                }
            
            grouped[key]['pax_list'].append({
                'pax_id': op.pax_id_str,
                'first_name': op.pax_first_name,
                'last_name': op.pax_last_name,
                'contact_no': op.contact_no
            })
        
        return Response({
            'date': str(today),
            'ziyarats': list(grouped.values())
        })
    
    @action(detail=False, methods=['put'], url_path='update-status')
    def update_status(self, request):
        """
        Update ziyarat status by booking_id + pax_id.
        User's exact format: booking_id, pax_id, status, updated_by
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        booking_id = serializer.validated_data['booking_id']
        pax_id = serializer.validated_data['pax_id']
        status = serializer.validated_data['status']
        updated_by_str = serializer.validated_data['updated_by']
        
        # Find operation
        operation = ZiyaratOperation.objects.filter(
            booking_id_str=booking_id,
            pax_id_str=pax_id
        ).first()
        
        if not operation:
            return Response(
                {'error': f'No ziyarat operation found for booking {booking_id} and pax {pax_id}'},
                status=status_code.HTTP_404_NOT_FOUND
            )
        
        # Update status with helper methods if applicable
        if status == 'started':
            operation.mark_started(user=request.user)
        elif status == 'completed':
            operation.mark_completed(user=request.user)
        elif status == 'not_picked':
            operation.mark_not_picked(user=request.user)
        else:
            operation.status = status
            operation.updated_by = request.user
            operation.save()
        
        return Response({
            'message': f'Status updated to {status} for booking {booking_id}, pax {pax_id}',
            'operation': ZiyaratOperationSerializer(operation).data
        })
    
    @action(detail=False, methods=['post'], url_path='bulk-create')
    def bulk_create(self, request):
        """
        Create ziyarat operations for all passengers in a booking.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        booking_id = serializer.validated_data['booking_id']
        location = serializer.validated_data['location']
        date = serializer.validated_data['date']
        pickup_time = serializer.validated_data['pickup_time']
        guide_name = serializer.validated_data.get('guide_name', '')
        notes = serializer.validated_data.get('notes', '')
        created_by_id = serializer.validated_data.get('created_by')
        
        # Get booking
        booking = Booking.objects.filter(id=booking_id).first()
        if not booking:
            return Response(
                {'error': f'Booking {booking_id} not found'},
                status=status_code.HTTP_404_NOT_FOUND
            )
        
        # Get all passengers in booking
        passengers = BookingPersonDetail.objects.filter(booking_id=booking_id)
        
        if not passengers.exists():
            return Response(
                {'error': f'No passengers found for booking {booking_id}'},
                status=status_code.HTTP_400_BAD_REQUEST
            )
        
        # Create operations
        created_by = None
        if created_by_id:
            created_by = User.objects.filter(id=created_by_id).first()
        
        operations = []
        for pax in passengers:
            operation = ZiyaratOperation.objects.create(
                booking=booking,
                pax=pax,
                location=location,
                date=date,
                pickup_time=pickup_time,
                guide_name=guide_name,
                notes=notes,
                created_by=created_by
            )
            operations.append(operation)
        
        return Response({
            'message': f'Created {len(operations)} ziyarat operations for booking {booking.booking_number}',
            'count': len(operations),
            'operations': ZiyaratOperationSerializer(operations, many=True).data
        }, status=status_code.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'], url_path='by-booking')
    def by_booking(self, request):
        """Get ziyarat operations by booking number"""
        booking_number = request.query_params.get('booking_number')
        if not booking_number:
            return Response(
                {'error': 'booking_number parameter is required'},
                status=status_code.HTTP_400_BAD_REQUEST
            )
        
        operations = ZiyaratOperation.objects.filter(booking_id_str=booking_number)
        serializer = ZiyaratOperationListSerializer(operations, many=True)
        
        return Response({
            'booking_number': booking_number,
            'count': operations.count(),
            'operations': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='by-location')
    def by_location(self, request):
        """Get ziyarat operations by location"""
        location = request.query_params.get('location')
        if not location:
            return Response(
                {'error': 'location parameter is required'},
                status=status_code.HTTP_400_BAD_REQUEST
            )
        
        date = request.query_params.get('date')
        operations = ZiyaratOperation.objects.filter(location__icontains=location)
        
        if date:
            operations = operations.filter(date=date)
        
        serializer = ZiyaratOperationListSerializer(operations, many=True)
        
        return Response({
            'location': location,
            'date': date or 'all',
            'count': operations.count(),
            'operations': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='pending')
    def pending(self, request):
        """Get all pending ziyarat operations"""
        operations = ZiyaratOperation.objects.filter(status='pending')
        serializer = ZiyaratOperationListSerializer(operations, many=True)
        
        return Response({
            'count': operations.count(),
            'operations': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='statistics')
    def statistics(self, request):
        """Get statistics for ziyarat operations"""
        date = request.query_params.get('date', timezone.now().date())
        
        operations = ZiyaratOperation.objects.filter(date=date)
        
        stats = {
            'date': str(date),
            'total': operations.count(),
            'by_status': {
                'pending': operations.filter(status='pending').count(),
                'started': operations.filter(status='started').count(),
                'completed': operations.filter(status='completed').count(),
                'canceled': operations.filter(status='canceled').count(),
                'not_picked': operations.filter(status='not_picked').count(),
            },
            'by_location': {}
        }
        
        # Count by location
        locations = operations.values_list('location', flat=True).distinct()
        for location in locations:
            stats['by_location'][location] = operations.filter(location=location).count()
        
        return Response(stats)
    
    @action(detail=True, methods=['post'], url_path='mark-started')
    def mark_started(self, request, pk=None):
        """Mark specific operation as started"""
        operation = self.get_object()
        operation.mark_started(user=request.user)
        
        return Response({
            "message": f"Operation {pk} marked as started",
            "operation": ZiyaratOperationSerializer(operation).data
        })
    
    @action(detail=True, methods=['post'], url_path='mark-completed')
    def mark_completed(self, request, pk=None):
        """Mark specific operation as completed"""
        operation = self.get_object()
        operation.mark_completed(user=request.user)
        
        return Response({
            "message": f"Operation {pk} marked as completed",
            "operation": ZiyaratOperationSerializer(operation).data
        })
    
    @action(detail=True, methods=['post'], url_path='mark-not-picked')
    def mark_not_picked(self, request, pk=None):
        """Mark specific operation as not picked"""
        operation = self.get_object()
        operation.mark_not_picked(user=request.user)
        
        return Response({
            "message": f"Operation {pk} marked as not picked",
            "operation": ZiyaratOperationSerializer(operation).data
        })

