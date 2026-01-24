from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Consumer
from .serializers import ConsumerSerializer


class ConsumerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing KuickPay Consumers
    """
    queryset = Consumer.objects.all()
    serializer_class = ConsumerSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter consumers and auto-update expired ones"""
        queryset = Consumer.objects.all()
        
        # Auto-update expired consumers
        today = timezone.now().date()
        expired_consumers = queryset.filter(
            expiry_date__lt=today,
            bill_status='U'
        )
        expired_consumers.update(bill_status='B')
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """Save consumer with user information"""
        user = self.request.user
        
        # Get user's full name
        if hasattr(user, 'first_name') and hasattr(user, 'last_name'):
            created_by_name = f"{user.first_name} {user.last_name}".strip()
        else:
            created_by_name = user.username
        
        if not created_by_name:
            created_by_name = user.username
        
        serializer.save(
            created_by=created_by_name,
            created_by_user=user
        )
    
    @action(detail=False, methods=['get'])
    def next_consumer_number(self, request):
        """Get the next available consumer number"""
        base_number = 95700000
        
        last_consumer = Consumer.objects.order_by('-consumer_number').first()
        
        if last_consumer:
            try:
                last_number = int(last_consumer.consumer_number)
                next_number = last_number + 1
            except ValueError:
                next_number = base_number
        else:
            next_number = base_number
        
        return Response({'next_consumer_number': str(next_number)})
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update bill status"""
        consumer = self.get_object()
        new_status = request.data.get('bill_status')
        
        if new_status not in ['U', 'P', 'B']:
            return Response(
                {'error': 'Invalid status. Must be U, P, or B'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        consumer.bill_status = new_status
        consumer.save()
        
        serializer = self.get_serializer(consumer)
        return Response(serializer.data)
