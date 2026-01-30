#!/usr/bin/env python3
"""
Test script for branded fares endpoint
"""
import json
import requests

# Load sample flight data
with open('sample_flight_response.json', 'r') as f:
    sample_data = json.load(f)

# Extract flight data
flight_data = sample_data['flight']

# Prepare request payload
payload = {
    'flightData': flight_data,
    'origin': sample_data.get('origin', 'KHI'),
    'destination': sample_data.get('destination', 'DXB')
}

print("Testing branded fares endpoint...")
print(f"Flight: {flight_data['segments'][0]['flights'][0]['airlineCode']} {flight_data['segments'][0]['flights'][0]['flightNo']}")
print(f"Route: {flight_data['segments'][0]['flights'][0]['departureLocation']} → {flight_data['segments'][0]['flights'][-1]['arrivalLocation']}")
print(f"Branded fare supported: {flight_data.get('brandedFareSupported', False)}")

try:
    response = requests.post(
        'http://localhost:8000/api/flights/branded-fares/',
        json=payload,
        headers={'Content-Type': 'application/json'}
    )

    print(f"\nResponse status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print("✅ Success!")
        print(f"Brands found: {len(data.get('brands', []))}")

        if 'brands' in data and data['brands']:
            for i, brand in enumerate(data['brands'][:3]):  # Show first 3 brands
                print(f"  Brand {i+1}: {brand.get('brandName', 'Unknown')} - {brand.get('total', 0)} {brand.get('currency', 'PKR')}")
        else:
            print("  No brands returned")
    else:
        print("❌ Failed!")
        print(f"Error: {response.text}")

except requests.exceptions.ConnectionError:
    print("❌ Connection failed - is the Django server running?")
except Exception as e:
    print(f"❌ Error: {e}")