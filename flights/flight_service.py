"""
AIQS Flight Service
Handles flight search and related operations
"""
import json
import asyncio
import websockets
from datetime import datetime
from .config import WSS_ENDPOINT
from .auth_service import AuthenticationService


class FlightService:
    """Service for flight search operations"""
    
    @classmethod
    async def search_flights(cls, search_params):
        """
        Search for flights using WebSocket
        
        Args:
            search_params: dict with search criteria
                {
                    "origin": "KHI",
                    "destination": "DXB", 
                    "departureDate": "10-02-2026",
                    "adults": 1,
                    "children": 0,
                    "infants": 0,
                    "cabinClass": "Y",  # Y=Economy, C=Business, F=First
                    "nonStop": False,
                    "preferredAirlines": []  # Optional
                }
        
        Returns:
            list of flight results
        """
        # Get authentication tokens
        tokens = AuthenticationService.get_tokens()
        id_token = tokens['id_token']
        
        # Build the search request
        request = cls._build_search_request(search_params)
        
        # Perform WebSocket search
        results = await cls._websocket_search(id_token, request)
        
        return results
    
    @classmethod
    def _build_search_request(cls, params):
        """Build the flight search request structure"""
        return {
            "service": "FlightRQ",
            "content": {
                "command": "FlightSearchRQ",
                "criteria": {
                    "criteriaType": "Air",
                    "commonRequestSearch": {
                        "numberOfUnits": params.get('adults', 1) + params.get('children', 0) + params.get('infants', 0),
                        "typeOfUnit": "PX",
                        "resultsCount": str(params.get('maxResults', 50))
                    },
                    "ondPairs": [
                        {
                            "departureDate": params['departureDate'],
                            "originLocation": params['origin'],
                            "destinationLocation": params['destination']
                        }
                    ],
                    "preferredAirline": params.get('preferredAirlines', []),
                    "nonStop": params.get('nonStop', False),
                    "cabin": params.get('cabinClass', 'Y'),
                    "maxStopQuantity": "Direct" if params.get('nonStop', False) else "All",
                    "tripType": "O",  # O=Oneway, R=Round, M=Multi City
                    "target": "Test",
                    "paxQuantity": {
                        "adt": params.get('adults', 1),
                        "chd": params.get('children', 0),
                        "inf": params.get('infants', 0)
                    }
                }
            }
        }
    
    @classmethod
    async def _websocket_search(cls, id_token, request):
        """Perform the WebSocket search"""
        ws_url = f"{WSS_ENDPOINT}/message"
        
        results = []
        
        try:
            async with websockets.connect(ws_url) as websocket:
                # Prepare request with token
                request_with_token = {
                    "request": {
                        "service": request["service"],
                        "token": id_token,
                        "content": request["content"]
                    }
                }
                
                # Send search request
                await websocket.send(json.dumps(request_with_token))
                
                # Receive responses - reduced timeout for faster response
                timeout = 30  # 30 seconds (reduced from 60)
                start_time = asyncio.get_event_loop().time()
                
                while True:
                    try:
                        elapsed = asyncio.get_event_loop().time() - start_time
                        if elapsed > timeout:
                            break
                        
                        response = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                        
                        if not response or response.strip() == "":
                            continue
                        
                        data = json.loads(response)
                        results.append(data)
                        
                    except asyncio.TimeoutError:
                        break
                    except websockets.exceptions.ConnectionClosed:
                        break
                    except Exception:
                        break
                
        except Exception as e:
            raise Exception(f"Flight search failed: {str(e)}")
        
        return results
    
    @classmethod
    def parse_search_results(cls, results):
        """
        Parse raw WebSocket results into structured flight data
        
        Returns:
            {
                "flights": [...],
                "total_count": 0,
                "request_count": 0
            }
        """
        flights = []
        request_count = 0
        
        for result in results:
            # Check for initial request details
            if 'requestDetails' in result:
                request_count = int(result['requestDetails'].get('count', 0))
                continue
            
            # Check for flight results
            if 'response' not in result:
                continue
            
            response = result['response']
            if 'content' not in response:
                continue
            
            content = response['content']
            
            # Skip error responses
            if 'error' in content:
                continue
            
            # Extract flights
            if 'searchResponse' in content and 'flightIndex' in content['searchResponse']:
                flight_index = content['searchResponse']['flightIndex']
                
                for flight in flight_index:
                    parsed_flight = {
                        'id': flight.get('resultCount', {}).get('id'),
                        'refundable': flight.get('refundable', False),
                        'instantTicketing': flight.get('instantTicketing', False),
                        'bookOnHold': flight.get('bookOnHold', False),
                        'brandedFareSupported': flight.get('brandedFareSupported', False),
                        'brandedFareSeparate': flight.get('brandedFareSeparate', False),
                        'fareRuleOffered': flight.get('fareRuleOffered', False),
                        'fare': {
                            'baseFare': float(flight.get('fare', {}).get('baseFare', 0)),
                            'tax': float(flight.get('fare', {}).get('tax', 0)),
                            'total': float(flight.get('fare', {}).get('total', 0)),
                            'currency': flight.get('fare', {}).get('currency', 'PKR')
                        },
                        'fareDetails': flight.get('fareDetails', {}),
                        'segments': cls._parse_segments(flight.get('ondPairs', [])),
                        'supplierCode': response.get('supplierCode'),
                        'supplierSpecific': flight.get('supplierSpecific'),
                        'brands': cls._parse_brands(flight.get('brands', [])),  # Parse branded fares
                        'rawData': flight  # Keep full data for booking
                    }
                    flights.append(parsed_flight)
        
        return {
            'flights': flights,
            'total_count': len(flights),
            'request_count': request_count
        }
    
    @classmethod
    def _parse_segments(cls, ond_pairs):
        """Parse flight segments"""
        segments = []
        
        for pair in ond_pairs:
            ond = pair.get('ond', {})
            flight_details = pair.get('flightDetails', [])
            
            segment = {
                'ond': {
                    'duration': ond.get('duration'),
                    'issuingAirline': ond.get('issuingAirline'),
                    'ondID': ond.get('ondID')
                },
                'flights': []
            }
            
            for flight_detail in flight_details:
                flifo = flight_detail.get('flifo', {})
                date_time = flifo.get('dateTime', {})
                location = flifo.get('location', {})
                company_id = flifo.get('companyId', {})
                baggage = flifo.get('baggageAllowance', [])
                
                flight_info = {
                    'departureDate': date_time.get('depDate'),
                    'departureTime': date_time.get('depTime'),
                    'arrivalDate': date_time.get('arrDate'),
                    'arrivalTime': date_time.get('arrTime'),
                    'departureLocation': location.get('depAirport'),
                    'departureTerminal': location.get('depTerminal'),
                    'arrivalLocation': location.get('arrAirport'),
                    'arrivalTerminal': location.get('arrTerminal'),
                    'airlineCode': company_id.get('mktgAirline'),
                    'operatingAirline': company_id.get('operAirline'),
                    'flightNo': flifo.get('flightNo'),
                    'equipmentType': flifo.get('eqpType'),
                    'duration': flifo.get('duration'),
                    'cabin': flifo.get('cabin'),
                    'stops': int(flifo.get('stops', 0)),
                    'seatsAvailable': flifo.get('seatsAvlbl'),
                    'baggage': baggage,
                    'segID': flight_detail.get('segID')
                }
                
                segment['flights'].append(flight_info)
            
            segments.append(segment)
        
        return segments
    
    @classmethod
    def _parse_brands(cls, brands):
        """Parse branded fare options"""
        parsed_brands = []
        
        for brand in brands:
            parsed_brand = {
                'brandId': brand.get('brandId'),
                'brandName': brand.get('brandName'),
                'ondID': brand.get('ondID'),
                'baseFare': float(brand.get('baseFare', 0)),
                'tax': float(brand.get('tax', 0)),
                'total': float(brand.get('total', 0)),
                'currency': brand.get('currency', 'PKR'),
                'fareBreakup': brand.get('fareBreakup', []),
                'inclusions': brand.get('inclusions', {}),
                'supplierSpecific': brand.get('supplierSpecific', {})
            }
            parsed_brands.append(parsed_brand)
        
        return parsed_brands
