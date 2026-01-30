"""
Multi-City Flight Search API Test Script
Tests the AIQS flight search API with multi-city search
"""
import requests
import json
import asyncio
import websockets
from datetime import datetime, timedelta

# API Configuration
AUTHENTICATE_ENDPOINT = "https://pp-auth-api.aiqs.link/auth/cognito"
WSS_ENDPOINT = "wss://pp-api.aiqs.link"
REST_ENDPOINT = "https://pp-api.aiqs.link"
CLIENT_ID = "6tvsrg4go69ktu9f4369tvmvi8"
USERNAME = "preprod@gmail.com"
PASSWORD = "Preprod#1@2025"


class FlightSearchAPI:
    def __init__(self):
        self.access_token = None
        self.id_token = None
        self.refresh_token = None
        
    def authenticate(self):
        """Authenticate with the API and get access tokens"""
        url = f"{AUTHENTICATE_ENDPOINT}/client/user/signin/initiate"
        
        payload = {
            "clientId": CLIENT_ID,
            "authFlow": "USER_PASSWORD_AUTH",
            "authParameters": {
                "PASSWORD": PASSWORD,
                "USERNAME": USERNAME
            }
        }
        
        headers = {
            "Content-Type": "application/json"
        }
        
        print(f"Authenticating with {url}...")
        try:
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            print(f"Authentication successful!")
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Extract tokens
            auth_data = data.get('data', {})
            if 'authenticationResult' in auth_data:
                auth_result = auth_data['authenticationResult']
                self.access_token = auth_result.get('accessToken')
                self.id_token = auth_result.get('idToken')
                self.refresh_token = auth_result.get('refreshToken')
                print(f"✓ Tokens extracted successfully")
                return True
            else:
                print("❌ No AuthenticationResult in response")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"Authentication failed: {e}")
            if hasattr(e, 'response') and e.response:
                print(f"Response: {e.response.text}")
            return False
    
    async def search_flights_websocket(self, search_params):
        """Search for flights using websocket connection"""
        if not self.id_token:
            print("Error: Not authenticated. Call authenticate() first.")
            return None
        
        # WebSocket URL with /message path
        ws_url = f"{WSS_ENDPOINT}/message"
        
        print(f"\nConnecting to websocket: {WSS_ENDPOINT}")
        print(f"Search parameters: {json.dumps(search_params, indent=2)}")
        
        try:
            async with websockets.connect(ws_url) as websocket:
                print("✓ WebSocket connected")
                
                # Prepare the request with token inside
                request_with_token = {
                    "request": {
                        "service": search_params["service"],
                        "token": self.id_token,
                        "content": search_params["content"]
                    }
                }
                
                print(f"Sending message with token included...")
                await websocket.send(json.dumps(request_with_token))
                print("✓ Search request sent")
                print("⏳ Waiting for responses (this may take 30-60 seconds)...")
                
                # Receive responses
                results = []
                timeout = 90  # 90 seconds timeout
                start_time = asyncio.get_event_loop().time()
                response_count = 0
                
                while True:
                    try:
                        # Check timeout
                        elapsed = asyncio.get_event_loop().time() - start_time
                        if elapsed > timeout:
                            print(f"\n⏱ Timeout reached after {elapsed:.1f} seconds")
                            break
                        
                        # Wait for response with 15 second timeout per message
                        response = await asyncio.wait_for(websocket.recv(), timeout=15.0)
                        response_count += 1
                        
                        # Debug: Print raw response
                        if len(response) > 500:
                            print(f"\n📥 Response #{response_count} (truncated): {response[:500]}...")
                        else:
                            print(f"\n📥 Response #{response_count}: {response}")
                        
                        if not response or response.strip() == "":
                            print("⚠ Received empty response, continuing...")
                            continue
                        
                        try:
                            data = json.loads(response)
                            results.append(data)
                        except json.JSONDecodeError as je:
                            print(f"⚠ JSON decode error: {je}")
                            print(f"  Raw response: {response[:200]}")
                            continue
                        
                        print(f"\n📨 Received response {len(results)}")
                        
                        # Check response structure
                        if 'response' in data:
                            response_data = data['response']
                            if 'content' in response_data:
                                command = response_data['content'].get('command', 'unknown')
                                print(f"  Command: {command}")
                                
                                if command == 'FlightSearchRS':
                                    search_response = response_data['content'].get('searchResponse', {})
                                    flight_index = search_response.get('flightIndex', [])
                                    print(f"  Flights in this response: {len(flight_index)}")
                                    
                                    # Check for multi-city flights
                                    multicity_count = 0
                                    for flight in flight_index:
                                        ond_pairs = flight.get('ondPairs', [])
                                        if len(ond_pairs) > 2:
                                            multicity_count += 1
                                    print(f"  Multi-city flights: {multicity_count}")
                        
                        # Check if this is the final response (no more data expected)
                        if 'response' in data and 'content' in data['response']:
                            content = data['response']['content']
                            if content.get('command') == 'FlightSearchRS':
                                # For now, we'll collect all responses and let timeout handle end
                                pass
                                
                    except asyncio.TimeoutError:
                        print(f"\n⏱ No more responses received (15s timeout)")
                        break
                    except websockets.exceptions.ConnectionClosed:
                        print(f"\n🔌 WebSocket connection closed")
                        break
                
                print(f"\n✓ WebSocket search completed. Total responses: {len(results)}")
                return results
                
        except Exception as e:
            print(f"WebSocket search failed: {e}")
            return None
    
    def validate_price(self, rec_id, flight_data):
        """Validate price for a selected flight"""
        if not self.id_token:
            print("Error: Not authenticated.")
            return None
        
        url = f"{REST_ENDPOINT}/message"
        
        payload = {
            "request": {
                "service": "FlightRQ",
                "token": self.id_token,
                "content": {
                    "command": "FlightValidateRQ",
                    "criteria": {
                        "recId": rec_id,
                        "flightData": flight_data
                    }
                }
            }
        }
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": self.id_token
        }
        
        print(f"\nValidating price...")
        try:
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            print(f"✓ Price validation successful")
            return data
        except requests.exceptions.RequestException as e:
            print(f"Price validation failed: {e}")
            if hasattr(e.response, 'text'):
                print(f"Response: {e.response.text}")
            return None


