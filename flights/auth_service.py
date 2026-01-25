"""
AIQS Authentication Service
Handles authentication and token management
"""
import requests
from datetime import datetime, timedelta
from django.core.cache import cache
from .config import AUTHENTICATE_ENDPOINT, CLIENT_ID, USERNAME, PASSWORD, TOKEN_CACHE_TIMEOUT


class AuthenticationService:
    """Service for managing AIQS API authentication"""
    
    CACHE_KEY = 'aiqs_auth_tokens'
    
    @classmethod
    def get_tokens(cls):
        """
        Get valid authentication tokens (from cache or new authentication)
        Returns: dict with 'access_token', 'id_token', 'expires_at'
        """
        # Try to get from cache first
        tokens = cache.get(cls.CACHE_KEY)
        if tokens and tokens.get('expires_at') > datetime.now():
            return tokens
        
        # Authenticate and cache tokens
        return cls._authenticate()
    
    @classmethod
    def _authenticate(cls):
        """Authenticate with AIQS API and cache tokens"""
        url = f"{AUTHENTICATE_ENDPOINT}/client/user/signin/initiate"
        
        payload = {
            "clientId": CLIENT_ID,
            "authFlow": "USER_PASSWORD_AUTH",
            "authParameters": {
                "PASSWORD": PASSWORD,
                "USERNAME": USERNAME
            }
        }
        
        headers = {"Content-Type": "application/json"}
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            # Extract tokens
            auth_result = None
            if 'data' in data and 'authenticationResult' in data['data']:
                auth_result = data['data']['authenticationResult']
            elif 'AuthenticationResult' in data:
                auth_result = data['AuthenticationResult']
            
            if not auth_result:
                raise Exception("Invalid authentication response format")
            
            access_token = auth_result.get('accessToken') or auth_result.get('AccessToken')
            id_token = auth_result.get('idToken') or auth_result.get('IdToken')
            expires_in = auth_result.get('expiresIn') or auth_result.get('ExpiresIn') or 3600
            
            if not access_token or not id_token:
                raise Exception("Tokens not found in response")
            
            # Calculate expiration time
            expires_at = datetime.now() + timedelta(seconds=expires_in)
            
            tokens = {
                'access_token': access_token,
                'id_token': id_token,
                'expires_at': expires_at,
                'expires_in': expires_in
            }
            
            # Cache tokens
            cache.set(cls.CACHE_KEY, tokens, TOKEN_CACHE_TIMEOUT)
            
            return tokens
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"Authentication failed: {str(e)}")
    
    @classmethod
    def clear_cache(cls):
        """Clear cached tokens (useful for troubleshooting)"""
        cache.delete(cls.CACHE_KEY)
