from .settings import *

# Local override for development/testing: use a file-based SQLite DB
LOCAL_DB_PATH = BASE_DIR / "local_db.sqlite3"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": str(LOCAL_DB_PATH),
    }
}

# Ensure DEBUG is True locally
DEBUG = True

# Allow local hosts (include 'testserver' for Django test client)
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "testserver"]
