#!/usr/bin/env python3
"""
Test script for branded fares endpoint with Air Arabia flight
"""
import json
import requests

# Air Arabia flight data that was causing the error
flight_data = {
    "id": "4",
    "refundable": False,
    "instantTicketing": True,
    "bookOnHold": True,
    "brandedFareSupported": True,
    "brandedFareSeparate": True,
    "fareRuleOffered": False,
    "fare": {
        "baseFare": 70921,
        "tax": 0,
        "total": 70921,
        "currency": "PKR"
    },
    "fareDetails": {
        "fareBreakup": [
            {
                "paxType": "ADT",
                "baseFare": "70921.0",
                "tax": "0.0",
                "total": "70921.00"
            }
        ]
    },
    "segments": [
        {
            "ond": {
                "duration": "1720",
                "issuingAirline": "G9",
                "ondID": 0
            },
            "flights": [
                {
                    "departureDate": "06-02-2026",
                    "departureTime": "1540",
                    "arrivalDate": "06-02-2026",
                    "arrivalTime": "1745",
                    "departureLocation": "DOH",
                    "departureTerminal": None,
                    "arrivalLocation": "SHJ",
                    "arrivalTerminal": None,
                    "airlineCode": "G9",
                    "operatingAirline": "G9",
                    "flightNo": "131",
                    "equipmentType": "A320-174",
                    "duration": "0105",
                    "cabin": "Y",
                    "stops": 0,
                    "seatsAvailable": None,
                    "baggage": [],
                    "segID": 0
                },
                {
                    "departureDate": "07-02-2026",
                    "departureTime": "0810",
                    "arrivalDate": "07-02-2026",
                    "arrivalTime": "0900",
                    "departureLocation": "SHJ",
                    "departureTerminal": None,
                    "arrivalLocation": "KWI",
                    "arrivalTerminal": None,
                    "airlineCode": "G9",
                    "operatingAirline": "G9",
                    "flightNo": "124",
                    "equipmentType": "A320-174",
                    "duration": "0150",
                    "cabin": "Y",
                    "stops": 0,
                    "seatsAvailable": None,
                    "baggage": [],
                    "segID": 1
                }
            ]
        }
    ],
    "supplierCode": 17,
    "supplierSpecific": {
        "0": {
            "CabinPrice": "//2dqIMTIrnDOlAzSF/OBdK6XFF36K3XS96ceRzYqgO+11pDpyT/VdsCg49JxMFur8zocHHtoedLffMbDGwxS7MJkXzLBnCgvFwKD8U8CiNgtqeqIJ0XdUhIdx2WJYvM3cjm/zIl3p1YNLDfFAuq8a+j+V25QoFuvfRxj3m6yO3gFsa9X0E05egkdXRY1xHtwkiQ/DaIDBuw+LY+nARSgO9L2kt9UoP6e0+F3AM+Eso0nCLcQ2FiT+Tmq8ZT/Pt1RcShZX0Q6/IxTUh42Z8Jw40NashtBtGE6wJZrRepQGgpNin0kTlMhipNtutNETq0Ue5I7PV2kFI5bUJKUaWgl0XEoWV9EOvySHrNnrhqWqKNDWrIbQbRhD3RMZJ6btC+"
        }
    },
    "brands": [],
    "rawData": {
        "refundable": False,
        "instantTicketing": True,
        "bookOnHold": True,
        "brandedFareSupported": True,
        "brandedFareSeparate": True,
        "fareRuleOffered": False,
        "resultCount": {
            "id": "4"
        },
        "fare": {
            "baseFare": "70921.00",
            "tax": "0.00",
            "total": 70921,
            "currency": "PKR"
        },
        "fareDetails": {
            "fareBreakup": [
                {
                    "paxType": "ADT",
                    "baseFare": "70921.0",
                    "tax": "0.0",
                    "total": "70921.00"
                }
            ]
        },
        "ondPairs": [
            {
                "ond": {
                    "ondID": 0,
                    "duration": "1720",
                    "issuingAirline": "G9"
                },
                "flightDetails": [
                    {
                        "segID": 0,
                        "flifo": {
                            "dateTime": {
                                "depDate": "06-02-2026",
                                "depTime": "1540",
                                "arrDate": "06-02-2026",
                                "arrTime": "1745"
                            },
                            "location": {
                                "depAirport": "DOH",
                                "arrAirport": "SHJ"
                            },
                            "companyId": {
                                "mktgAirline": "G9",
                                "operAirline": "G9"
                            },
                            "flightNo": "131",
                            "eqpType": "A320-174",
                            "rbd": "E",
                            "duration": "0105",
                            "cabin": "Y",
                            "stops": 0,
                            "eTicketing": "false"
                        }
                    },
                    {
                        "segID": 1,
                        "flifo": {
                            "dateTime": {
                                "depDate": "07-02-2026",
                                "depTime": "0810",
                                "arrDate": "07-02-2026",
                                "arrTime": "0900"
                            },
                            "location": {
                                "depAirport": "SHJ",
                                "arrAirport": "KWI"
                            },
                            "companyId": {
                                "mktgAirline": "G9",
                                "operAirline": "G9"
                            },
                            "flightNo": "124",
                            "eqpType": "A320-174",
                            "rbd": "E",
                            "duration": "0150",
                            "cabin": "Y",
                            "stops": 0,
                            "eTicketing": "false"
                        }
                    }
                ]
            }
        ],
        "supplierSpecific": {
            "0": {
                "CabinPrice": "//2dqIMTIrnDOlAzSF/OBdK6XFF36K3XS96ceRzYqgO+11pDpyT/VdsCg49JxMFur8zocHHtoedLffMbDGwxS7MJkXzLBnCgvFwKD8U8CiNgtqeqIJ0XdUhIdx2WJYvM3cjm/zIl3p1YNLDfFAuq8a+j+V25QoFuvfRxj3m6yO3gFsa9X0E05egkdXRY1xHtwkiQ/DaIDBuw+LY+nARSgO9L2kt9UoP6e0+F3AM+Eso0nCLcQ2FiT+Tmq8ZT/Pt1RcShZX0Q6/IxTUh42Z8Jw40NashtBtGE6wJZrRepQGgpNin0kTlMhipNtutNETq0Ue5I7PV2kFI5bUJKUaWgl0XEoWV9EOvySHrNnrhqWqKNDWrIbQbRhD3RMZJ6btC+"
            }
        }
    }
}

# Prepare request payload
payload = {
    'flightData': flight_data,
    'origin': 'DOH',
    'destination': 'KWI'
}

print("Testing branded fares endpoint with Air Arabia flight...")
print(f"Flight: G9 131/124")
print(f"Route: DOH → SHJ → KWI")
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
            for i, brand in enumerate(data['brands'][:5]):  # Show first 5 brands
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