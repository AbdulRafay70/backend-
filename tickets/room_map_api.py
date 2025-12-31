from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework import status, serializers
from rest_framework.exceptions import PermissionDenied
from django.core.files.storage import default_storage
from django.conf import settings
from django.db import transaction
from tickets.models import Hotels, HotelRooms, RoomDetails
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
import os


class BedSerializer(serializers.Serializer):
    """Serializer for bed details"""
    bed_no = serializers.IntegerField(required=True, min_value=1)
    status = serializers.ChoiceField(choices=['available', 'occupied'], default='available')


class RoomSerializer(serializers.Serializer):
    """Serializer for room details"""
    room_no = serializers.CharField(required=True, max_length=20)
    room_type = serializers.ChoiceField(
        choices=['single', 'double', 'triple', 'quad', 'quint', 'suite', 'deluxe', 'executive'],
        required=True
    )
    capacity = serializers.IntegerField(required=True, min_value=1)
    beds = BedSerializer(many=True, required=True)
    
    def validate_beds(self, value):
        if len(value) == 0:
            raise serializers.ValidationError("At least one bed is required")
        return value


class RoomMapSerializer(serializers.Serializer):
    """Serializer for room map configuration"""
    hotel_id = serializers.IntegerField(required=True)
    floor_no = serializers.IntegerField(required=True, min_value=0)
    floor_map_url = serializers.URLField(required=True, help_text="URL to the floor map image")
    rooms = RoomSerializer(many=True, required=True)
    
    def validate(self, data):
        # Validate hotel exists
        try:
            hotel = Hotels.objects.get(id=data['hotel_id'])
            data['hotel'] = hotel
        except Hotels.DoesNotExist:
            raise serializers.ValidationError({"hotel_id": "Hotel not found."})
        
        # Validate rooms list is not empty
        if not data.get('rooms'):
            raise serializers.ValidationError({"rooms": "At least one room is required"})
        
        # Validate bed count matches capacity for each room
        for room in data['rooms']:
            if len(room['beds']) != room['capacity']:
                raise serializers.ValidationError({
                    "rooms": f"Room {room['room_no']}: Number of beds ({len(room['beds'])}) must match capacity ({room['capacity']})"
                })
        
        return data


