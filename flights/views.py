"""
Flight API Views
"""
import asyncio
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
try:
    from drf_yasg.utils import swagger_auto_schema
    from drf_yasg import openapi
except Exception:
    def swagger_auto_schema(*args, **kwargs):
        def decorator(obj):
            return obj
        return decorator

    class _OpenApiFallback:
        IN_QUERY = 'query'
        TYPE_STRING = 'string'
        TYPE_OBJECT = 'object'

        @staticmethod
        def Parameter(name, in_, description=None, type=None):
            return None

        class Schema:
            def __init__(self, **kwargs):
                pass

        @staticmethod
        def Response(*args, **kwargs):
            return None

    openapi = _OpenApiFallback()
else:
    # If drf_yasg is present but mocked (e.g., MagicMock from manage.py), ensure
    # `swagger_auto_schema` is a callable decorator and `openapi` has expected
    # attributes. Replace with no-op versions when necessary to avoid view
    # methods being replaced by MagicMock objects at runtime.
    try:
        import types, unittest.mock
        if not callable(swagger_auto_schema) or isinstance(swagger_auto_schema, unittest.mock.Mock):
            def swagger_auto_schema(*a, **k):
                def decorator(obj):
                    return obj
                return decorator
            # override
            globals()['swagger_auto_schema'] = swagger_auto_schema
    except Exception:
        pass

    # Ensure openapi provides minimal interface used in this file
    try:
        need_attrs = ['Response', 'Parameter', 'Schema', 'IN_QUERY', 'TYPE_STRING', 'TYPE_OBJECT']
        missing = [a for a in need_attrs if not hasattr(openapi, a)]
        if missing:
            class _OpenApiFallback2:
                IN_QUERY = 'query'
                TYPE_STRING = 'string'
                TYPE_OBJECT = 'object'

                @staticmethod
                def Parameter(*args, **kwargs):
                    return None

                class Schema:
                    def __init__(self, **kwargs):
                        pass

                @staticmethod
                def Response(*args, **kwargs):
                    return None

            globals()['openapi'] = _OpenApiFallback2()
    except Exception:
        pass

from .serializers import (
    FlightSearchSerializer,
    FlightSearchResponseSerializer,
    ValidateFareSerializer,
    CreateBookingSerializer,
    FlightBookingSerializer,
    SaveBookingSerializer
)
from .models import FlightBooking
from .flight_service import FlightService
from .auth_service import AuthenticationService
import requests
from .config import REST_ENDPOINT

# Supplier to Credential Mapping
# Add new suppliers here with their specific credentials
SUPPLIER_CREDENTIAL_MAP = {
    2: {  # Gulf Air, Etihad, flydubai, Qatar Airways
        "id": 33,
        "officeIdList": [{"id": 24}]
    },
    11: {  # Jazeera Airways
        "id": 167
    },
    17: {  # Air Arabia
        "id": 167  # Using same as Jazeera for now
    },
}

# Default credential if supplier not in map
DEFAULT_CREDENTIAL = {"id": 167}


class FlightWarmupView(APIView):
    """
    Warm up AIQS authentication so token is generated and cached in server
    session before the user initiates a search.
    """
    permission_classes = [AllowAny]
    # This endpoint is used by the frontend to warm up AIQS tokens.
    # It must not attempt Django authentication with the `Authorization` header
    # because the frontend may include AIQS tokens there; disable DRF auth.
    authentication_classes = []

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
    # Accept requests without attempting Django authentication (avoid 401 when
    # frontend sends AIQS tokens in the Authorization header).
    authentication_classes = []
    
    # swagger_auto_schema(...) removed to avoid decorator side-effects in this environment
    def post(self, request):
        """Search for flights"""
        # Accept two payload shapes:
        # 1) Simplified frontend payload (origin,destination,departureDate,adults,...)
        # 2) Documented AIQS wrapper: { "request": { "service": "FlightRQ", "token": "...", "content": { "command": "FlightSearchRQ", "criteria": { ... }}}}
        data = request.data

        # If the documented wrapper is present, normalize into simplified shape
        if isinstance(data, dict) and data.get('request') and isinstance(data.get('request'), dict):
            try:
                content = data.get('request', {}).get('content', {})
                if content.get('command') == 'FlightSearchRQ' and content.get('criteria'):
                    criteria = content.get('criteria', {})
                    # pax counts
                    pax = criteria.get('paxQuantity', {})
                    adt = pax.get('adt') or pax.get('adults') or 1
                    chd = pax.get('chd') or pax.get('children') or 0
                    inf = pax.get('inf') or pax.get('infants') or 0

                    # cabin
                    cabin = criteria.get('cabin') or criteria.get('cabinClass') or 'Y'

                    # trip type mapping
                    trip_map = {'O': 'oneway', 'R': 'return', 'M': 'multicity'}
                    trip_raw = (criteria.get('tripType') or criteria.get('trip_type') or criteria.get('tripTypeCode') or 'O')
                    trip = trip_map.get(str(trip_raw).upper(), 'oneway')

                    # ondPairs -> segments
                    ond_pairs = criteria.get('ondPairs') or []
                    segments = []
                    for p in ond_pairs:
                        # handle both documented names and alternative keys
                        dep = p.get('departureDate') or (p.get('date') if isinstance(p.get('date'), str) else None)
                        orig = p.get('originLocation') or p.get('origin') or p.get('originCity')
                        dest = p.get('destinationLocation') or p.get('destination') or p.get('destinationCity')
                        if dep and orig and dest:
                            segments.append({
                                'origin': orig,
                                'destination': dest,
                                'departureDate': dep
                            })

                    # Build normalized payload that matches FlightSearchSerializer expectations
                    normalized = {
                        'adults': int(adt) if adt is not None else 1,
                        'children': int(chd) if chd is not None else 0,
                        'infants': int(inf) if inf is not None else 0,
                        'cabinClass': cabin,
                        'tripType': trip,
                    }

                    if trip == 'multicity':
                        normalized['segments'] = segments
                        normalized['multiCitySegments'] = segments
                    else:
                        # for oneway/return, take first as origin/destination
                        if len(segments) >= 1:
                            normalized['origin'] = segments[0]['origin']
                            normalized['destination'] = segments[0]['destination']
                            normalized['departureDate'] = segments[0]['departureDate']
                        if len(segments) >= 2 and trip == 'return':
                            normalized['returnDate'] = segments[1]['departureDate']

                    # allow additional optional params
                    if criteria.get('nonStop') is not None:
                        normalized['nonStop'] = bool(criteria.get('nonStop'))
                    if criteria.get('preferredAirline'):
                        normalized['preferredAirlines'] = criteria.get('preferredAirline')
                    if criteria.get('commonRequestSearch'):
                        crs = criteria.get('commonRequestSearch')
                        if crs.get('resultsCount'):
                            try:
                                normalized['maxResults'] = int(crs.get('resultsCount'))
                            except Exception:
                                pass

                    data = normalized
            except Exception:
                # Fall back to raw payload if normalization fails
                data = request.data

        # Validate request
        serializer = FlightSearchSerializer(data=data)
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

            # Cache supplierSpecific list in session so validate can reuse exact
            # supplier/session tokens returned by the search. This avoids timing
            # mismatches when the client validates immediately after search.
            try:
                ss_list = [f.get('supplierSpecific') for f in parsed_results.get('flights', []) if f.get('supplierSpecific')]
                if ss_list:
                    try:
                        request.session['aiqs_last_supplier_specific'] = ss_list
                    except Exception:
                        # session may be unavailable in some contexts; ignore
                        pass
            except Exception:
                pass

            # Debug info: print types to help diagnose unexpected MagicMock returns
            try:
                print('DEBUG: parsed_results type =', type(parsed_results))
                print('DEBUG: about to return DRF Response class =', Response)
            except Exception:
                pass

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
    
    # swagger_auto_schema(...) removed to avoid decorator side-effects in this environment
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


