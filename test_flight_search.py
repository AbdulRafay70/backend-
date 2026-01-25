"""
Flight Search API Test Script
Tests the AIQS flight search API with authentication and websocket connection
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
            
            # Extract tokens from response - handle both formats
            auth_result = None
            if 'data' in data and 'authenticationResult' in data['data']:
                auth_result = data['data']['authenticationResult']
            elif 'AuthenticationResult' in data:
                auth_result = data['AuthenticationResult']
            
            if auth_result:
                self.access_token = auth_result.get('accessToken') or auth_result.get('AccessToken')
                self.id_token = auth_result.get('idToken') or auth_result.get('IdToken')
                self.refresh_token = auth_result.get('refreshToken') or auth_result.get('RefreshToken')
                print(f"\n✓ Access Token obtained (length: {len(self.access_token) if self.access_token else 0})")
                print(f"✓ ID Token obtained (length: {len(self.id_token) if self.id_token else 0})")
                return True
            else:
                print("Warning: Unexpected response format")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"Authentication failed: {e}")
            if hasattr(e.response, 'text'):
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
                                
                                # Check for flight results
                                if 'searchResponse' in response_data['content']:
                                    search_resp = response_data['content']['searchResponse']
                                    if 'flightIndex' in search_resp:
                                        flight_count = len(search_resp['flightIndex'])
                                        print(f"  Flights in this response: {flight_count}")
                        elif 'requestDetails' in data:
                            # Initial response with request count
                            count = data['requestDetails'].get('count', 'unknown')
                            print(f"  Request count: {count}")
                        
                        print(f"  Response keys: {list(data.keys())}")
                            
                    except asyncio.TimeoutError:
                        elapsed = asyncio.get_event_loop().time() - start_time
                        print(f"\n⏱ No response for 15 seconds (total elapsed: {elapsed:.1f}s)")
                        if response_count == 0:
                            print("⚠ No responses received at all. Possible issues:")
                            print("  - Server might not be responding")
                            print("  - Request format might be incorrect")
                            print("  - Route/date might not have available flights")
                        print("Ending search...")
                        break
                    except websockets.exceptions.ConnectionClosed as e:
                        print(f"\n⚠ WebSocket connection closed: {e}")
                        break
                    except Exception as e:
                        print(f"\n❌ Error receiving message: {e}")
                        import traceback
                        traceback.print_exc()
                        break
                
                return results
                
        except Exception as e:
            print(f"WebSocket connection failed: {e}")
            return None
    
    def validate_price(self, pricing_key):
        """Validate flight price using REST API"""
        if not self.id_token:
            print("Error: Not authenticated")
            return None
        
        url = f"{REST_ENDPOINT}/air/validate"
        
        payload = {
            "pricingKey": pricing_key
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


def create_sample_search_request():
    """Create a sample one-way flight search request"""
    # Search for popular route: Karachi to Dubai on 10 Feb 2026 (known working date)
    departure_date = "10-02-2026"
    
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
                "ondPairs": [
                    {
                        "departureDate": departure_date,
                        "originLocation": "KHI",  # Karachi
                        "destinationLocation": "DXB"   # Dubai
                    }
                ],
                "preferredAirline": [],
                "nonStop": False,
                "cabin": "Y",  # Economy (Y=Economy, C=Business, F=First)
                "maxStopQuantity": "All",  # "Direct" or "All"
                "tripType": "O",  # O=Oneway, R=Round, M=Multi City
                "target": "Test",
                "paxQuantity": {
                    "adt": 1,  # Adult
                    "chd": 0,  # Child
                    "inf": 0   # Infant
                }
            }
        }
    }
    
    return search_params


def main():
    """Main test function"""
    print("=" * 60)
    print("AIQS Flight Search API Test")
    print("=" * 60)
    
    # Initialize API client
    api = FlightSearchAPI()
    
    # Step 1: Authenticate
    print("\n[STEP 1] Authentication")
    print("-" * 60)
    if not api.authenticate():
        print("\n❌ Authentication failed. Cannot proceed.")
        return
    
    # Step 2: Search for flights
    print("\n[STEP 2] Flight Search (WebSocket)")
    print("-" * 60)
    search_params = create_sample_search_request()
    
    # Run async websocket search
    results = asyncio.run(api.search_flights_websocket(search_params))
    
    if results:
        print(f"\n✓ Received {len(results)} responses")
        
        # Save results to file
        output_file = "flight_search_results.json"
        with open(output_file, "w") as f:
            json.dump(results, f, indent=2)
        print(f"✓ Results saved to {output_file}")
        
        # Display summary
        print("\n" + "=" * 60)
        print("SEARCH SUMMARY")
        print("=" * 60)
        
        total_flights = 0
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
                            
                            # Show first flight details
                            if flight_count > 0:
                                first_flight = search_resp['flightIndex'][0]
                                if 'fare' in first_flight:
                                    fare = first_flight['fare']
                                    print(f"  Sample Fare: {fare.get('currency', '')} {fare.get('total', 'N/A')}")
                                if 'ondPairs' in first_flight and len(first_flight['ondPairs']) > 0:
                                    ond = first_flight['ondPairs'][0].get('ond', {})
                                    print(f"  Duration: {ond.get('duration', 'N/A')} mins")
                                    print(f"  Refundable: {first_flight.get('refundable', False)}")
        
        print(f"\n{'=' * 60}")
        print(f"TOTAL FLIGHTS FOUND: {total_flights}")
        print(f"{'=' * 60}")
    else:
        print("\n❌ Flight search failed")
    
    print("\n" + "=" * 60)
    print("Test completed")
    print("=" * 60)


if __name__ == "__main__":
    main()
