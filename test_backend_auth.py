"""
Test authentication directly using Django to debug the issue.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from django.contrib.auth import authenticate

def test_authentication():
    print("="*80)
    print("TESTING DJANGO AUTHENTICATION BACKEND")
    print("="*80)
    
    # Test 1: Authenticate with email as username param
    print("\n[TEST 1] Authenticate with email (passed as username)")
    user = authenticate(username="admin@example.com", password="admin123")
    print(f"Result: {user}")
    if user:
        print(f"✓ Authentication successful for: {user.email}")
    else:
        print("✗ Authentication failed")
    
    # Test 2: Authenticate with explicit email param
    print("\n[TEST 2] Authenticate with explicit email param")
    user = authenticate(email="admin@example.com", password="admin123")
    print(f"Result: {user}")
    if user:
        print(f"✓ Authentication successful for: {user.email}")
    else:
        print("✗ Authentication failed")
    
    # Test 3: Authenticate with username
    print("\n[TEST 3] Authenticate with username")
    user = authenticate(username="admin", password= "admin123")
    print(f"Result: {user}")
    if user:
        print(f"✓ Authentication successful for: {user.username}")
    else:
        print("✗ Authentication failed")
    
    print("\n" + "="*80)

if __name__ == "__main__":
    test_authentication()
