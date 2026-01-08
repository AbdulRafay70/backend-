import requests

# Test the API endpoint directly
url = "http://127.0.0.1:8000/api/bookings/?organization=52"

# You'll need to get a valid token from localStorage
# For now, let's just check what the API structure looks like

print("\n" + "="*80)
print("TESTING API RESPONSE")
print("="*80)
print(f"\nEndpoint: {url}")
print("\nNote: You need to add the Authorization header with a valid token")
print("Get the token from localStorage.getItem('accessToken') in the browser console")
print("\nExample curl command:")
print(f'curl -H "Authorization: Bearer YOUR_TOKEN_HERE" "{url}"')
print("\n" + "="*80)
