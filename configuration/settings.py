"""
Django settings for configuration project.
"""

from datetime import timedelta
from pathlib import Path
import os
import sys
import pymysql

# Allow pymysql to act as MySQLdb (required for Windows/MySQL Workbench)
pymysql.install_as_MySQLdb()

# ----------------------------------------------------
# BASE SETTINGS
# ----------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = "django-insecure-&6xg!^86h%=f!95!j(t^rcy@sp)tnept$!cl%zmhgju)c#3dn8"
DEBUG = True

# You can add your localhost and production domains here
ALLOWED_HOSTS = [
    "127.0.0.1",      # local dev
    "localhost",      # local dev
    "api.saer.pk",    # production domain
]

# ----------------------------------------------------
# INSTALLED APPS
# ----------------------------------------------------
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third-party apps
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",  # For logout/token invalidation
    "corsheaders",
    "debug_toolbar",
    "drf_spectacular",

    # Your apps
    "users",
    "organization",
    "packages",
    "tickets",
    "universal",  
    "booking",
    "blog",
    "ledger",
    "finance",  # Finance & Reports Module
    "operations",  # Hotel, Transport, Food, Airport, Ziyarat Operations
    "commissions",
    "area_leads",
    "leads",
    "logs",
    "promotion_center",
    "pax_movements",
    "hr",
    "passport_leads",  # Passport Leads & Follow-up Management
    "customers",  # Customer Auto-Collection & Lead Management
    "forms",  # Dynamic Forms for Lead Generation
]

# ----------------------------------------------------
# MIDDLEWARE
# ----------------------------------------------------
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "debug_toolbar.middleware.DebugToolbarMiddle"
    "ware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    # System logging middleware: captures POST/PUT/PATCH/DELETE actions
    "logs.middleware.SystemLogMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "configuration.urls"

# ----------------------------------------------------
# TEMPLATES
# ----------------------------------------------------
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [os.path.join(BASE_DIR, "templates")],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "configuration.wsgi.application"

# ----------------------------------------------------
# DATABASE CONFIGURATION (MySQL)
# ----------------------------------------------------
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'saerpk_local',   # Change this if your DB name is different
        'USER': 'root',
        'PASSWORD': 'root',       # Your MySQL password
        'HOST': '127.0.0.1',
        'PORT': '3306',
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            'charset': 'utf8mb4',  # Use utf8mb4 for full Unicode support (emojis, arrows, etc.)
        },
    }
}

# Use SQLite in-memory DB for testing only
if 'test' in sys.argv or os.environ.get('DJANGO_TEST_SQLITE'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
        }
    }

# ----------------------------------------------------
# PASSWORD VALIDATION
# ----------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ----------------------------------------------------
# INTERNATIONALIZATION
# ----------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Karachi"  # changed from UTC to your timezone
USE_I18N = True
USE_TZ = True

# ----------------------------------------------------
# STATIC & MEDIA FILES
# ----------------------------------------------------
STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "static")

MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ----------------------------------------------------
# REST FRAMEWORK & JWT CONFIG
# ----------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    # Custom exception handler for better error messages
    "EXCEPTION_HANDLER": "pax_movements.exception_handlers.custom_exception_handler",
    # Throttling: central config for named scopes (used by custom throttles)
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        # named scope used by PublicBookingRateThrottle (if you prefer central config)
        "public_booking": "10/min",
        # default anonymous throttle if applied globally
        "anon": "100/min",
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(days=365),  # Token valid for 1 year (won't expire until user logs out)
    "REFRESH_TOKEN_LIFETIME": timedelta(days=365),  # Refresh token also valid for 1 year
    "ROTATE_REFRESH_TOKENS": False,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

SPECTACULAR_SETTINGS = {
    "TITLE": "SAER.PK API",
    "DESCRIPTION": "All endpoints for organization, booking, packages, and more.",
    "VERSION": "1.0.0",
    # postprocessing hooks to mutate the generated schema (we add the packages example)
    "POSTPROCESSING_HOOKS": [
        "configuration.spectacular_hooks_fixed.add_packages_example"
    ],
}

# ----------------------------------------------------
# Kuickpay (third-party payment gateway) configuration
# ----------------------------------------------------
KUICKPAY_CONFIG = {
    'BASE_URL': 'http://localhost:8000/pay',
    'USERNAME': 'rafay',
    'PASSWORD': '12345',
    'TIMEOUT': 10,
}
# ----------------------------------------------------
# CORS & INTERNAL IPs
# ----------------------------------------------------
CORS_ALLOW_ALL_ORIGINS = True
INTERNAL_IPS = ["127.0.0.1"]

