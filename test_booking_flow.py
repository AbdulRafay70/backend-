"""
Test AIQS Flight Booking Flow
This script tests the complete booking process: Search -> Validate -> Book
"""

import requests
import json
from datetime import datetime

# API Configuration
BASE_URL = "http://127.0.0.1:8000"
AIQS_REST_ENDPOINT = "https://pp-api.aiqs.link"
AIQS_AUTH_ENDPOINT = "https://pp-auth-api.aiqs.link/auth/cognito"

# Credentials
CLIENT_ID = "6tvsrg4go69ktu9f4369tvmvi8"
USERNAME = "preprod@gmail.com"
PASSWORD = "Preprod#1@2025"

def get_aiqs_token():
    """Get authentication token from AIQS"""
    print("\n=== Step 1: Authenticating with AIQS ===")
    auth_payload = {
        "clientId": CLIENT_ID,
        "authFlow": "USER_PASSWORD_AUTH",
        "authParameters": {
            "PASSWORD": PASSWORD,
            "USERNAME": USERNAME
        }
    }
    
    response = requests.post(
        f"{AIQS_AUTH_ENDPOINT}/client/user/signin/initiate",
        json=auth_payload
    )
    response.raise_for_status()
    
    auth_data = response.json()
    
    # Extract token from response
    id_token = auth_data['data']['authenticationResult']['idToken']
    
    print(f"✓ Authentication successful")
    return id_token

def search_flights():
    """Use saved flight data for testing"""
    print("\n=== Step 2: Loading Sample Flight Data ===")
    
    # Load sample flight from file - USING JAZEERA (J9) FLIGHT
    import os
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sample_file = os.path.join(script_dir, 'sample_jazeera_flight.json')
    
    with open(sample_file, 'r') as f:
        data = json.load(f)
    
    flight = data['flight']
    
    print(f"  Route: {data['origin']} → {data['destination']} on {data['departureDate']}")
    print(f"  Flight: {flight['segments'][0]['flights'][0]['airlineCode']} (Supplier: {flight.get('supplierCode')})")
    print(f"  Price: {flight['fare']['currency']} {flight['fare']['total']}")
    print(f"  Brand: {flight['brands'][0]['brandName'] if flight.get('brands') else 'N/A'}")
    
    # For supplier 11 with brands, we need to use brand data
    if flight.get('supplierCode') == 11 and flight.get('brands'):
        # Use the first brand for testing
        flight['brandId'] = flight['brands'][0]['brandId']
        flight['supplierSpecific'] = flight['brands'][0]['supplierSpecific']
    
    return flight

def validate_flight(flight):
    """Validate flight fare"""
    print("\n=== Step 3: Validating Flight ===")
    
    # Extract data from flight
    origin = flight['segments'][0]['flights'][0]['departureLocation']
    destination = flight['segments'][-1]['flights'][-1]['arrivalLocation']
    
    validate_payload = {
        "flightData": {
            "segments": flight['segments'],
            "fare": flight['fare'],
            "supplierSpecific": flight['supplierSpecific'],
            "supplierCodes": [flight.get('supplierCode', 11)],
            "origin": origin,
            "destination": destination,
            "adt": 1,
            "chd": 0,
            "inf": 0,
            "tripType": "O"
        }
    }
    
    print(f"  Validating with supplier: {validate_payload['flightData']['supplierCodes'][0]}")
    print(f"  Route: {origin} → {destination}")
    
    response = requests.post(
        f"{BASE_URL}/api/flights/validate/",
        json=validate_payload
    )
    
    if response.status_code != 200:
        print(f"✗ Validation failed:")
        print(f"  Status: {response.status_code}")
        print(f"  Response: {response.text}")
        raise Exception(f"Validation failed with status {response.status_code}")
    
    result = response.json()
    print(f"✓ Validation successful")
    print(f"  Full response: {json.dumps(result, indent=2)[:500]}...")  # First 500 chars
    
    # Check if we got a sealed token
    sealed = result.get('response', {}).get('content', {}).get('validateFareResponse', {}).get('sealed')
    if sealed:
        print(f"  Sealed token received (length: {len(sealed)})")
    else:
        print(f"  Warning: No sealed token in response")
        print(f"  Response structure: {list(result.keys())}")
    
    return result

