from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import BookingPersonDetail

class UpdatePersonDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, person_id):
        try:
            person = BookingPersonDetail.objects.get(id=person_id)
            
            # Update only the fields provided in the request
            for field, value in request.data.items():
                if hasattr(person, field):
                    setattr(person, field, value)
            
            person.save()
            
            return Response({
                'success': True,
                'message': 'Person details updated successfully',
                'person_id': person.id
            }, status=status.HTTP_200_OK)
            
        except BookingPersonDetail.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Person not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
