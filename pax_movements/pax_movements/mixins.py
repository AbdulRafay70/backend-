"""
Custom mixins for better API responses
"""
from rest_framework import mixins, status
from rest_framework.response import Response


class EmptyDataMixin:
    """
    Mixin to provide user-friendly responses for empty data
    """
    
    def list(self, request, *args, **kwargs):
        """Override list to provide friendly message when no data"""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Check if queryset is empty
        if not queryset.exists():
            return Response({
                'count': 0,
                'results': [],
                'message': 'No data available'
            }, status=status.HTTP_200_OK)
        
        # Paginate if needed
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'results': serializer.data
        })
    
    def retrieve(self, request, *args, **kwargs):
        """Override retrieve to provide friendly error for not found"""
        try:
            instance = self.get_object()
        except Exception as e:
            return Response({
                'error': 'Record not found',
                'message': 'The requested record does not exist or you do not have permission to view it.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
