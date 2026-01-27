"""
Flight API Views
"""
import asyncio
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .serializers import (
    FlightSearchSerializer,
    FlightSearchResponseSerializer
)
from .flight_service import FlightService
from .auth_service import AuthenticationService


class FlightWarmupView(APIView):
    """
    Warm up AIQS authentication so token is generated and cached in server
    session before the user initiates a search.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            tokens = AuthenticationService.get_tokens()
            # Mark session so frontend can rely on server-side warmup if needed
            try:
                request.session['aiqs_token_ready'] = True
            except Exception:
                # session might not be available in some contexts; ignore
                pass

            return Response({
                "status": "success",
                "message": "Authentication warmed up",
                "token_expires_in": tokens.get('expires_in')
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FlightSearchView(APIView):
    """
    Flight Search API
    Search for available flights between two airports
    """
    permission_classes = [AllowAny]  # Allow unauthenticated users to search flights
    
    @swagger_auto_schema(
        operation_description="Search for flights",
        request_body=FlightSearchSerializer,
        responses={
            200: FlightSearchResponseSerializer,
            400: "Bad Request - Invalid search parameters",
            500: "Internal Server Error"
        }
    )
    def post(self, request):
        """Search for flights"""
        # Validate request
        serializer = FlightSearchSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": "Invalid search parameters", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Perform search
            search_params = serializer.validated_data
            
            # Run async search
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            raw_results = loop.run_until_complete(
                FlightService.search_flights(search_params)
            )
            loop.close()
            
            # Parse results
            parsed_results = FlightService.parse_search_results(raw_results)
            
            return Response(parsed_results, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": "Flight search failed", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FlightAuthTestView(APIView):
    """
    Test AIQS Authentication
    """
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Test AIQS API authentication",
        responses={
            200: openapi.Response(
                description="Authentication successful",
                examples={
                    "application/json": {
                        "status": "success",
                        "message": "Authentication successful",
                        "token_expires_in": 3600
                    }
                }
            ),
            500: "Authentication failed"
        }
    )
    def get(self, request):
        """Test authentication"""
        try:
            tokens = AuthenticationService.get_tokens()
            return Response({
                "status": "success",
                "message": "Authentication successful",
                "token_expires_in": tokens.get('expires_in')
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ClearAuthCacheView(APIView):
    """Clear authentication cache (admin only)"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Clear cached authentication tokens"""
        if not request.user.is_staff:
            return Response(
                {"error": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        AuthenticationService.clear_cache()
        return Response(
            {"message": "Authentication cache cleared"},
            status=status.HTTP_200_OK
        )

