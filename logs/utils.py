from typing import Dict, Any
from django.utils import timezone
from decimal import Decimal
import datetime


def _sanitize_payload(payload: Any, sensitive_keys=None):
    """Recursively redact sensitive keys from payload dictionaries/lists.

    Replaces values for keys that match common sensitive names with "<REDACTED>".
    """
    if sensitive_keys is None:
        sensitive_keys = {"password", "token", "access", "refresh", "secret"}

    if isinstance(payload, dict):
        out = {}
        for k, v in payload.items():
            if k and isinstance(k, str) and k.lower() in sensitive_keys:
                out[k] = "<REDACTED>"
            else:
                out[k] = _sanitize_payload(v, sensitive_keys)
        return out

    if isinstance(payload, list):
        return [_sanitize_payload(i, sensitive_keys) for i in payload]

    # primitives
    # Convert types that are not JSON-serializable by default
    if isinstance(payload, Decimal):
        return str(payload)
    if isinstance(payload, (datetime.datetime, datetime.date)):
        try:
            return payload.isoformat()
        except Exception:
            return str(payload)

    # Fallback: convert unknown objects to string to avoid JSON serialization errors
    try:
        # strings, numbers, booleans already handled; for other objects, return str()
        return payload if isinstance(payload, (str, int, float, bool, type(None))) else str(payload)
    except Exception:
        return str(payload)


def build_log_payload(request=None, response=None) -> Dict[str, Any]:
    payload = {
        "method": getattr(request, "method", None),
        "path": getattr(request, "path", None),
        "status_code": getattr(response, "status_code", None),
    }
    try:
        if hasattr(request, "data"):
            payload["request_data"] = _sanitize_payload(request.data)
    except Exception:
        payload["request_data"] = None
    try:
        if hasattr(response, "data"):
            payload["response_data"] = _sanitize_payload(response.data)
    except Exception:
        payload["response_data"] = None
    payload["timestamp"] = timezone.now().isoformat()
    return payload