def create_sample_multicity_search_request():
    """Create a sample multi-city flight search request"""
    # Multi-city: Karachi → Dubai → Jeddah → Karachi
    segments = [
        {
            "departureDate": "15-02-2026",
            "originLocation": "KHI",
            "destinationLocation": "DXB"
        },
        {
            "departureDate": "20-02-2026", 
            "originLocation": "DXB",
            "destinationLocation": "JED"
        },
        {
            "departureDate": "25-02-2026",
            "originLocation": "JED", 
            "destinationLocation": "KHI"
        }
    ]
    
    search_params = {
        "service": "FlightRQ",
        "content": {
            "command": "FlightSearchRQ",
            "criteria": {
                "criteriaType": "Air",
                "commonRequestSearch": {
                    "numberOfUnits": 1,
                    "typeOfUnit": "PX",
                    "resultsCount": "50"
                },
                "ondPairs": segments,
                "preferredAirline": [],
                "nonStop": False,
                "cabin": "Y",  # Economy
                "maxStopQuantity": "All",
                "tripType": "M",  # Multi City
                "target": "Test",
                "paxQuantity": {
                    "adt": 1,
                    "chd": 0,
                    "inf": 0
                }
            }
        }
    }
    
    return search_params


def main():
    """Main test function"""
    print("=" * 60)
    print("AIQS Multi-City Flight Search API Test")
    print("=" * 60)
    
    # Initialize API client
    api = FlightSearchAPI()
    
    # Step 1: Authenticate
    print("\n[STEP 1] Authentication")
    print("-" * 60)
    if not api.authenticate():
        print("\n❌ Authentication failed. Cannot proceed.")
        return
    
    # Step 2: Search for multi-city flights
    print("\n[STEP 2] Multi-City Flight Search (WebSocket)")
    print("-" * 60)
    search_params = create_sample_multicity_search_request()
    
    # Run async websocket search
    results = asyncio.run(api.search_flights_websocket(search_params))
    
    if results:
        print(f"\n✓ Received {len(results)} responses")
        
        # Save results to file
        output_file = "multicity_flight_search_results.json"
        with open(output_file, "w") as f:
            json.dump(results, f, indent=2)
        print(f"✓ Results saved to {output_file}")
        
        # Display summary
        print("\n" + "=" * 60)
        print("MULTI-CITY SEARCH SUMMARY")
        print("=" * 60)
        
        total_flights = 0
        multicity_flights = 0
        for idx, result in enumerate(results, 1):
            print(f"\nResponse {idx}:")
            
            if 'requestDetails' in result:
                print(f"  Type: Initial Request")
                print(f"  Request Count: {result['requestDetails'].get('count', 'N/A')}")
            elif 'response' in result:
                response_data = result['response']
                if 'content' in response_data:
                    content = response_data['content']
                    print(f"  Command: {content.get('command', 'N/A')}")
                    print(f"  Supplier Code: {response_data.get('supplierCode', 'N/A')}")
                    
                    if 'searchResponse' in content:
                        search_resp = content['searchResponse']
                        if 'flightIndex' in search_resp:
                            flight_count = len(search_resp['flightIndex'])
                            total_flights += flight_count
                            print(f"  Flights: {flight_count} options")
                            
                            # Count multi-city flights
                            mc_count = 0
                            for flight in search_resp['flightIndex']:
                                ond_pairs = flight.get('ondPairs', [])
                                if len(ond_pairs) > 2:
                                    mc_count += 1
                            multicity_flights += mc_count
                            print(f"  Multi-city flights: {mc_count}")
                            
                            # Show first flight details
                            if search_resp['flightIndex']:
                                first_flight = search_resp['flightIndex'][0]
                                print(f"  Sample flight ondPairs count: {len(first_flight.get('ondPairs', []))}")
                                if 'ondPairs' in first_flight and first_flight['ondPairs']:
                                    first_ond = first_flight['ondPairs'][0].get('ond', {})
                                    print(f"  Sample route: {first_ond.get('originLocation', 'N/A')} → {first_ond.get('destinationLocation', 'N/A')}")
        
        print(f"\n📊 Total flights received: {total_flights}")
        print(f"📊 Multi-city flights: {multicity_flights}")
        
        if multicity_flights > 0:
            print("✅ Multi-city flights found successfully!")
        else:
            print("⚠ No multi-city flights found in the results.")
            
    else:
        print("\n❌ No results received from search")
        
    print("\n" + "=" * 60)
    print("Test completed")
    print("=" * 60)


if __name__ == "__main__":
    main()