def create_booking(flight, validation_result):
    """Create booking (PNR)"""
    print("\n=== Step 4: Creating Booking ===")
    
    # Extract sealed token and supplier specific from validation
    validated_content = validation_result.get('response', {}).get('content', {})
    sealed = validated_content.get('validateFareResponse', {}).get('sealed')
    supplier_specific = validated_content.get('supplierSpecific', {})
    validated_fare = validated_content.get('validateFareResponse', {}).get('fare', {})
    
    if not sealed:
        raise Exception("No sealed token from validation - cannot proceed with booking")
    
    # Sample passenger data
    passengers = [{
        "paxType": "ADT",
        "gender": "Male",
        "salutation": "Mr",
        "givenName": "John",
        "surName": "Doe",
        "birthDate": "04-04-1990",
        "docType": "1",
        "docID": "AQ123456",
        "docIssueCountry": "PK",
        "expiryDate": "01-01-2027",
        "nationality": "PK",
        "contact": {
            "emailList": [{
                "emailId": "test@example.com",
                "emailType": {"id": 1}
            }],
            "phoneList": [{
                "number": "3001234567",
                "phoneType": {"id": 1},
                "country": {
                    "code": "PK",
                    "telephonecode": "92"
                }
            }]
        }
    }]
    
    # Build ondPairs from flight segments
    ond_pairs = []
    for segment in flight['segments']:
        ond_pair = {
            "duration": segment.get('ond', {}).get('duration', '0'),
            "originCity": segment['flights'][0]['departureLocation'],
            "destinationCity": segment['flights'][-1]['arrivalLocation'],
            "segments": []
        }
        
        for flight_detail in segment['flights']:
            ond_pair['segments'].append({
                "depDate": flight_detail['departureDate'],
                "depTime": flight_detail['departureTime'],
                "arrDate": flight_detail['arrivalDate'],
                "arrTime": flight_detail['arrivalTime'],
                "depAirport": flight_detail['departureLocation'],
                "arrAirport": flight_detail['arrivalLocation'],
                "mktgAirline": flight_detail['airlineCode'],
                "operAirline": flight_detail.get('operatingAirline', flight_detail['airlineCode']),
                "issuingAirline": segment.get('ond', {}).get('issuingAirline', flight_detail['airlineCode']),
                "flightNo": flight_detail['flightNo'],
                "cabin": flight_detail.get('cabin', 'Y'),
                "rbd": flight_detail.get('rbd'),
                "depTerminal": flight_detail.get('departureTerminal', ''),
                "arrTerminal": flight_detail.get('arrivalTerminal', ''),
                "eqpType": flight_detail.get('equipmentType', ''),
                "stopQuantity": flight_detail.get('stops', 0)
            })
        
        ond_pairs.append(ond_pair)
    
    booking_payload = {
        "flightData": {
            "tripType": "O",
            "adt": 1,
            "chd": 0,
            "inf": 0,
            "supplierSpecific": supplier_specific,
            "fare": validated_fare,
            "ondPairs": ond_pairs,
            "sealed": sealed
        },
        "passengers": passengers
    }
    
    print(f"  Booking with sealed token...")
    
    response = requests.post(
        f"{BASE_URL}/api/flights/book/",
        json=booking_payload
    )
    
    if response.status_code != 200:
        print(f"✗ Booking failed: {response.text}")
        raise Exception(f"Booking failed with status {response.status_code}")
    
    result = response.json()
    print(f"✓ Booking successful!")
    
    # Extract PNR details
    booking_response = result.get('response', {}).get('content', {}).get('bookFlightRS', {})
    pnr = booking_response.get('pnr')
    booking_ref_id = booking_response.get('bookingRefId')
    
    if pnr:
        print(f"  PNR: {pnr}")
    if booking_ref_id:
        print(f"  Booking Reference: {booking_ref_id}")
    
    return result

def main():
    """Run complete booking flow test"""
    print("=" * 80)
    print("AIQS FLIGHT BOOKING FLOW TEST")
    print("=" * 80)
    
    try:
        # Step 1: Get AIQS token (not used by our Django API but verifies AIQS connection)
        token = get_aiqs_token()
        
        # Step 2: Search for flights
        flight = search_flights()
        
        # Step 3: Validate flight
        validation_result = validate_flight(flight)
        
        # Step 4: Create booking
        booking_result = create_booking(flight, validation_result)
        
        print("\n" + "=" * 80)
        print("✓ ALL STEPS COMPLETED SUCCESSFULLY!")
        print("=" * 80)
        
        # Save results for inspection
        with open('d:/Saerpk/backend/booking_test_results.json', 'w') as f:
            json.dump({
                'flight': flight,
                'validation': validation_result,
                'booking': booking_result
            }, f, indent=2)
        print("\n✓ Results saved to booking_test_results.json")
        
    except Exception as e:
        print("\n" + "=" * 80)
        print(f"✗ TEST FAILED: {str(e)}")
        print("=" * 80)
        raise

if __name__ == "__main__":
    main()
