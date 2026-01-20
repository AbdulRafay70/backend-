from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import (
    BookingPersonDetail, 
    BookingHotelDetails, 
    BookingFoodDetails, 
    BookingZiyaratDetails,
    BookingZiyaratDetails,
    BookingTransportSector,
    BookingTicketDetails,
    PassengerActivityStatus
)
from django.contrib.contenttypes.models import ContentType

class UpdateOperationStatusView(APIView):
    permission_classes = [IsAuthenticated]
    
    def patch(self, request):
        model_type = request.data.get('model_type')
        item_id = request.data.get('item_id')
        status_value = request.data.get('status')
        activity_id = request.data.get('activity_id') # New: ID of the specific activity (e.g., Ziyarat ID, Food ID)
        fields = request.data.get('fields', {}) # For multi-field updates like hotel check-in/out
        
        if not model_type or not item_id:
            return Response({
                'success': False,
                'error': 'model_type and item_id are required'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        model_map = {
            'pax': BookingPersonDetail,
            'hotel': BookingHotelDetails,
            'food': BookingFoodDetails,
            'ziyarat': BookingZiyaratDetails,
            'transport': BookingTransportSector,
            'ticket': BookingTicketDetails
        }
        
        target_model = model_map.get(model_type)
        if not target_model:
            return Response({
                'success': False,
                'error': f'Invalid model_type: {model_type}'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # Handle PAX ID format (PAX-123)
            clean_id = item_id
            if isinstance(item_id, str) and item_id.startswith('PAX-'):
                clean_id = item_id.replace('PAX-', '')
                
            instance = target_model.objects.get(id=clean_id)
            
            # Helper to get activity model based on type
            def get_activity_model(m_type):
                if m_type == 'ziyarat': return BookingZiyaratDetails
                if m_type == 'food': return BookingFoodDetails
                if m_type == 'hotel': return BookingHotelDetails
                if m_type == 'transport': return BookingTransportSector
                if m_type == 'ticket': return BookingTicketDetails
                return None

            # Logic for granular status tracking (PassengerActivityStatus)
            # Only applies if we are updating a pax status AND an activity_id is provided
            if model_type == 'pax' and activity_id and request.data.get('activity_type'):
                activity_type = request.data.get('activity_type') # e.g., 'ziyarat', 'food'
                act_model = get_activity_model(activity_type)
                
                if act_model:
                    try:
                        # Validate the activity exists
                        activity_instance = act_model.objects.get(id=activity_id)
                        
                        # Get ContentType for the activity model
                        content_type = ContentType.objects.get_for_model(act_model)
                        
                        # Update or Create PassengerActivityStatus
                        activity_status, created = PassengerActivityStatus.objects.update_or_create(
                            passenger=instance,
                            content_type=content_type,
                            object_id=activity_id,
                            defaults={'status': status_value}
                        )
                        
                        # Also update the legacy field on BookingPersonDetail if it's the "primary" status?
                        # Or maybe we STOP updating the legacy field to avoid confusion?
                        # For now, let's ONLY update the new table for granular tracking.
                        # BUT, we might want to keep the legacy field updated if it's the ONLY activity of that type?
                        # Let's keep it simple: Granular updates go to granular table.
                        
                        return Response({
                            'success': True,
                            'message': f'Passenger {activity_type} status updated successfully',
                            'item_id': item_id,
                            'activity_id': activity_id,
                            'status': status_value
                        }, status=status.HTTP_200_OK)
                        
                    except act_model.DoesNotExist:
                        return Response({
                            'success': False,
                            'error': f'{activity_type} with id {activity_id} not found'
                        }, status=status.HTTP_404_NOT_FOUND)

            # Fallback to Legacy/Direct status update (if no activity_id or not a pax update)
            if status_value:
                # Map frontend status field names to backend model field names if they differ
                status_field = 'status'
                if model_type == 'pax':
                    # Pax has visa_status and ticket_status, frontend should specify which one
                    status_field = request.data.get('status_field', 'visa_status')
                
                if hasattr(instance, status_field):
                    setattr(instance, status_field, status_value)
                else:
                    return Response({
                        'success': False,
                        'error': f'Field {status_field} does not exist on {model_type}'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Additional field updates (like room_no, bed_no for hotel)
            for field, value in fields.items():
                if hasattr(instance, field):
                    setattr(instance, field, value)
            
            instance.save()
            
            return Response({
                'success': True,
                'message': f'{model_type} updated successfully',
                'item_id': item_id
            }, status=status.HTTP_200_OK)
            
        except target_model.DoesNotExist:
            return Response({
                'success': False,
                'error': f'{model_type} with id {item_id} not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
