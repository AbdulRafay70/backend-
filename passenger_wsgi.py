import os
import sys

# ---------------- Project paths ----------------
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_DIR)

# ---------------- Activate virtual environment ----------------
VENV_PYTHON = '/home/saeraqnj/virtualenv/api.saer.pk/3.10/bin/python'
VENV_ACTIVATE = '/home/saeraqnj/virtualenv/api.saer.pk/3.10/bin/activate_this.py'

if os.path.exists(VENV_ACTIVATE):
    with open(VENV_ACTIVATE) as f:
        exec(f.read(), dict(__file__=VENV_ACTIVATE))
else:
    print("Warning: virtual environment not found at", VENV_ACTIVATE)

# ---------------- Django settings ----------------
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')

# ---------------- WSGI Application ----------------
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()

# ---------------- Passenger PATH_INFO Fix ----------------
SCRIPT_NAME = os.getcwd()

class PassengerPathInfoFix(object):
    """
    Sets PATH_INFO from REQUEST_URI because Passenger doesn't provide it.
    """
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        from urllib.parse import unquote
        environ['SCRIPT_NAME'] = SCRIPT_NAME
        request_uri = unquote(environ['REQUEST_URI'])
        script_name = unquote(environ.get('SCRIPT_NAME', ''))
        offset = request_uri.startswith(script_name) and len(environ['SCRIPT_NAME']) or 0
        environ['PATH_INFO'] = request_uri[offset:].split('?', 1)[0]
        return self.app(environ, start_response)

# Wrap WSGI app
application = PassengerPathInfoFix(application)
