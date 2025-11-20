import os
import sys

# ---------- Project path ----------
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_DIR)

# ---------- Activate virtual environment ----------
VENV_ACTIVATE = os.path.join(PROJECT_DIR, '.venv', 'bin', 'activate_this.py')
if os.path.exists(VENV_ACTIVATE):
    with open(VENV_ACTIVATE) as f:
        exec(f.read(), dict(__file__=VENV_ACTIVATE))
else:
    print("Warning: virtual environment not found at", VENV_ACTIVATE)

# ---------- Django settings ----------
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')

# ---------- WSGI Application ----------
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()

# ---------- Optional PATH_INFO Fix for Passenger ----------
class PassengerPathInfoFix:
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        # Ensure SCRIPT_NAME is empty and PATH_INFO is correct
        environ['SCRIPT_NAME'] = ''
        path_info = environ.get('PATH_INFO', '')
        environ['PATH_INFO'] = path_info
        return self.app(environ, start_response)

application = PassengerPathInfoFix(application)
