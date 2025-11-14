default_app_config = "customers.apps.CustomersConfig"

# Ensure signals are imported when the app is ready
try:
	from . import signals  # noqa: F401
except Exception:
	# avoid import-time errors during migrations or tests if dependent apps are not ready
	pass
