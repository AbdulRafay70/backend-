"""
Check how the API returns booking data
"""

import requests

# Test API endpoint
url = "https://api.saer.pk/api/bookings/?organization=11&status=Approved"

try:
    response = requests.get(url, headers={
        'Authorization': 'Bearer YOUR_TOKEN_HERE'  # You'll need to add your actual token
    })
    
    if response.ok:
        data = response.json()
        if data and len(data) > 0:
            # Print first booking structure
            booking = data[0]
            print("\n=== BOOKING STRUCTURE ===")
            print(f"Booking Number: {booking.get('booking_number')}")
            print(f"\nKeys in booking:")
            for key in booking.keys():
                print(f"  - {key}: {type(booking[key]).__name__}")
            
            print(f"\n=== TICKET_DETAILS ===")
            print(booking.get('ticket_details'))
            
            print(f"\n=== TRANSPORT_DETAILS ===")
            print(booking.get('transport_details'))
            
            print(f"\n=== PERSON_DETAILS ===")
            if booking.get('person_details'):
                print(f"Number of passengers: {len(booking['person_details'])}")
                if len(booking['person_details']) > 0:
                    print(f"First passenger keys:")
                    for key in booking['person_details'][0].keys():
                        print(f"  - {key}")
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        
except Exception as e:
    print(f"Error: {e}")
    print("\nNote: You need to add your auth token to test this.")