class ValidateFareView(APIView):
    """Validate flight fare before booking"""
    permission_classes = [AllowAny]
    authentication_classes = []

    # swagger_auto_schema(...) removed to avoid decorator side-effects in this environment
    def post(self, request):
        """Validate fare"""
        serializer = ValidateFareSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"error": "Invalid request", "details": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        try:
            flight_data = serializer.validated_data['flightData']
            tokens = AuthenticationService.get_tokens()

            # Prefer a client-provided AIQS token (the one used during search).
            # Frontend may include this token in the validate request as `token`.
            aiqs_token = request.data.get('token') or flight_data.get('token') or tokens.get('id_token') or tokens.get('access_token')
            print(f"[KEY] Using AIQS token from: {'request' if request.data.get('token') else ('flight_data' if flight_data.get('token') else 'server cache')}")

            # Build validate request
            validate_request = self._build_validate_request(flight_data)
            try:
                validate_request['token'] = aiqs_token
            except Exception:
                pass

            # If supplierSpecific is missing or empty, try to reuse the supplierSpecific
            # from the last search stored in the session (helps preserve segRef/traceId).
            try:
                ss = validate_request.get('request', {}).get('content', {}).get('supplierSpecific')
                if (not ss or ss == [] or ss == {}) and request.session:
                    cached_ss = request.session.get('aiqs_last_supplier_specific')
                    if cached_ss:
                        print('[DEBUG] Reusing supplierSpecific from last search in session')
                        validate_request['request']['content']['supplierSpecific'] = cached_ss
            except Exception:
                pass

            # Log the request for debugging
            import json
            print("=" * 80)
            print("VALIDATE REQUEST BEING SENT TO AIQS:")
            print(json.dumps(validate_request, indent=2))
            print("=" * 80)

            # Call AIQS validate API
            headers = {
                'Authorization': f"Bearer {aiqs_token}",
                'Content-Type': 'application/json'
            }

            response = requests.post(f"{REST_ENDPOINT}/api/air/validate", json=validate_request, headers=headers, timeout=30)

            # Log the response
            print("AIQS RESPONSE STATUS:", response.status_code)
            print("AIQS RESPONSE BODY:", response.text)

            # If client-provided token is unauthorized, try server-cached token as a fallback
            if response.status_code == 401:
                try:
                    print('[AUTH] Client token unauthorized (401). Attempting server-cached token fallback')
                    server_tokens = AuthenticationService.get_tokens()
                    server_token = server_tokens.get('id_token') or server_tokens.get('access_token')
                    if server_token and server_token != aiqs_token:
                        headers_fallback = {'Authorization': f"Bearer {server_token}", 'Content-Type': 'application/json'}
                        retry_resp = requests.post(f"{REST_ENDPOINT}/api/air/validate", json=validate_request, headers=headers_fallback, timeout=30)
                        print('AIQS FALLBACK STATUS:', retry_resp.status_code)
                        print('AIQS FALLBACK BODY:', retry_resp.text)
                        response = retry_resp
                    else:
                        print('[WARNING] No different server token available to retry with')
                except Exception as fallback_err:
                    print('[ERROR] Fallback attempt failed:', str(fallback_err))

            if response.status_code != 200:
                try:
                    error_data = response.json()
                    error_msg = error_data.get('response', {}).get('content', {}).get('error', {}).get('message', response.text)
                except Exception:
                    error_msg = response.text

                print(f"[ERROR] AIQS Validation Failed: {error_msg}")
                return Response({'error': 'Validation failed', 'details': error_msg, 'aiqs_response': response.text[:500]}, status=status.HTTP_400_BAD_REQUEST)

            # Parse response and extract sealed token
            result = response.json()
            sealed = None

            # Check for error in response content
            error_in_content = result.get('response', {}).get('content', {}).get('error')
            if error_in_content:
                error_msg = error_in_content.get('message', 'Validation failed')
                print(f"[ERROR] AIQS returned error: {error_msg}")

                # If AIQS reports supplier/session tokens expired, attempt one
                # server-side re-search to refresh supplierSpecific and retry once.
                if 'Could not process' in error_msg or 'expired' in error_msg.lower():
                    try:
                        print('[RETRY] Attempting server-side re-search to refresh supplier tokens')
                        # Build minimal search params from flight_data
                        search_params = {
                            'origin': flight_data.get('origin') or (flight_data.get('segments') and flight_data.get('segments')[0].get('flights', [])[0].get('departureLocation')),
                            'destination': flight_data.get('destination') or (flight_data.get('segments') and flight_data.get('segments')[-1].get('flights', [])[-1].get('arrivalLocation')),
                            'departureDate': None,
                            'adults': flight_data.get('adt', 1),
                            'children': flight_data.get('chd', 0),
                            'infants': flight_data.get('inf', 0),
                            'cabinClass': None
                        }

                        try:
                            first_fl = flight_data.get('segments', [])[0].get('flights', [])[0]
                            search_params['departureDate'] = first_fl.get('departureDate')
                            search_params['cabinClass'] = first_fl.get('cabin') or flight_data.get('cabinClass')
                        except Exception:
                            pass

                        # Run async search
                        loop = asyncio.new_event_loop()
                        asyncio.set_event_loop(loop)
                        raw_results = loop.run_until_complete(FlightService.search_flights(search_params))
                        loop.close()

                        parsed = FlightService.parse_search_results(raw_results)
                        refreshed_supplier_specific = None

                        for f in parsed.get('flights', []):
                            ss = f.get('supplierSpecific')
                            if ss:
                                refreshed_supplier_specific = ss
                                break

                        if refreshed_supplier_specific:
                            print('[SUCCESS] Found refreshed supplierSpecific, retrying validate')
                            validate_request['request']['content']['supplierSpecific'] = refreshed_supplier_specific
                            validate_request['token'] = aiqs_token

                            retry_resp = requests.post(f"{REST_ENDPOINT}/api/air/validate", json=validate_request, headers={'Authorization': f"Bearer {aiqs_token}", 'Content-Type': 'application/json'}, timeout=30)
                            print('AIQS RETRY STATUS:', retry_resp.status_code)
                            print('AIQS RETRY BODY:', retry_resp.text)

                            if retry_resp.status_code == 200:
                                result = retry_resp.json()
                                sealed = (result.get('response', {}).get('content', {}).get('validateFareResponse', {}).get('sealed') or result.get('response', {}).get('content', {}).get('sealed') or result.get('response', {}).get('sealed'))
                                result['sealed'] = sealed
                                if sealed:
                                    print(f"[SUCCESS] Retry validation successful, sealed token: {sealed[:50]}...")
                                    return Response(result, status=status.HTTP_200_OK)
                                else:
                                    print('[WARNING] Retry validation returned no sealed token')
                            else:
                                print('[ERROR] Retry validation failed')
                        else:
                            print('[WARNING] Re-search did not return any supplierSpecific to retry')
                    except Exception as re_err:
                        print('❌ Re-search and retry failed:', str(re_err))

                return Response({'error': 'Validation failed', 'details': f"{error_msg}. The flight may have expired or is no longer available. Please search again.", 'aiqs_error': error_in_content}, status=status.HTTP_400_BAD_REQUEST)

            # Try multiple paths for sealed token
            if 'response' in result:
                sealed = (result.get('response', {}).get('content', {}).get('validateFareResponse', {}).get('sealed') or result.get('response', {}).get('content', {}).get('sealed') or result.get('response', {}).get('sealed'))

            result['sealed'] = sealed

            if sealed:
                print(f"✅ Validation successful, sealed token: {sealed[:50]}...")
            else:
                print("⚠️ Warning: Validation succeeded but no sealed token found")
                return Response({'error': 'Validation incomplete', 'details': 'No sealed token received. The flight may have expired. Please search again.', 'response': result}, status=status.HTTP_400_BAD_REQUEST)

            return Response(result, status=status.HTTP_200_OK)

        except requests.exceptions.RequestException as e:
            return Response({"error": "Validation failed", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({"error": "Validation failed", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _build_validate_request(self, flight_data):
        """Build validation request from flight data matching AIQS format exactly"""
        # Extract supplier specific data
        # Different suppliers use different formats:
        # - Supplier 11 (Jazeera/J9): token, fareKey, currency format
        # - Supplier 2 (Emirates/WY): traceId, segRef, brandTier format
        # Both formats are valid according to AIQS documentation
        supplier_specific = flight_data.get('supplierSpecific')
        
        # Only include supplierSpecific if it has actual data
        if supplier_specific is None or supplier_specific == {}:
            supplier_specific_array = []
        elif isinstance(supplier_specific, dict):
            supplier_specific_array = [supplier_specific]
        elif isinstance(supplier_specific, list):
            supplier_specific_array = supplier_specific
        else:
            supplier_specific_array = []
        
        # Get brandId - can be at flight level or in fare - ensure it's an integer
        brand_id = flight_data.get('brandId') or flight_data.get('fare', {}).get('brandId', 1)
        try:
            brand_id = int(brand_id)
        except (ValueError, TypeError):
            brand_id = 1
        
        # Build segment group from flight segments - FLAT STRUCTURE (one per flight)
        # Each segmentGroup item has flifo as an object, not array
        segment_group = []

        # If rawData is present, prefer exact values from the original search
        raw_ond_pairs = (flight_data.get('rawData') or {}).get('ondPairs', [])
        rbd_map = {}
        company_map = {}
        # Build mapping of ond/seg -> values from rawData
        for ond_idx, ond_pair in enumerate(raw_ond_pairs):
            flight_details = ond_pair.get('flightDetails', [])
            for seg_idx, fd in enumerate(flight_details):
                flifo_raw = fd.get('flifo', {})
                key = f"{ond_idx}-{seg_idx}"
                rbd_map[key] = flifo_raw.get('rbd') or flifo_raw.get('rbdCode') or flifo_raw.get('rbd')
                company_id = fd.get('companyId') or {}
                company_map[key] = {
                    'mktgAirline': company_id.get('mktgAirline') or flifo_raw.get('mktgAirline'),
                    'operAirline': company_id.get('operAirline') or flifo_raw.get('operAirline') or company_id.get('operAirline')
                }

        for segment_idx, segment in enumerate(flight_data.get('segments', [])):
            ond_id = segment.get('ond', {}).get('ondID', segment_idx)
            seg_id = 0

            for flight_detail in segment.get('flights', []):
                key = f"{segment_idx}-{seg_id}"

                # Prefer raw values when available to avoid RBD/airline mismatches
                rbd_val = rbd_map.get(key) or flight_detail.get('cabin') or flight_detail.get('rbd')
                company_vals = company_map.get(key, {})

                flifo = {
                    "dateTime": {
                        "depDate": flight_detail.get('departureDate'),
                        "depTime": flight_detail.get('departureTime'),
                        "arrDate": flight_detail.get('arrivalDate'),
                        "arrTime": flight_detail.get('arrivalTime')
                    },
                    "location": {
                        "depAirport": flight_detail.get('departureLocation'),
                        "arrAirport": flight_detail.get('arrivalLocation')
                    },
                    "mktgAirline": company_vals.get('mktgAirline') or flight_detail.get('airlineCode'),
                    "operAirline": company_vals.get('operAirline') or flight_detail.get('operatingAirline') or flight_detail.get('airlineCode'),
                    "issuingAirline": segment.get('ond', {}).get('issuingAirline') or flight_detail.get('airlineCode'),
                    "flightNo": flight_detail.get('flightNo'),
                    "rbd": rbd_val,
                    "flightTypeDetails": {
                        "ondID": ond_id,
                        "segID": seg_id
                    }
                }

                # Log when there is an RBD mismatch between parsed and raw
                try:
                    parsed_rbd = flight_detail.get('cabin')
                    if rbd_val and parsed_rbd and rbd_val != parsed_rbd:
                        print(f"⚠️ RBD mismatch for segment {key}: raw='{rbd_val}' parsed='{parsed_rbd}'")
                except Exception:
                    pass

                segment_obj = {"flifo": flifo}
                segment_group.append(segment_obj)
                seg_id += 1
        
        # Determine credential based on supplier. Prefer `supplierCodes`,
        # otherwise fall back to single `supplierCode` present on flight data.
        supplier_codes = flight_data.get('supplierCodes') or [flight_data.get('supplierCode', 11)]
        supplier_code = supplier_codes[0] if supplier_codes else 11
        
        # Get credential from mapping or use default
        select_credential = SUPPLIER_CREDENTIAL_MAP.get(supplier_code, DEFAULT_CREDENTIAL)
        
        # Extract origin and destination from segments if not provided
        origin = flight_data.get('origin', '')
        destination = flight_data.get('destination', '')
        
        if not origin and flight_data.get('segments'):
            first_segment = flight_data['segments'][0]
            first_flight = first_segment.get('flights', [])[0] if first_segment.get('flights') else {}
            origin = first_flight.get('departureLocation', '')
            
        if not destination and flight_data.get('segments'):
            last_segment = flight_data['segments'][-1]
            last_flight = last_segment.get('flights', [])[-1] if last_segment.get('flights') else {}
            destination = last_flight.get('arrivalLocation', '')
        
        return {
            "request": {
                "service": "FlightRQ",
                "supplierCodes": supplier_codes,
                "node": {
                    "agencyCode": "CLI_11078"
                },
                "content": {
                    "command": "FlightValidateRQ",
                    "validateFareRequest": {
                        "target": "Test",
                        "adt": flight_data.get('adt', 1),
                        "chd": flight_data.get('chd', 0),
                        "inf": flight_data.get('inf', 0),
                        "totalAmount": flight_data.get('fare', {}).get('total', 0),
                        "segmentGroup": segment_group,
                        "tripType": flight_data.get('tripType', 'O'),
                        "from": origin,
                        "to": destination
                    },
                    "supplierSpecific": supplier_specific_array
                },
                "selectCredential": select_credential
            }
        }


class AIQSTokenView(APIView):
    """Return cached AIQS id_token to frontend to avoid CORS on auth endpoint"""
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        try:
            # Allow forcing a refresh from the frontend when tokens appear invalid
            force = str(request.query_params.get('force', '')).lower() in ('1', 'true', 'yes')
            if force:
                try:
                    AuthenticationService.clear_cache()
                except Exception:
                    pass

            tokens = AuthenticationService.get_tokens()
            # tokens keys may vary; return common names
            id_token = tokens.get('id_token') or tokens.get('idToken') or tokens.get('idtoken')
            access_token = tokens.get('access_token') or tokens.get('accessToken')
            if not id_token and not access_token:
                return Response({'error': 'No token available'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            return Response({'id_token': id_token, 'access_token': access_token}, status=status.HTTP_200_OK)
        except Exception as e:
            # Common mistake: frontends sometimes send these AIQS tokens as the
            # Authorization header when calling our Django API endpoints. That
            # will fail Django's JWT auth ("token_not_valid"). Only use these
            # tokens when calling AIQS endpoints from the SERVER side. If you
            # intended to refresh tokens, call this endpoint with `?force=true`.
            return Response({'error': 'Failed to get token', 'details': str(e), 'hint': 'Do not use AIQS tokens as Authorization for this API. Call this endpoint with ?force=true to force refresh.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CreateBookingView(APIView):
    """Create flight booking (PNR)"""
    permission_classes = [AllowAny]
    # Booking requests are proxied to AIQS from the server. Disable DRF
    # authentication here to avoid accidental JWT validation failures when
    # the frontend includes AIQS tokens in Authorization.
    authentication_classes = []
    
    # swagger_auto_schema(...) removed to avoid decorator side-effects in this environment
    def post(self, request):
        """Create booking"""
        serializer = CreateBookingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": "Invalid request", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            flight_data = serializer.validated_data['flightData']
            passengers = serializer.validated_data['passengers']
            sealed = serializer.validated_data['sealed']
            tokens = AuthenticationService.get_tokens()
            
            # Build booking request
            booking_request = self._build_booking_request(flight_data, passengers, sealed)
            
            # Call AIQS booking API
            headers = {
                'Authorization': f"Bearer {tokens['id_token']}",
                'Content-Type': 'application/json'
            }
            
            response = requests.post(
                f"{REST_ENDPOINT}/api/air/book",
                json=booking_request,
                headers=headers,
                timeout=60
            )
            response.raise_for_status()
            
            return Response(response.json(), status=status.HTTP_200_OK)
            
        except requests.exceptions.RequestException as e:
            return Response(
                {"error": "Booking failed", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            return Response(
                {"error": "Booking failed", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _build_booking_request(self, flight_data, passengers, sealed):
        """Build booking request"""
        # Build traveler info
        traveler_info = []
        for idx, pax in enumerate(passengers, 1):
            traveler = {
                "paxType": pax['paxType'],
                "gender": pax['gender'],
                "salutation": pax['salutation'],
                "givenName": pax['givenName'],
                "surName": pax['surName'],
                "birthDate": pax['birthDate'],
                "docType": pax['docType'],
                "docID": pax['docID'],
                "docIssueCountry": pax['docIssueCountry'],
                "expiryDate": pax['expiryDate'],
                "nationality": pax['nationality'],
                "contact": {
                    "emailList": [
                        {
                            "emailId": pax['email'],
                            "emailType": {"id": 1}
                        }
                    ],
                    "phoneList": [
                        {
                            "number": pax['phone'],
                            "phoneType": {"id": 1},
                            "country": {
                                "code": pax['countryCode'],
                                "telephonecode": pax['phoneCode']
                            }
                        }
                    ]
                }
            }
            traveler_info.append(traveler)
        
        # Determine credential based on supplier code
        supplier_codes = flight_data.get('supplierCodes', [11])
        supplier_code = supplier_codes[0] if supplier_codes else 11
        
        # Get credential from mapping or use default
        select_credential = SUPPLIER_CREDENTIAL_MAP.get(supplier_code, DEFAULT_CREDENTIAL)
        
        # Build ondPairs based on trip type
        trip_type = flight_data.get('tripType', 'O')
        ond_pairs = []
        
        if trip_type == 'R' or trip_type == 'return':
            # Round trip: build outbound and return ondPairs
            segments = flight_data.get('segments', [])
            if len(segments) >= 2:
                # Outbound (first segment)
                outbound_segment = segments[0]
                outbound_flights = outbound_segment.get('flights', [])
                if outbound_flights:
                    first_flight = outbound_flights[0]
                    last_flight = outbound_flights[-1]
                    
                    outbound_ond = {
                        "originCity": first_flight.get('departureLocation', ''),
                        "destinationCity": last_flight.get('arrivalLocation', ''),
                        "segments": []
                    }
                    
                    for flight in outbound_flights:
                        segment_data = {
                            "depDate": flight.get('departureDate', ''),
                            "depTime": flight.get('departureTime', ''),
                            "arrDate": flight.get('arrivalDate', ''),
                            "arrTime": flight.get('arrivalTime', ''),
                            "duration": flight.get('duration', ''),
                            "depAirport": flight.get('departureLocation', ''),
                            "arrAirport": flight.get('arrivalLocation', ''),
                            "mktgAirline": flight.get('airlineCode', ''),
                            "operAirline": flight.get('operatingAirline', ''),
                            "issuingAirline": flight.get('airlineCode', ''),
                            "flightNo": flight.get('flightNo', ''),
                            "cabin": flight.get('cabin', 'Y'),
                            "rbd": flight.get('cabin', 'Y'),
                            "arrTerminal": flight.get('arrivalTerminal', ''),
                            "depTerminal": flight.get('departureTerminal', ''),
                            "eqpType": flight.get('equipmentType', ''),
                            "stopQuantity": flight.get('stops', 0),
                            "baggageAllowance": flight.get('baggage', [])
                        }
                        outbound_ond["segments"].append(segment_data)
                    
                    ond_pairs.append(outbound_ond)
                
                # Return (second segment)
                return_segment = segments[1]
                return_flights = return_segment.get('flights', [])
                if return_flights:
                    first_flight = return_flights[0]
                    last_flight = return_flights[-1]
                    
                    return_ond = {
                        "originCity": first_flight.get('departureLocation', ''),
                        "destinationCity": last_flight.get('arrivalLocation', ''),
                        "segments": []
                    }
                    
                    for flight in return_flights:
                        segment_data = {
                            "depDate": flight.get('departureDate', ''),
                            "depTime": flight.get('departureTime', ''),
                            "arrDate": flight.get('arrivalDate', ''),
                            "arrTime": flight.get('arrivalTime', ''),
                            "duration": flight.get('duration', ''),
                            "depAirport": flight.get('departureLocation', ''),
                            "arrAirport": flight.get('arrivalLocation', ''),
                            "mktgAirline": flight.get('airlineCode', ''),
                            "operAirline": flight.get('operatingAirline', ''),
                            "issuingAirline": flight.get('airlineCode', ''),
                            "flightNo": flight.get('flightNo', ''),
                            "cabin": flight.get('cabin', 'Y'),
                            "rbd": flight.get('cabin', 'Y'),
                            "arrTerminal": flight.get('arrivalTerminal', ''),
                            "depTerminal": flight.get('departureTerminal', ''),
                            "eqpType": flight.get('equipmentType', ''),
                            "stopQuantity": flight.get('stops', 0),
                            "baggageAllowance": flight.get('baggage', [])
                        }
                        return_ond["segments"].append(segment_data)
                    
                    ond_pairs.append(return_ond)
        elif trip_type == 'M' or trip_type == 'multicity':
            # Multi-city: build ondPairs for each segment
            segments = flight_data.get('segments', [])
            for segment in segments:
                flights = segment.get('flights', [])
                if flights:
                    first_flight = flights[0]
                    last_flight = flights[-1]
                    
                    ond = {
                        "originCity": first_flight.get('departureLocation', ''),
                        "destinationCity": last_flight.get('arrivalLocation', ''),
                        "segments": []
                    }
                    
                    for flight in flights:
                        segment_data = {
                            "depDate": flight.get('departureDate', ''),
                            "depTime": flight.get('departureTime', ''),
                            "arrDate": flight.get('arrivalDate', ''),
                            "arrTime": flight.get('arrivalTime', ''),
                            "duration": flight.get('duration', ''),
                            "depAirport": flight.get('departureLocation', ''),
                            "arrAirport": flight.get('arrivalLocation', ''),
                            "mktgAirline": flight.get('airlineCode', ''),
                            "operAirline": flight.get('operatingAirline', ''),
                            "issuingAirline": flight.get('airlineCode', ''),
                            "flightNo": flight.get('flightNo', ''),
                            "cabin": flight.get('cabin', 'Y'),
                            "rbd": flight.get('cabin', 'Y'),
                            "arrTerminal": flight.get('arrivalTerminal', ''),
                            "depTerminal": flight.get('departureTerminal', ''),
                            "eqpType": flight.get('equipmentType', ''),
                            "stopQuantity": flight.get('stops', 0),
                            "baggageAllowance": flight.get('baggage', [])
                        }
                        ond["segments"].append(segment_data)
                    
                    ond_pairs.append(ond)
        else:
            # One way or other types: use existing logic
            ond_pairs = flight_data.get('ondPairs', [])
        
        return {
            "request": {
                "service": "FlightRQ",
                "content": {
                    "command": "FlightBookRQ",
                    "supplierSpecific": flight_data.get('supplierSpecific', {}),
                    "bookFlightRQ": {
                        "tripType": "M" if (trip_type == 'M' or trip_type == 'multicity') else ("R" if (trip_type == 'R' or trip_type == 'return') else "O"),
                        "adt": len([p for p in passengers if p['paxType'] == 'ADT']),
                        "chd": len([p for p in passengers if p['paxType'] == 'CHD']),
                        "inf": len([p for p in passengers if p['paxType'] == 'INF']),
                        "travelerInfo": traveler_info,
                        "ondPairs": ond_pairs,
                        "fare": flight_data.get('fare', {}),
                        "sealed": sealed
                    }
                },
                "node": {
                    "agencyCode": "CLI_11078"  # Use your agency code
                },
                "selectCredential": select_credential,
                "supplierCodes": supplier_codes
            }
        }


class SaveBookingView(APIView):
    """
    Save flight booking to database
    """
    permission_classes = [AllowAny]
    # Saving to local DB does not require the frontend to present an AIQS
    # token as Authorization; skip DRF auth to avoid token_not_valid errors.
    authentication_classes = []

    # swagger_auto_schema(...) removed to avoid decorator side-effects in this environment
    def post(self, request):
        try:
            print("📥 Received booking save request")
            print("Request data:", request.data)
            
            serializer = SaveBookingSerializer(data=request.data)
            if not serializer.is_valid():
                print("❌ Validation failed:", serializer.errors)
                return Response({
                    'error': 'Invalid data',
                    'details': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

            data = serializer.validated_data
            print("✅ Data validated successfully")

            # Create booking instance
            booking = FlightBooking.objects.create(
                pnr=data['pnr'],
                booking_ref_id=data['bookingRefId'],
                status=data.get('status', 'HK'),
                airline_locator=data.get('airlineLocator', ''),
                airline_code=data.get('airline', ''),
                passenger_name=data['passengerName'],
                passenger_email=data['passengerEmail'],
                passenger_phone=data['passengerPhone'],
                nationality=data.get('nationality', ''),
                passport_number=data.get('passportNumber', ''),
                date_of_birth=data.get('dateOfBirth', ''),
                origin=data['origin'],
                destination=data['destination'],
                origin_city=data.get('originCity', ''),
                destination_city=data.get('destinationCity', ''),
                departure_date=data.get('departureDate', ''),
                arrival_date=data.get('arrivalDate', ''),
                flight_number=data.get('flightNumber', ''),
                cabin_class=data.get('cabin', 'Economy'),
                base_fare=data.get('baseFare', 0),
                tax=data.get('tax', 0),
                total_fare=data['totalFare'],
                currency=data.get('currency', 'PKR'),
                segments=data.get('segments'),
                supplier_code=data.get('supplierCode'),
                user=request.user if request.user.is_authenticated else None
            )
            
            print(f"✅ Booking saved successfully: PNR={booking.pnr}")

            response_serializer = FlightBookingSerializer(booking)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)


        except Exception as e:
            print(f"❌ Error saving booking: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': 'Failed to save booking',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ListBookingsView(APIView):
    """
    List all flight bookings for the authenticated user or all bookings
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    # swagger_auto_schema(...) removed to avoid decorator side-effects in this environment
    def get(self, request):
        try:
            # Base queryset
            queryset = FlightBooking.objects.all()

            # Filter by user if authenticated
            if request.user.is_authenticated:
                queryset = queryset.filter(user=request.user)

            # Apply filters
            status_filter = request.query_params.get('status')
            if status_filter:
                queryset = queryset.filter(status=status_filter)

            pnr_filter = request.query_params.get('pnr')
            if pnr_filter:
                queryset = queryset.filter(pnr__icontains=pnr_filter)

            serializer = FlightBookingSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': 'Failed to retrieve bookings',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BookingDetailView(APIView):
    """
    Get details of a specific booking by booking_ref_id
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    @swagger_auto_schema(
        operation_description="Get booking details by booking reference ID",
        responses={
            200: openapi.Response("Booking details", FlightBookingSerializer),
            404: "Booking not found"
        }
    )
    def get(self, request, booking_ref_id):
        try:
            booking = FlightBooking.objects.get(booking_ref_id=booking_ref_id)
            
            # Check user permission if authenticated
            if request.user.is_authenticated and booking.user and booking.user != request.user:
                return Response({
                    'error': 'Access denied'
                }, status=status.HTTP_403_FORBIDDEN)

            serializer = FlightBookingSerializer(booking)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except FlightBooking.DoesNotExist:
            return Response({
                'error': 'Booking not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': 'Failed to retrieve booking',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FareRulesView(APIView):
    """
    Get fare rules for a flight using AIQS /api/air/farerule endpoint
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    @swagger_auto_schema(
        operation_description="Get fare rules for a flight",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'flightData': openapi.Schema(type=openapi.TYPE_OBJECT),
                'sealed': openapi.Schema(type=openapi.TYPE_STRING)
            }
        ),
        responses={
            200: openapi.Response("Fare rules retrieved"),
            400: "Invalid data"
        }
    )
    def post(self, request):
        try:
            flight_data = request.data.get('flightData')
            # Prefer client-provided AIQS token (from search) to avoid mismatch
            aiqs_token = request.data.get('token') or flight_data.get('token') if flight_data else None

            if not flight_data:
                return Response({
                    'error': 'Flight data is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            print("🔍 Inspecting flight_data structure:")
            print(f"  Keys: {list(flight_data.keys())}")
            print(f"  Has rawData: {'rawData' in flight_data}")
            print(f"  Has validateFareResponse: {'validateFareResponse' in flight_data}")

            # Get supplier code
            supplier_codes = flight_data.get('supplierCodes', [flight_data.get('supplierCode', 11)])
            supplier_code = supplier_codes[0] if supplier_codes else 11
            select_credential = SUPPLIER_CREDENTIAL_MAP.get(supplier_code, DEFAULT_CREDENTIAL)

            # Get auth token
            auth_service = AuthenticationService()
            tokens = auth_service.get_tokens()
            id_token = tokens.get('id_token')

            # Extract rawData (contains original flight segment details from AIQS)
            # Try multiple paths: rawData.ondPairs or validateFareResponse.segmentGroup
            raw_data = flight_data.get('rawData', {})
            ond_pairs = raw_data.get('ondPairs', [])
            
            # Fallback: if no ondPairs, try to get from validateFareResponse.segmentGroup
            validate_response = flight_data.get('validateFareResponse', {})
            segment_group_from_validate = validate_response.get('segmentGroup', [])
            
            # Parse passenger counts
            passengers = flight_data.get('passengers', {})
            adt = passengers.get('adt', 1)
            chd = passengers.get('chd', 0)
            inf = passengers.get('inf', 0)
            
            # Get total amount from fare
            fare = flight_data.get('fare', {})
            total_amount = fare.get('total', 0)

            # Determine trip type from ondPairs count
            trip_type = "O"  # Default to OneWay
            if ond_pairs:
                ond_count = len(ond_pairs)
                if ond_count == 2:
                    trip_type = "R"  # RoundTrip
                elif ond_count > 2:
                    trip_type = "M"  # MultiCity
            elif segment_group_from_validate:
                # Fallback: determine from segmentGroup
                ond_ids = set()
                for seg in segment_group_from_validate:
                    ond_ids.add(seg.get('ondID', 0))
                ond_count = len(ond_ids)
                if ond_count == 2:
                    trip_type = "R"
                elif ond_count > 2:
                    trip_type = "M"
            
            print(f"🎯 Determined trip type: {trip_type} (from {len(ond_pairs) if ond_pairs else len(segment_group_from_validate)} ond pairs)")

            # Build segmentGroup from rawData.ondPairs (AIQS search response structure)
            segment_group = []
            origin = ''
            destination = ''
            
            # If we have ondPairs, use that (original search structure)
            if ond_pairs:
                print("📦 Building segmentGroup from rawData.ondPairs")
                for ond_pair in ond_pairs:
                    # Try both 'flights' and 'flightDetails' (different AIQS response formats)
                    flights_in_ond = ond_pair.get('flights', ond_pair.get('flightDetails', []))
                    ond_info = ond_pair.get('ond', {})
                    ond_id = ond_info.get('ondID', 0)
                    
                    for flight in flights_in_ond:
                        # Check if flight has 'legs' (nested structure) or 'flifo' (flat structure)
                        if 'legs' in flight:
                            # Nested structure: flight.legs[]
                            legs = flight.get('legs', [])
                            if not origin and legs:
                                origin = legs[0].get('departureAirport', '')
                            if not destination and legs:
                                destination = legs[-1].get('arrivalAirport', '')
                            
                            for leg in legs:
                                dep_date = leg.get('departureDate', '')
                                dep_time = leg.get('departureTime', '')
                                arr_date = leg.get('arrivalDate', '')
                                arr_time = leg.get('arrivalTime', '')
                                dep_airport = leg.get('departureAirport', '')
                                arr_airport = leg.get('arrivalAirport', '')
                                airline = leg.get('marketingAirline', '')
                                flight_no = leg.get('flightNumber', '')
                                rbd = leg.get('bookingClass', '')
                                seg_id = leg.get('segID', 0)
                                
                                segment = {
                                    "brandId": 0,
                                    "flifo": {
                                        "dateTime": {
                                            "depDate": dep_date,
                                            "depTime": dep_time,
                                            "arrDate": arr_date,
                                            "arrTime": arr_time
                                        },
                                        "location": {
                                            "depAirport": dep_airport,
                                            "arrAirport": arr_airport
                                        },
                                        "mktgAirline": airline,
                                        "operAirline": airline,
                                        "issuingAirline": airline,
                                        "flightNo": flight_no,
                                        "rbd": rbd,
                                        "flightTypeDetails": {
                                            "ondID": ond_id,
                                            "segID": seg_id
                                        }
                                    }
                                }
                                segment_group.append(segment)
                        elif 'flifo' in flight:
                            # Flat structure: flight.flifo directly
                            seg_id = flight.get('segID', 0)
                            flifo = flight.get('flifo', {})
                            date_time = flifo.get('dateTime', {})
                            location = flifo.get('location', {})
                            company_id = flifo.get('companyId', {})
                            
                            dep_airport = location.get('depAirport', '')
                            arr_airport = location.get('arrAirport', '')
                            
                            if not origin:
                                origin = dep_airport
                            destination = arr_airport  # Keep updating to get final destination
                            
                            segment = {
                                "brandId": 0,
                                "flifo": {
                                    "dateTime": {
                                        "depDate": date_time.get('depDate', ''),
                                        "depTime": date_time.get('depTime', ''),
                                        "arrDate": date_time.get('arrDate', ''),
                                        "arrTime": date_time.get('arrTime', '')
                                    },
                                    "location": {
                                        "depAirport": dep_airport,
                                        "arrAirport": arr_airport
                                    },
                                    "mktgAirline": company_id.get('mktgAirline', ''),
                                    "operAirline": company_id.get('operAirline', ''),
                                    "issuingAirline": company_id.get('mktgAirline', ''),
                                    "flightNo": flifo.get('flightNo', ''),
                                    "rbd": flifo.get('rbd', ''),
                                    "flightTypeDetails": {
                                        "ondID": ond_id,
                                        "segID": seg_id
                                    }
                                }
                            }
                            segment_group.append(segment)
            
            # Fallback: Use validateFareResponse.segmentGroup if ondPairs is empty
            elif segment_group_from_validate:
                print("📦 Building segmentGroup from validateFareResponse.segmentGroup")
                for seg in segment_group_from_validate:
                    seg_info = seg.get('segInfo', {})
                    flifo = seg_info.get('flifo', {})
                    date_time = seg_info.get('dateTime', {})
                    
                    origin = seg.get('originCity', origin)
                    destination = seg.get('destinationCity', destination)
                    
                    segment = {
                        "brandId": 0,
                        "flifo": {
                            "dateTime": {
                                "depDate": date_time.get('depDate', ''),
                                "depTime": date_time.get('depTime', ''),
                                "arrDate": date_time.get('arrDate', ''),
                                "arrTime": date_time.get('arrTime', '')
                            },
                            "location": {
                                "depAirport": flifo.get('depAirport', ''),
                                "arrAirport": flifo.get('arrAirport', '')
                            },
                            "mktgAirline": flifo.get('mktgAirline', ''),
                            "operAirline": flifo.get('operAirline', ''),
                            "issuingAirline": flifo.get('issuingAirline', ''),
                            "flightNo": flifo.get('flightNo', ''),
                            "rbd": flifo.get('rbd', ''),
                            "flightTypeDetails": {
                                "ondID": seg.get('ondID', 0),
                                "segID": seg_info.get('segID', 0)
                            }
                        }
                    }
                    segment_group.append(segment)
            
            print(f"✅ Built segmentGroup with {len(segment_group)} segments")

            # Get supplierSpecific
            supplier_specific_raw = flight_data.get('supplierSpecific')
            if supplier_specific_raw is None:
                supplier_specific_array = []
            elif isinstance(supplier_specific_raw, list):
                supplier_specific_array = supplier_specific_raw
            elif isinstance(supplier_specific_raw, dict):
                supplier_specific_array = [supplier_specific_raw]
            else:
                supplier_specific_array = []

            # Override origin/destination if provided at root level
            if not origin:
                origin = flight_data.get('origin', '')
            if not destination:
                destination = flight_data.get('destination', '')

            # Build correct AIQS farerule request per Postman collection
            payload = {
                "request": {
                    "service": "FlightRQ",
                    "supplierCodes": [supplier_code],
                    "node": {"agencyCode": "CLI_11078"},
                    "content": {
                        "command": "FlightFareruleRQ",
                        "fareRuleRequest": {
                            "target": "Test",
                            "adt": adt,
                            "chd": chd,
                            "inf": inf,
                            "segmentGroup": segment_group,
                            "tripType": trip_type,  # O=OneWay, R=RoundTrip, M=MultiCity
                            "from": origin,
                            "to": destination
                        },
                        "supplierSpecific": supplier_specific_array
                    },
                    "selectCredential": select_credential
                }
            }

            print(f"📜 Fetching fare rules for supplier {supplier_code}")
            print("📥 Fare rules payload:", payload)

            # Use client token if provided, otherwise server-side id_token
            use_token = aiqs_token or id_token

            # Call AIQS API at correct endpoint: /api/air/farerule
            response = requests.post(
                f"{REST_ENDPOINT}/api/air/farerule",
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {use_token}"
                },
                timeout=30
            )

            print(f"📡 AIQS Response Status: {response.status_code}")
            
            if response.status_code == 200:
                return Response(response.json())
            else:
                return Response({"error": "Failed to fetch rules", "details": response.text}, status=response.status_code)

        except Exception as e:
            print(f"❌ Exception in FareRulesView: {str(e)}")
            return Response({"error": str(e)}, status=500)


class RetrievePNRView(APIView):
    """
    Retrieve PNR / booking details from AIQS using FlightRetrieveBookingRQ
    Accepts either the documented AIQS wrapper or a simplified payload.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    @swagger_auto_schema(
        operation_description="Retrieve booking/PNR details from AIQS",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            description='AIQS FlightRetrieveBookingRQ wrapper or simplified payload',
        ),
        responses={200: "Retrieve success", 400: "Bad request", 502: "AIQS returned error"}
    )
    def post(self, request):
        try:
            data = request.data

            # Determine payload to forward to AIQS.
            # Forward the full wrapper when the client sent { "request": { ... } }
            # because AIQS expects the outer wrapper; do NOT strip to inner `request`.
            if isinstance(data, dict) and data.get('request'):
                aiqs_request_payload = data  # forward full body
            else:
                # If client passed the inner content directly, forward as-is
                aiqs_request_payload = data

            # Prefer client-provided AIQS token; check both top-level and inside `request`
            client_token = None
            if isinstance(data, dict):
                client_token = (data.get('request') or {}).get('token') or data.get('token') or (data.get('request') or {}).get('content', {}).get('token')

            if not client_token:
                tokens = AuthenticationService.get_tokens()
                client_token = tokens.get('id_token') or tokens.get('access_token')

            headers = {
                'Content-Type': 'application/json'
            }
            if client_token:
                headers['Authorization'] = f"Bearer {client_token}"

            url = f"{REST_ENDPOINT}/api/air/retrievePNR"
            print(f"➡️ Forwarding RetrievePNR to AIQS: {url}")
            print(f"🔑 Using token from: {'client' if request.data.get('request') or request.data.get('token') else 'server cache'}")

            resp = requests.post(url, json=aiqs_request_payload, headers=headers, timeout=60)
            print("AIQS RetrievePNR status:", resp.status_code)
            print("AIQS RetrievePNR body:", resp.text[:1000])

            # Parse AIQS response
            try:
                aiqs_json = resp.json()
            except Exception:
                aiqs_json = None

            # If client asked to persist the retrieved booking, attempt to map and save
            save_requested = str(request.query_params.get('save', '')).lower() == 'true' or bool(request.data.get('save'))
            saved_booking = None
            if save_requested and aiqs_json:
                try:
                    # Heuristic mapping from AIQS retrieve response to SaveBookingSerializer shape
                        # Prefer tripDetailsUiData.response and tripDetailRS under response.content
                        aiqs_content = None
                        if isinstance(aiqs_json, dict):
                            # AIQS may return {"response": {"content": {...}}}
                            aiqs_content = (aiqs_json.get('response') or {}).get('content') or aiqs_json.get('content') or aiqs_json

                        booking_obj = aiqs_content or aiqs_json or {}

                        # If tripDetailsUiData.response exists, prefer it
                        ui_resp = (booking_obj.get('tripDetailsUiData') or {}).get('response') if booking_obj.get('tripDetailsUiData') else None
                        # Some payloads nest under tripDetailRS.tripDetailsUiData.response
                        if not ui_resp and booking_obj.get('tripDetailRS'):
                            ui_resp = (booking_obj.get('tripDetailRS') or {}).get('tripDetailsUiData', {}).get('response') if (booking_obj.get('tripDetailRS') or {}).get('tripDetailsUiData') else None

                        source = ui_resp or booking_obj or {}

                        save_payload = {
                            'pnr': (source.get('pnr') or (booking_obj.get('tripDetailRS') or {}).get('pnr') or request.data.get('request', {}).get('content', {}).get('tripDetailRQ', {}).get('bookingRefId') or request.data.get('bookingRefId')),
                            'bookingRefId': (booking_obj.get('tripDetailRS') or {}).get('bookingRefId' ) or request.data.get('request', {}).get('content', {}).get('tripDetailRQ', {}).get('bookingRefId') or request.data.get('bookingRefId'),
                            'status': source.get('bookingStatus') or source.get('bookingStatusName') or booking_obj.get('status') or 'HK',
                            'airlineLocator': source.get('airlineLocator') or booking_obj.get('airlineLocator') or '',
                            'airline': source.get('airlineCode') or booking_obj.get('airline') or '',
                            'passengerName': None,
                            'passengerEmail': None,
                            'passengerPhone': None,
                            'nationality': None,
                            'passportNumber': None,
                            'dateOfBirth': None,
                            'origin': None,
                            'destination': None,
                            'originCity': None,
                            'destinationCity': None,
                            'departureDate': None,
                            'arrivalDate': None,
                            'flightNumber': None,
                            'cabin': None,
                            'baseFare': None,
                            'tax': None,
                            'totalFare': None,
                            'currency': None,
                            'segments': None,
                            'supplierCode': request.data.get('request', {}).get('supplierCodes', [None])[0] if isinstance(request.data, dict) else None
                        }

                        # traveler info
                        trav = None
                        if source.get('travelerInfo') and isinstance(source.get('travelerInfo'), list) and len(source.get('travelerInfo'))>0:
                            trav = source.get('travelerInfo')[0]
                        elif booking_obj.get('tripDetailsUiData') and booking_obj.get('tripDetailsUiData').get('response') and booking_obj.get('tripDetailsUiData').get('response').get('travelerInfo'):
                            trav = booking_obj.get('tripDetailsUiData').get('response').get('travelerInfo')[0]

                        if trav:
                            save_payload['passengerName'] = (trav.get('givenName') or trav.get('given_name') or '') + ' ' + (trav.get('surName') or trav.get('sur_name') or '')
                            save_payload['passengerName'] = save_payload['passengerName'].strip() or None
                            # email
                            email = None
                            if trav.get('contact') and trav.get('contact').get('emailList'):
                                try:
                                    email = trav.get('contact').get('emailList')[0].get('emailId')
                                except Exception:
                                    email = None
                            save_payload['passengerEmail'] = email
                            # phone
                            phone = None
                            if trav.get('contact') and trav.get('contact').get('phoneList'):
                                try:
                                    phone = trav.get('contact').get('phoneList')[0].get('number')
                                except Exception:
                                    phone = None
                            save_payload['passengerPhone'] = phone
                            save_payload['nationality'] = trav.get('nationality')
                            save_payload['passportNumber'] = trav.get('documentNumber') or trav.get('passportNumber')
                            save_payload['dateOfBirth'] = trav.get('birthDate')

                        # fare
                        fare = None
                        if source.get('fare'):
                            fare = source.get('fare')
                        elif source.get('costBreakuppax') and isinstance(source.get('costBreakuppax'), list) and len(source.get('costBreakuppax'))>0:
                            fare = source.get('costBreakuppax')[0]
                        if fare:
                            save_payload['baseFare'] = fare.get('baseFare') or fare.get('base')
                            save_payload['tax'] = fare.get('tax')
                            save_payload['totalFare'] = fare.get('total') or fare.get('totalFare')
                            save_payload['currency'] = fare.get('currency')

                        # segments / ondPairs
                        segs = None
                        if source.get('ondPairs') and isinstance(source.get('ondPairs'), list):
                            segs = []
                            for g in source.get('ondPairs'):
                                if g.get('segments'):
                                    segs.extend(g.get('segments'))
                            save_payload['segments'] = segs
                            if segs and len(segs)>0:
                                save_payload['origin'] = segs[0].get('depAirport') or segs[0].get('origin')
                                save_payload['destination'] = segs[-1].get('arrAirport') or segs[-1].get('destination')
                                save_payload['departureDate'] = segs[0].get('depDate')
                                save_payload['arrivalDate'] = segs[-1].get('arrDate')
                                save_payload['flightNumber'] = segs[0].get('flightNo')
                                save_payload['cabin'] = segs[0].get('cabin') or segs[0].get('rbd')

                        # bookingDate
                        save_payload['bookingDate'] = source.get('bookingDate') or (booking_obj.get('tripDetailRS') or {}).get('bookingDate')

                        # Ensure originCity / destinationCity are populated (serializer requires them)
                        if not save_payload.get('originCity'):
                            save_payload['originCity'] = save_payload.get('origin')
                        if not save_payload.get('destinationCity'):
                            save_payload['destinationCity'] = save_payload.get('destination')

                        # Minimal required fields validation
                        from .serializers import SaveBookingSerializer
                        serializer = SaveBookingSerializer(data=save_payload)
                        if serializer.is_valid():
                            valid = serializer.validated_data
                            # Create or update booking by bookingRefId
                            booking_model_vals = {
                                'pnr': valid.get('pnr') or '',
                                'status': valid.get('status', 'HK'),
                                'airline_locator': valid.get('airlineLocator', ''),
                                'airline_code': valid.get('airline', ''),
                                'passenger_name': valid.get('passengerName') or 'UNKNOWN',
                                'passenger_email': valid.get('passengerEmail') or '',
                                'passenger_phone': valid.get('passengerPhone') or '',
                                'nationality': valid.get('nationality', ''),
                                'passport_number': valid.get('passportNumber', ''),
                                'date_of_birth': valid.get('dateOfBirth', ''),
                                'origin': valid.get('origin') or '',
                                'destination': valid.get('destination') or '',
                                'origin_city': valid.get('originCity', ''),
                                'destination_city': valid.get('destinationCity', ''),
                                'departure_date': valid.get('departureDate', ''),
                                'arrival_date': valid.get('arrivalDate', ''),
                                'flight_number': valid.get('flightNumber', ''),
                                'cabin_class': valid.get('cabin', ''),
                                'base_fare': valid.get('baseFare') or 0,
                                'tax': valid.get('tax') or 0,
                                'total_fare': valid.get('totalFare') or 0,
                                'currency': valid.get('currency', 'PKR'),
                                'segments': valid.get('segments'),
                                'supplier_code': valid.get('supplierCode')
                            }

                            booking_obj_model, created = FlightBooking.objects.update_or_create(
                                booking_ref_id=valid['bookingRefId'],
                                defaults=booking_model_vals
                            )
                            print(f"✅ Retrieved booking {'created' if created else 'updated'} in DB: {booking_obj_model.booking_ref_id}")
                            from .serializers import FlightBookingSerializer
                            saved_booking = FlightBookingSerializer(booking_obj_model).data
                        else:
                            print("❌ SaveBookingSerializer invalid:", serializer.errors)
                except Exception as e:
                    print("❌ Error saving retrieved booking:", str(e))

            # If AIQS returned non-JSON (aiqs_json is None) but save requested,
            # attempt to persist a minimal record using bookingRefId from request.
            if save_requested and not aiqs_json:
                try:
                    # Try to extract bookingRefId from the forwarded payload
                    booking_ref = None
                    if isinstance(aiqs_request_payload, dict):
                        booking_ref = (aiqs_request_payload.get('content') or {}).get('tripDetailRQ', {}).get('bookingRefId')
                    if not booking_ref:
                        booking_ref = request.data.get('request', {}).get('content', {}).get('tripDetailRQ', {}).get('bookingRefId') or request.data.get('tripDetailRQ', {}).get('bookingRefId') if isinstance(request.data, dict) else None

                    if booking_ref:
                        # Persist a minimal error-marked booking record so UI can reflect saved state
                        defaults = {
                            'status': 'ERROR',
                            'pnr': f"ERR-{booking_ref}",
                            'passenger_name': 'UNKNOWN',
                            'passenger_email': '',
                            'passenger_phone': '',
                            'origin': '',
                            'destination': '',
                            'departure_date': '',
                            'arrival_date': '',
                            'flight_number': '',
                            'cabin_class': '',
                            'base_fare': 0,
                            'tax': 0,
                            'total_fare': 0,
                            'currency': 'PKR',
                            'segments': None,
                        }
                        booking_obj_model, created = FlightBooking.objects.update_or_create(
                            booking_ref_id=booking_ref,
                            defaults=defaults
                        )
                        from .serializers import FlightBookingSerializer
                        saved_booking = FlightBookingSerializer(booking_obj_model).data
                        print(f"⚠️ Saved minimal error booking for bookingRefId={booking_ref}")
                except Exception as e:
                    print("❌ Failed to save minimal error booking:", str(e))

            # Return AIQS JSON or text; include saved_booking if available.
            # If we managed to persist a minimal booking despite AIQS error, return 200
            # so the frontend can display the saved record and the AIQS error details.
            if saved_booking:
                result = {'savedBooking': saved_booking, 'aiqs_status': resp.status_code}
                if aiqs_json is not None:
                    result['aiqs'] = aiqs_json
                else:
                    result['aiqs_error'] = resp.text
                return Response(result, status=status.HTTP_200_OK)

            # Otherwise, return AIQS JSON or text with original AIQS status
            if aiqs_json is not None:
                return Response({'aiqs': aiqs_json}, status=resp.status_code)
            else:
                text_body = resp.text
                return Response({'text': text_body}, status=resp.status_code)

        except requests.exceptions.RequestException as e:
            print(f"❌ RequestException calling AIQS retrievePNR: {e}")
            return Response({'error': 'Failed to contact AIQS', 'details': str(e)}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as e:
            print(f"❌ Unexpected error in RetrievePNRView: {e}")
            import traceback
            traceback.print_exc()
            return Response({'error': 'Internal server error', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            print(f"📡 AIQS Response Body: {response.text[:500]}")

            # Handle 401 Unauthorized - fallback to server token
            if response.status_code == 401:
                try:
                    print('🔐 Client token unauthorized (401). Attempting server-cached token fallback for fare-rules')
                    server_tokens = AuthenticationService.get_tokens()
                    server_token = server_tokens.get('id_token') or server_tokens.get('access_token')
                    if server_token and server_token != use_token:
                        headers_fallback = {
                            'Authorization': f"Bearer {server_token}",
                            'Content-Type': 'application/json'
                        }
                        retry_resp = requests.post(
                            f"{REST_ENDPOINT}/api/air/farerule",
                            json=payload,
                            headers=headers_fallback,
                            timeout=30
                        )
                        print('AIQS FALLBACK STATUS:', retry_resp.status_code)
                        print('AIQS FALLBACK BODY:', retry_resp.text[:500])
                        response = retry_resp
                except Exception as fallback_err:
                    print(f"❌ Fallback attempt failed: {fallback_err}")

            if response.status_code != 200:
                return Response({
                    'error': 'Failed to fetch fare rules from AIQS',
                    'status': response.status_code,
                    'details': response.text
                }, status=status.HTTP_502_BAD_GATEWAY)

            result = response.json()
            fare_rules_response = result.get('response', {}).get('content', {}).get('fareRuleResponse', {})
            air_fare_rules = fare_rules_response.get('airFareRule', [])

            # Parse and format fare rules
            rules_formatted = []
            for rule in air_fare_rules:
                dep_airport = rule.get('depAirport', '')
                arr_airport = rule.get('arrAirport', '')
                fare_rule_details = rule.get('fareRuleDetails', [])
                
                segment_rules = {
                    'segment': f"{dep_airport} → {arr_airport}",
                    'rules': []
                }
                
                for detail in fare_rule_details:
                    segment_rules['rules'].append({
                        'category': detail.get('ruleHead', ''),
                        'text': detail.get('ruleBody', '')
                    })
                
                rules_formatted.append(segment_rules)

            print(f"✅ Fare rules retrieved successfully")

            return Response({
                'rules': rules_formatted,
                'rawData': fare_rules_response
            }, status=status.HTTP_200_OK)

        except requests.exceptions.Timeout:
            return Response({
                'error': 'Request timeout - please try again'
            }, status=status.HTTP_504_GATEWAY_TIMEOUT)
        except Exception as e:
            print(f"❌ Fare rules error: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': 'Failed to fetch fare rules',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BrandedFaresView(APIView):
    """
    Get branded fares for a flight using AIQS /api/air/getBrands endpoint
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    @swagger_auto_schema(
        operation_description="Get branded fares for a flight",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'flightData': openapi.Schema(type=openapi.TYPE_OBJECT),
                'aiqsToken': openapi.Schema(type=openapi.TYPE_STRING)
            }
        ),
        responses={
            200: openapi.Response("Branded fares retrieved"),
            400: "Invalid data"
        }
    )
    def post(self, request):
        try:
            flight_data = request.data.get('flightData', {})
            aiqs_token = request.data.get('aiqsToken', '')
            supplier_code = flight_data.get('supplierCode', 2)

            print(f"🎨 Fetching branded fares for supplier {supplier_code}")
            print(f"📦 Flight data keys: {list(flight_data.keys())}")

            # Extract passenger counts
            adt = flight_data.get('adt', 1)
            chd = flight_data.get('chd', 0)
            inf = flight_data.get('inf', 0)

            # Extract origin/destination from flightData or request data
            origin = flight_data.get('origin', '')
            destination = flight_data.get('destination', '')
            if not origin or not destination:
                # Try to get from request data (for test data structure)
                origin = request.data.get('origin', origin)
                destination = request.data.get('destination', destination)

            # Build segmentGroup from flight data
            segment_group = []

            # Try multiple paths to extract flight segments
            raw_data = flight_data.get('rawData', {})
            ond_pairs = raw_data.get('ondPairs', [])

            # Determine trip type from ondPairs count
            trip_type = "O"  # Default to OneWay
            if ond_pairs:
                ond_count = len(ond_pairs)
                if ond_count == 2:
                    trip_type = "R"  # RoundTrip
                elif ond_count > 2:
                    trip_type = "M"  # MultiCity
            elif validate_segments:
                # Fallback: determine from segmentGroup
                ond_ids = set()
                for seg in validate_segments:
                    ond_ids.add(seg.get('ondID', 0))
                ond_count = len(ond_ids)
                if ond_count == 2:
                    trip_type = "R"
                elif ond_count > 2:
                    trip_type = "M"
            
            print(f"🎯 Determined trip type: {trip_type} (from {len(ond_pairs) if ond_pairs else len(validate_segments)} ond pairs)")

            if ond_pairs:
                print("📦 Building segmentGroup from rawData.ondPairs")
                for ond_pair in ond_pairs:
                    flight_details = ond_pair.get('flightDetails', [])
                    for flight in flight_details:
                        if 'flifo' in flight:
                            seg_id = flight.get('segID', 0)
                            flifo = flight.get('flifo', {})
                            date_time = flifo.get('dateTime', {})
                            location = flifo.get('location', {})

                            # Skip if location is not a dict or is empty
                            if not isinstance(location, dict) or not location:
                                print(f"⚠️ Skipping flight with invalid location: {location}")
                                continue

                            # Extract airport codes - handle both string and dict formats
                            dep_airport_data = location.get('depAirport', '')
                            if isinstance(dep_airport_data, dict):
                                dep_airport = dep_airport_data.get('trueLocationId', '') or dep_airport_data.get('locationId', '')
                            else:
                                dep_airport = str(dep_airport_data)
                            
                            arr_airport_data = location.get('arrAirport', '')
                            if isinstance(arr_airport_data, dict):
                                arr_airport = arr_airport_data.get('trueLocationId', '') or arr_airport_data.get('locationId', '')
                            else:
                                arr_airport = str(arr_airport_data)

                            # Skip if airports are empty
                            if not dep_airport or not arr_airport:
                                print(f"⚠️ Skipping flight with empty airports: dep={dep_airport}, arr={arr_airport}")
                                continue

                            segment = {
                                "flifo": {
                                    "dateTime": date_time,
                                    "location": {
                                        "depAirport": dep_airport,
                                        "arrAirport": arr_airport
                                    },
                                    "mktgAirline": flifo.get('companyId', {}).get('mktgAirline', ''),
                                    "operAirline": flifo.get('companyId', {}).get('operAirline', ''),
                                    "issuingAirline": flifo.get('companyId', {}).get('issuingAirline', '') or flifo.get('companyId', {}).get('mktgAirline', ''),
                                    "flightNo": flifo.get('flightNo', ''),
                                    "rbd": flifo.get('rbd', ''),
                                    "flightTypeDetails": {
                                        "ondID": flight.get('ondID', 0),
                                        "segID": seg_id
                                    }
                                }
                            }
                            segment_group.append(segment)

            # Fallback: Use validateFareResponse.segmentGroup if ondPairs is empty
            if not segment_group:
                validate_response = flight_data.get('validateFareResponse', {})
                validate_segments = validate_response.get('segmentGroup', [])
                if validate_segments:
                    print("📦 Building segmentGroup from validateFareResponse.segmentGroup")
                    for seg in validate_segments:
                        seg_info = seg.get('segInfo', {})
                        flifo = seg_info.get('flifo', {})
                        date_time = seg_info.get('dateTime', {})

                        segment = {
                            "flifo": {
                                "dateTime": date_time,
                                "location": {
                                    "depAirport": flifo.get('depAirport', ''),
                                    "arrAirport": flifo.get('arrAirport', '')
                                },
                                "mktgAirline": flifo.get('mktgAirline', ''),
                                "operAirline": flifo.get('operAirline', ''),
                                "issuingAirline": flifo.get('issuingAirline', ''),
                                "flightNo": flifo.get('flightNo', ''),
                                "rbd": flifo.get('rbd', ''),
                                "flightTypeDetails": {
                                    "ondID": seg.get('ondID', 0),
                                    "segID": seg_info.get('segID', 0)
                                }
                            }
                        }
                        segment_group.append(segment)

            # Fallback: Use segments[].flights[] structure (test data format)
            if not segment_group:
                segments = flight_data.get('segments', [])
                if segments:
                    print("📦 Building segmentGroup from segments[].flights[]")
                    for segment_data in segments:
                        ond_info = segment_data.get('ond', {})
                        ond_id = ond_info.get('ondID', 0)
                        flights = segment_data.get('flights', [])

                        for flight in flights:
                            seg_id = flight.get('segID', 0)

                            segment = {
                                "flifo": {
                                    "dateTime": {
                                        "depDate": flight.get('departureDate', ''),
                                        "depTime": flight.get('departureTime', ''),
                                        "arrDate": flight.get('arrivalDate', ''),
                                        "arrTime": flight.get('arrivalTime', '')
                                    },
                                    "location": {
                                        "depAirport": flight.get('departureLocation', ''),
                                        "arrAirport": flight.get('arrivalLocation', '')
                                    },
                                    "mktgAirline": flight.get('airlineCode', ''),
                                    "operAirline": flight.get('operatingAirline', ''),
                                    "issuingAirline": ond_info.get('issuingAirline', ''),
                                    "flightNo": flight.get('flightNo', ''),
                                    "rbd": flight.get('cabin', 'Y'),
                                    "flightTypeDetails": {
                                        "ondID": ond_id,
                                        "segID": seg_id
                                    }
                                }
                            }
                            segment_group.append(segment)

            print(f"✅ Built segmentGroup with {len(segment_group)} segments")

            # Check if segmentGroup was built successfully
            if not segment_group:
                print("❌ No segments found in flight data")
                return Response({
                    'error': 'Unable to extract flight segments from data',
                    'details': 'segmentGroup is empty'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Get supplierSpecific
            supplier_specific_raw = flight_data.get('supplierSpecific')
            if supplier_specific_raw is None:
                supplier_specific_array = []
            elif isinstance(supplier_specific_raw, list):
                supplier_specific_array = supplier_specific_raw
            elif isinstance(supplier_specific_raw, dict):
                # Handle different supplierSpecific formats
                if '0' in supplier_specific_raw and isinstance(supplier_specific_raw['0'], dict):
                    # Air Arabia format: {"0": {"CabinPrice": "..."}} - may not be compatible
                    cabin_price_data = supplier_specific_raw['0']
                    if 'CabinPrice' in cabin_price_data and len(cabin_price_data) == 1:
                        # Only CabinPrice, add issuingAirline
                        supplier_specific_array = [{'issuingAirline': 'G9', 'CabinPrice': cabin_price_data['CabinPrice']}]
                    else:
                        supplier_specific_array = [cabin_price_data]
                else:
                    # Oman Air format: {"traceId": "...", "segRef": "..."}
                    supplier_specific_array = [supplier_specific_raw]
            else:
                supplier_specific_array = []

            print(f"📦 supplierSpecific raw: {supplier_specific_raw}")
            print(f"📦 supplierSpecific array: {supplier_specific_array}")

            # Validate that we have sufficient supplierSpecific data for branded fares
            has_required_supplier_data = False
            if supplier_specific_array and len(supplier_specific_array) > 0:
                supplier_data = supplier_specific_array[0]
                # Check if it has the fields that Oman Air had (traceId, segRef, etc.)
                required_fields = ['traceId', 'segRef', 'segIdEqpTypeMap']
                if any(field in supplier_data for field in required_fields):
                    has_required_supplier_data = True
                # Or if it has other meaningful data
                elif len(supplier_data) > 1 or ('CabinPrice' not in supplier_data):
                    has_required_supplier_data = True

            if not has_required_supplier_data:
                print(f"⚠️ Insufficient supplierSpecific data for supplier {supplier_code}, branded fares may not be supported")
                return Response({
                    'error': 'Branded fares not available for this airline',
                    'details': f'Supplier {supplier_code} does not provide sufficient data for branded fare requests'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Override origin/destination if provided at root level
            if not origin:
                origin = flight_data.get('origin', '')
            if not destination:
                destination = flight_data.get('destination', '')

            # Extract origin/destination from segmentGroup if not provided
            if not origin and segment_group:
                origin = segment_group[0]['flifo']['location']['depAirport']
            if not destination and segment_group:
                destination = segment_group[-1]['flifo']['location']['arrAirport']

            # Build AIQS branded fares request per Postman collection
            payload = {
                "request": {
                    "service": "FlightRQ",
                    "supplierCodes": [supplier_code],
                    "node": {"agencyCode": "CLI_11078"},
                    "content": {
                        "command": "FlightBrandRQ",
                        "brandRequest": {
                            "target": "Test",
                            "adt": adt,
                            "chd": chd,
                            "inf": inf,
                            "segmentGroup": segment_group,
                            "tripType": trip_type,  # O=OneWay, R=RoundTrip, M=MultiCity
                            "from": origin,
                            "to": destination
                        },
                        "supplierSpecific": supplier_specific_array
                    },
                    "selectCredential": {
                        "id": 33,
                        "officeIdList": [{"id": 24}]
                    }
                }
            }

            print(f"🎨 Fetching branded fares for supplier {supplier_code}")
            print("📥 Branded fares payload:", payload)

            # Get server token if client token not provided
            use_token = aiqs_token
            if not use_token:
                auth_service = AuthenticationService()
                tokens = auth_service.get_tokens()
                use_token = tokens.get('id_token')

            # Call AIQS API at branded fares endpoint: /api/air/getBrands
            response = requests.post(
                f"{REST_ENDPOINT}/api/air/getBrands",
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {use_token}"
                },
                timeout=30
            )

            print(f"📡 AIQS Response Status: {response.status_code}")
            print(f"📡 AIQS Response Body: {response.text[:500]}")

            # Handle 401 Unauthorized - fallback to server token
            if response.status_code == 401:
                try:
                    print('🔐 Client token unauthorized (401). Attempting server-cached token fallback for branded fares')
                    server_tokens = AuthenticationService.get_tokens()
                    server_token = server_tokens.get('id_token') or server_tokens.get('access_token')
                    if server_token and server_token != use_token:
                        headers_fallback = {
                            'Authorization': f"Bearer {server_token}",
                            'Content-Type': 'application/json'
                        }
                        retry_resp = requests.post(
                            f"{REST_ENDPOINT}/api/air/getBrands",
                            json=payload,
                            headers=headers_fallback,
                            timeout=30
                        )
                        print('AIQS FALLBACK STATUS:', retry_resp.status_code)
                        print('AIQS FALLBACK BODY:', retry_resp.text[:500])
                        response = retry_resp
                except Exception as fallback_err:
                    print(f"❌ Fallback attempt failed: {fallback_err}")

            if response.status_code != 200:
                return Response({
                    'error': 'Failed to fetch branded fares from AIQS',
                    'status': response.status_code,
                    'details': response.text
                }, status=status.HTTP_502_BAD_GATEWAY)

            result = response.json()
            brand_response = result.get('response', {}).get('content', {}).get('brandResponse', {})
            brands = brand_response.get('brands', [])

            print(f"✅ Branded fares retrieved successfully: {len(brands)} brands")

            return Response({
                'brands': brands,
                'fare': brand_response.get('fare', {}),
                'rawData': brand_response
            }, status=status.HTTP_200_OK)

        except requests.exceptions.Timeout:
            return Response({
                'error': 'Request timeout - please try again'
            }, status=status.HTTP_504_GATEWAY_TIMEOUT)
        except Exception as e:
            print(f"❌ Branded fares error: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': 'Failed to fetch branded fares',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UpdatePassportView(APIView):
    """
    Forward FlightUpdatePassportRQ to AIQS updatePassport endpoint.
    Accepts documented AIQS wrapper or inner content. Returns AIQS response.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        try:
            data = request.data

            # forward full wrapper if provided
            aiqs_request_payload = data if isinstance(data, dict) and data.get('request') else data

            # token selection: prefer client-provided token
            client_token = None
            if isinstance(data, dict):
                client_token = (data.get('request') or {}).get('token') or data.get('token') or (data.get('request') or {}).get('content', {}).get('token')
            if not client_token:
                tokens = AuthenticationService.get_tokens()
                client_token = tokens.get('id_token') or tokens.get('access_token')

            headers = {'Content-Type': 'application/json'}
            if client_token:
                headers['Authorization'] = f"Bearer {client_token}"

            url = f"{REST_ENDPOINT}/api/air/updatePassport"
            print(f"➡️ Forwarding UpdatePassport to AIQS: {url}")
            try:
                import json as _json
                print("🔁 Forwarded payload to AIQS (server -> AIQS):")
                try:
                    print(_json.dumps(aiqs_request_payload, indent=2))
                except Exception:
                    print(str(aiqs_request_payload))
            except Exception:
                pass
            resp = requests.post(url, json=aiqs_request_payload, headers=headers, timeout=60)
            print("AIQS UpdatePassport status:", resp.status_code)
            print("AIQS UpdatePassport body:", resp.text[:1000])

            try:
                aiqs_json = resp.json()
            except Exception:
                aiqs_json = None

            # If AIQS returned JSON, attempt to persist the agent-submitted
            # passport document into our DB when AIQS indicates success.
            if aiqs_json is not None:
                try:
                    # Heuristics: extract bookingRefId and submitted traveler info
                    req_content = None
                    if isinstance(aiqs_request_payload, dict):
                        req_content = (aiqs_request_payload.get('request') or {}).get('content') or aiqs_request_payload.get('content') or aiqs_request_payload

                    booking_ref = None
                    submitted_doc = None
                    if req_content:
                        # updatePnrRQ path
                        upr = req_content.get('updatePnrRQ') or req_content.get('updatePnrRequest') or {}
                        booking_ref = upr.get('bookingRefId') or upr.get('bookingRef') or booking_ref
                        travs = upr.get('travelerInfo') or upr.get('travelerInfoList') or []
                        if travs and isinstance(travs, list) and len(travs) > 0:
                            t0 = travs[0]
                            submitted_doc = t0.get('documentNumber') or t0.get('docID') or t0.get('passportNumber')

                    # Determine if AIQS accepted the update
                    update_status = None
                    try:
                        update_status = aiqs_json.get('response', {}).get('content', {}).get('updatePnrRS', {}).get('status')
                    except Exception:
                        update_status = None

                    if resp.status_code >= 200 and resp.status_code < 300 and (update_status == 'Success' or aiqs_json.get('response', {}).get('content', {}).get('updatePnrRS')):
                        # Persist the submitted document into our DB for this bookingRefId
                        if booking_ref and submitted_doc:
                            try:
                                fb = FlightBooking.objects.filter(booking_ref_id=booking_ref).first()
                                if fb:
                                    fb.passport_override = submitted_doc
                                    fb.save()
                                    print(f"✅ Persisted submitted passport override for bookingRef={booking_ref}: {submitted_doc}")
                                else:
                                    print(f"⚠️ UpdatePassport: no local booking found for bookingRef={booking_ref} to persist override")
                            except Exception as e:
                                print(f"❌ Failed to persist submitted passport override: {e}")
                except Exception as e:
                    print(f"❌ Error while attempting to persist UpdatePassport result: {e}")

                return Response({'aiqs': aiqs_json}, status=resp.status_code)
            else:
                return Response({'text': resp.text}, status=resp.status_code)

        except requests.exceptions.RequestException as e:
            print(f"❌ RequestException calling AIQS updatePassport: {e}")
            return Response({'error': 'Failed to contact AIQS', 'details': str(e)}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as e:
            print(f"❌ Unexpected error in UpdatePassportView: {e}")
            return Response({'error': 'Internal server error', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

