from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from django.db import transaction
from django.utils import timezone
from tickets.models import HotelRooms, RoomDetails
from booking.models import BookingHotelDetails, Booking
from rest_framework import serializers


class RoomAssignmentSerializer(serializers.Serializer):
    """Serializer for room/bed assignment"""
    booking_id = serializers.IntegerField(required=True)
    room_id = serializers.IntegerField(required=True)
    bed_numbers = serializers.ListField(
        child=serializers.IntegerField(),
        required=True,
        help_text="List of bed numbers to assign (e.g., [1, 2, 3])"
    )
    
    def validate(self, data):
        # Validate booking exists
        try:
            booking = Booking.objects.get(id=data['booking_id'])
        except Booking.DoesNotExist:
            raise serializers.ValidationError({"booking_id": "Booking not found."})
        
        # Validate room exists
        try:
            room = HotelRooms.objects.get(id=data['room_id'])
        except HotelRooms.DoesNotExist:
            raise serializers.ValidationError({"room_id": "Room not found."})
        
        # Validate bed numbers
        bed_numbers = data['bed_numbers']
        if not bed_numbers:
            raise serializers.ValidationError({"bed_numbers": "At least one bed must be selected."})
        
        if len(bed_numbers) > room.total_beds:
            raise serializers.ValidationError({
                "bed_numbers": f"Cannot assign {len(bed_numbers)} beds. Room has only {room.total_beds} beds."
            })
        
        # Check if beds exist and are available
        existing_beds = RoomDetails.objects.filter(room=room, bed_number__in=bed_numbers)
        for bed in existing_beds:
            if bed.is_assigned:
                raise serializers.ValidationError({
                    "bed_numbers": f"Bed {bed.bed_number} is already assigned."
                })
        
        # Store validated objects for use in create
        data['booking'] = booking
        data['room'] = room
        
        return data


class RoomAssignmentAPIView(APIView):
    """
    POST /api/hotels/assign-room
    {
        "booking_id": 123,
        "room_id": 456,
        "bed_numbers": [1, 2, 3]
    }
    
    Assign specific room and beds to a booking.
    Updates RoomDetails.is_assigned = True for selected beds.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Check owner organization access
        owner_org_id = request.query_params.get('owner_organization')
        if not owner_org_id:
            return Response({
                'error': 'Missing owner_organization parameter',
                'detail': 'owner_organization query parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate user has access to this organization (unless superuser)
        if not request.user.is_superuser:
            user_organizations = request.user.organizations.values_list('id', flat=True)
            if int(owner_org_id) not in user_organizations:
                raise PermissionDenied("You don't have access to this organization.")

        serializer = RoomAssignmentSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'error': 'Validation failed',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        booking = validated_data['booking']
        room = validated_data['room']
        bed_numbers = validated_data['bed_numbers']
        
        # Validate that the room belongs to the user's owner organization
        if room.hotel.organization_id != int(owner_org_id):
            return Response({
                'error': 'Access denied',
                'detail': 'Room does not belong to your organization'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            with transaction.atomic():
                # Create or get RoomDetails for each bed and mark as assigned
                assigned_beds = []
                for bed_no in bed_numbers:
                    bed, created = RoomDetails.objects.get_or_create(
                        room=room,
                        bed_number=bed_no,
                        defaults={'is_assigned': True}
                    )
                    
                    if not created:
                        # Bed already exists, update assignment
                        bed.is_assigned = True
                        bed.save()
                    
                    assigned_beds.append({
                        'bed_number': bed.bed_number,
                        'bed_id': bed.id
                    })
                
                # Update BookingHotelDetails to link room assignment
                BookingHotelDetails.objects.filter(booking=booking).update(
                    room_type=room.room_type,
                    hotel=room.hotel,
                    assigned_at=timezone.now()
                )
                
                return Response({
                    'success': True,
                    'message': 'Room and beds assigned successfully',
                    'data': {
                        'booking_id': booking.id,
                        'room_id': room.id,
                        'room_number': room.room_number,
                        'room_type': room.room_type,
                        'floor': room.floor,
                        'assigned_beds': assigned_beds,
                        'assigned_at': timezone.now().isoformat()
                    }
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response({
                'error': 'Assignment failed',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RoomUnassignmentAPIView(APIView):
    """
    POST /api/hotels/unassign-room
    {
        "booking_id": 123,
        "room_id": 456
    }
    
    Unassign all beds in a room for a booking.
    Sets RoomDetails.is_assigned = False for all beds in the room.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Check owner organization access
        owner_org_id = request.query_params.get('owner_organization')
        if not owner_org_id:
            return Response({
                'error': 'Missing owner_organization parameter',
                'detail': 'owner_organization query parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate user has access to this organization (unless superuser)
        if not request.user.is_superuser:
            user_organizations = request.user.organizations.values_list('id', flat=True)
            if int(owner_org_id) not in user_organizations:
                raise PermissionDenied("You don't have access to this organization.")

        booking_id = request.data.get('booking_id')
        room_id = request.data.get('room_id')
        
        if not booking_id or not room_id:
            return Response({
                'error': 'Missing required parameters',
                'detail': "Required: 'booking_id', 'room_id'"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            booking = Booking.objects.get(id=booking_id)
            room = HotelRooms.objects.get(id=room_id)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
        except HotelRooms.DoesNotExist:
            return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Validate that the room belongs to the user's owner organization
        if room.hotel.organization_id != int(owner_org_id):
            return Response({
                'error': 'Access denied',
                'detail': 'Room does not belong to your organization'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            with transaction.atomic():
                # Unassign all beds in this room
                updated_count = RoomDetails.objects.filter(
                    room=room,
                    is_assigned=True
                ).update(is_assigned=False)
                
                return Response({
                    'success': True,
                    'message': f'Successfully unassigned {updated_count} beds',
                    'data': {
                        'booking_id': booking_id,
                        'room_id': room_id,
                        'room_number': room.room_number,
                        'beds_unassigned': updated_count,
                        'unassigned_at': timezone.now().isoformat()
                    }
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response({
                'error': 'Unassignment failed',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
