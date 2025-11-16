"""
WSGI config for configuration project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')

application = get_wsgi_application()
try:
	# Print URL patterns to the console in development to aid debugging route issues
	from django.conf import settings
	if getattr(settings, "DEBUG", False):
		try:
			from .startup import print_urlpatterns
			print_urlpatterns()
		except Exception as e:
			# don't fail startup if URL printing has issues
			print(f"[startup] Failed to print URL patterns: {e}")
except Exception:
	pass
