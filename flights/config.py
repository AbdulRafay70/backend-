"""
AIQS Flight API Configuration
"""

# API Configuration
AUTHENTICATE_ENDPOINT = "https://pp-auth-api.aiqs.link/auth/cognito"
WSS_ENDPOINT = "wss://pp-api.aiqs.link"
REST_ENDPOINT = "https://pp-api.aiqs.link"
CLIENT_ID = "6tvsrg4go69ktu9f4369tvmvi8"
USERNAME = "preprod@gmail.com"
PASSWORD = "Preprod#1@2025"

# Cache settings
TOKEN_CACHE_TIMEOUT = 3000  # 50 minutes (tokens expire in 60 minutes)