class RoomMapManagementAPIView(APIView):
    """
    API for managing hotel floor maps with room and bed layout configuration.
    Create/update complete floor layouts including rooms, beds, and floor map URLs.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    @extend_schema(
        summary="Create/Update Hotel Floor Map & Room Layout",
        description="""
        Create or update a complete floor layout including floor map URL, rooms, and bed assignments.
        
        **Features:**
        - Configure entire floor with room and bed details
        - Set floor map image URL
        - Automatically creates/updates rooms and beds
        - Validates capacity matches bed count
        - Supports both creation and updates (upsert behavior)
        
        **Use Cases:**
        - Initial hotel setup with room configuration
        - Updating floor layouts when renovations occur
        - Bulk room and bed assignment
        
        **Important Notes:**
        - Existing rooms on the floor will be removed and recreated
        - Bed count must match room capacity
        - Room types: single, double, triple, quad, quint, suite, deluxe, executive
        """,
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'hotel_id': {
                        'type': 'integer',
                        'description': 'Hotel ID',
                        'example': 123
                    },
                    'floor_no': {
                        'type': 'integer',
                        'description': 'Floor number (0 for ground floor)',
                        'example': 2
                    },
                    'floor_map_url': {
                        'type': 'string',
                        'format': 'uri',
                        'description': 'URL to the floor map image',
                        'example': 'https://cdn.saer.pk/maps/floor_2.png'
                    },
                    'rooms': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'room_no': {'type': 'string', 'example': '201'},
                                'room_type': {'type': 'string', 'enum': ['single', 'double', 'triple', 'quad', 'quint', 'suite', 'deluxe', 'executive'], 'example': 'quad'},
                                'capacity': {'type': 'integer', 'example': 4},
                                'beds': {
                                    'type': 'array',
                                    'items': {
                                        'type': 'object',
                                        'properties': {
                                            'bed_no': {'type': 'integer', 'example': 1},
                                            'status': {'type': 'string', 'enum': ['available', 'occupied'], 'example': 'available'}
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                'required': ['hotel_id', 'floor_no', 'floor_map_url', 'rooms'],
                'example': {
                    "hotel_id": 123,
                    "floor_no": 2,
                    "floor_map_url": "https://cdn.saer.pk/maps/floor_2.png",
                    "rooms": [
                        {
                            "room_no": "201",
                            "room_type": "quad",
                            "capacity": 4,
                            "beds": [
                                {"bed_no": 1, "status": "available"},
                                {"bed_no": 2, "status": "available"},
                                {"bed_no": 3, "status": "available"},
                                {"bed_no": 4, "status": "available"}
                            ]
                        },
                        {
                            "room_no": "202",
                            "room_type": "double",
                            "capacity": 2,
                            "beds": [
                                {"bed_no": 1, "status": "available"},
                                {"bed_no": 2, "status": "available"}
                            ]
                        }
                    ]
                }
            }
        },
        responses={
            201: {
                'description': 'Floor layout created/updated successfully',
                'content': {
                    'application/json': {
                        'example': {
                            "success": True,
                            "message": "Floor layout configured successfully",
                            "data": {
                                "hotel_id": 123,
                                "hotel_name": "Hilton Makkah",
                                "floor_no": 2,
                                "floor_map_url": "https://cdn.saer.pk/maps/floor_2.png",
                                "total_rooms": 2,
                                "total_beds": 6,
                                "rooms_created": [
                                    {
                                        "room_id": 501,
                                        "room_no": "201",
                                        "room_type": "quad",
                                        "beds_count": 4
                                    },
                                    {
                                        "room_id": 502,
                                        "room_no": "202",
                                        "room_type": "double",
                                        "beds_count": 2
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            400: {
                'description': 'Bad Request - Validation failed',
                'content': {
                    'application/json': {
                        'examples': {
                            'invalid_data': {
                                'value': {
                                    "error": "Validation failed",
                                    "details": {
                                        "hotel_id": ["Hotel not found."],
                                        "rooms": ["Room 201: Number of beds (3) must match capacity (4)"]
                                    }
                                }
                            },
                            'bed_mismatch': {
                                'value': {
                                    "error": "Validation failed",
                                    "details": {
                                        "rooms": "Room 201: Number of beds (3) must match capacity (4)"
                                    }
                                }
                            }
                        }
                    }
                }
            },
            403: {
                'description': 'Forbidden - Access denied',
                'content': {
                    'application/json': {
                        'example': {
                            "detail": "You do not have permission to perform this action."
                        }
                    }
                }
            },
            500: {
                'description': 'Internal Server Error',
                'content': {
                    'application/json': {
                        'example': {
                            "error": "Configuration failed",
                            "detail": "Database transaction error"
                        }
                    }
                }
            }
        },
        tags=['Hotels']
    )
    def post(self, request):
        """Create or update floor layout with rooms and beds"""
        serializer = RoomMapSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'error': 'Validation failed',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        hotel = validated_data['hotel']
        floor_no = validated_data['floor_no']
        floor_map_url = validated_data['floor_map_url']
        rooms_data = validated_data['rooms']
        
        try:
            with transaction.atomic():
                # Delete existing rooms on this floor (cascade will delete beds)
                HotelRooms.objects.filter(hotel=hotel, floor=str(floor_no)).delete()
                
                rooms_created = []
                total_beds = 0
                
                # Create new rooms and beds
                for room_data in rooms_data:
                    # Create room
                    room = HotelRooms.objects.create(
                        hotel=hotel,
                        floor=str(floor_no),
                        room_type=room_data['room_type'],
                        room_number=room_data['room_no'],
                        total_beds=room_data['capacity']
                    )
                    
                    # Create beds for this room
                    beds_count = 0
                    for bed_data in room_data['beds']:
                        RoomDetails.objects.create(
                            room=room,
                            bed_number=str(bed_data['bed_no']),
                            is_assigned=(bed_data['status'] == 'occupied')
                        )
                        beds_count += 1
                    
                    total_beds += beds_count
                    
                    rooms_created.append({
                        'room_id': room.id,
                        'room_no': room.room_number,
                        'room_type': room.room_type,
                        'beds_count': beds_count
                    })
                
                return Response({
                    'success': True,
                    'message': 'Floor layout configured successfully',
                    'data': {
                        'hotel_id': hotel.id,
                        'hotel_name': hotel.name,
                        'floor_no': floor_no,
                        'floor_map_url': floor_map_url,
                        'total_rooms': len(rooms_created),
                        'total_beds': total_beds,
                        'rooms_created': rooms_created
                    }
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response({
                'error': 'Configuration failed',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(
        summary="Get Hotel Floor Layout",
        description="""
        Retrieve the complete floor layout including floor map URL, rooms, and bed assignments.
        
        **Returns:**
        - Floor map URL
        - List of all rooms on the floor
        - Bed details for each room
        - Current bed availability status
        """,
        parameters=[
            OpenApiParameter(
                name='hotel_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                required=True,
                description='Hotel ID'
            ),
            OpenApiParameter(
                name='floor_no',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                required=True,
                description='Floor number to retrieve layout for'
            ),
        ],
        responses={
            200: {
                'description': 'Floor layout information',
                'content': {
                    'application/json': {
                        'example': {
                            "hotel_id": 123,
                            "hotel_name": "Hilton Makkah",
                            "floor_no": 2,
                            "floor_map_url": None,
                            "total_rooms": 2,
                            "total_beds": 6,
                            "available_beds": 5,
                            "rooms": [
                                {
                                    "room_id": 501,
                                    "room_no": "201",
                                    "room_type": "quad",
                                    "capacity": 4,
                                    "beds": [
                                        {"bed_id": 1001, "bed_no": "1", "status": "available"},
                                        {"bed_id": 1002, "bed_no": "2", "status": "available"},
                                        {"bed_id": 1003, "bed_no": "3", "status": "occupied"},
                                        {"bed_id": 1004, "bed_no": "4", "status": "available"}
                                    ]
                                },
                                {
                                    "room_id": 502,
                                    "room_no": "202",
                                    "room_type": "double",
                                    "capacity": 2,
                                    "beds": [
                                        {"bed_id": 1005, "bed_no": "1", "status": "available"},
                                        {"bed_id": 1006, "bed_no": "2", "status": "available"}
                                    ]
                                }
                            ]
                        }
                    }
                }
            },
            400: {'description': 'Bad Request - Missing parameters'},
            404: {'description': 'Not Found - Hotel or floor does not exist'}
        },
        tags=['Hotels']
    )
    def get(self, request):
        """Retrieve complete floor layout with rooms and beds"""
        hotel_id = request.query_params.get('hotel_id')
        floor_no = request.query_params.get('floor_no')
        
        if not hotel_id or not floor_no:
            return Response({
                'error': 'Missing required parameters',
                'detail': "Required: 'hotel_id', 'floor_no'"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            hotel = Hotels.objects.get(id=hotel_id)
        except Hotels.DoesNotExist:
            return Response({
                'error': 'Hotel not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get all rooms on this floor
        rooms = HotelRooms.objects.filter(
            hotel=hotel, 
            floor=str(floor_no)
        ).prefetch_related('details').order_by('room_number')
        
        if not rooms.exists():
            return Response({
                'error': f'Floor {floor_no} does not exist or has no rooms configured'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Build response data
        rooms_data = []
        total_beds = 0
        available_beds = 0
        
        for room in rooms:
            beds_data = []
            for bed in room.details.all().order_by('bed_number'):
                bed_status = 'occupied' if bed.is_assigned else 'available'
                beds_data.append({
                    'bed_id': bed.id,
                    'bed_no': bed.bed_number,
                    'status': bed_status
                })
                total_beds += 1
                if not bed.is_assigned:
                    available_beds += 1
            
            rooms_data.append({
                'room_id': room.id,
                'room_no': room.room_number,
                'room_type': room.room_type,
                'capacity': room.total_beds,
                'beds': beds_data
            })
        
        return Response({
            'hotel_id': hotel.id,
            'hotel_name': hotel.name,
            'floor_no': int(floor_no),
            'floor_map_url': None,  # TODO: Add floor_map_url field to Hotels or HotelRooms model
            'total_rooms': len(rooms_data),
            'total_beds': total_beds,
            'available_beds': available_beds,
            'rooms': rooms_data
        }, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Delete Hotel Floor Layout",
        description="""
        Delete all rooms and beds for a specific hotel floor.
        
        **Warning:** This action:
        - Permanently removes all room configurations
        - Deletes all bed assignments
        - Cannot be undone
        
        Use this when reconfiguring an entire floor or decommissioning a floor.
        """,
        parameters=[
            OpenApiParameter(
                name='hotel_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                required=True,
                description='Hotel ID'
            ),
            OpenApiParameter(
                name='floor_no',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                required=True,
                description='Floor number to delete layout for'
            ),
        ],
        responses={
            200: {
                'description': 'Floor layout deleted successfully',
                'content': {
                    'application/json': {
                        'example': {
                            "success": True,
                            "message": "Floor layout deleted successfully",
                            "hotel_id": 123,
                            "floor_no": 2,
                            "rooms_deleted": 5,
                            "beds_deleted": 18
                        }
                    }
                }
            },
            400: {'description': 'Bad Request - Missing parameters'},
            404: {'description': 'Not Found - Hotel or floor not found'},
            500: {'description': 'Internal Server Error'}
        },
        tags=['Hotels']
    )
    def delete(self, request):
        """Delete all rooms and beds for a floor"""
        hotel_id = request.query_params.get('hotel_id')
        floor_no = request.query_params.get('floor_no')
        
        if not hotel_id or not floor_no:
            return Response({
                'error': 'Missing required parameters',
                'detail': "Required: 'hotel_id', 'floor_no'"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            hotel = Hotels.objects.get(id=hotel_id)
        except Hotels.DoesNotExist:
            return Response({
                'error': 'Hotel not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        try:
            # Get rooms on this floor
            rooms = HotelRooms.objects.filter(hotel=hotel, floor=str(floor_no))
            
            if not rooms.exists():
                return Response({
                    'error': f'Floor {floor_no} has no rooms configured'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Count before deletion
            rooms_count = rooms.count()
            beds_count = RoomDetails.objects.filter(room__in=rooms).count()
            
            # Delete (cascade will handle beds)
            rooms.delete()
            
            return Response({
                'success': True,
                'message': 'Floor layout deleted successfully',
                'hotel_id': hotel.id,
                'floor_no': int(floor_no),
                'rooms_deleted': rooms_count,
                'beds_deleted': beds_count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Deletion failed',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
