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
        """Get the next available consumer number
        
        Generates consumer numbers according to Kuickpay BPS-Rest API specification:
        - Total length: 18 digits (as per official spec)
        - Format: [5-digit prefix][13-digit sequence]
        - Prefix: 09571 (assigned by Kuickpay to institution)
        - Example: 09571000000000000001 (18 digits total)
        """
        # Kuickpay assigned prefix (first 5 digits)
        KUICKPAY_PREFIX = "09571"
        CONSUMER_NUMBER_LENGTH = 18  # As per Kuickpay official specification
        SEQUENCE_LENGTH = 13  # Remaining digits after prefix (18 - 5 = 13)
        
        last_consumer = Consumer.objects.order_by('-consumer_number').first()
        
        if last_consumer:
            try:
                consumer_num = str(last_consumer.consumer_number)
                
                # Check if it's in the new format (18 digits with prefix)
                if len(consumer_num) == CONSUMER_NUMBER_LENGTH and consumer_num.startswith(KUICKPAY_PREFIX):
                    # Extract sequence part (digits after the 5-digit prefix)
                    last_sequence = int(consumer_num[5:])
                    next_sequence = last_sequence + 1
                else:
                    # Old format detected, start fresh with sequence 1
                    next_sequence = 1
            except (ValueError, IndexError):
                next_sequence = 1
        else:
            next_sequence = 1
        
        # Format: [5-digit prefix][13-digit sequence with leading zeros]
        # Example: 09571 + 0000000000001 = 095710000000000001 (18 digits)
        next_number = f"{KUICKPAY_PREFIX}{next_sequence:0{SEQUENCE_LENGTH}d}"
        
        return Response({'next_consumer_number': next_number})
    
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
