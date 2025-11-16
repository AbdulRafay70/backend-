"""Utilities run at startup to help debugging during development.

This module exposes a helper that prints all registered URL patterns to the
console. It's intentionally lightweight and only used when DEBUG=True so it
doesn't run in production.
"""
from django.urls import get_resolver


def _extract_patterns(patterns, prefix=""):
    out = []
    for p in patterns:
        try:
            pattern = prefix + str(p.pattern)
        except Exception:
            pattern = prefix + repr(p)

        if hasattr(p, "url_patterns"):
            # included resolver
            out.extend(_extract_patterns(p.url_patterns, prefix=pattern))
        else:
            name = getattr(p, "name", "")
            callback = getattr(p, "callback", None)
            cb_name = getattr(callback, "__name__", repr(callback)) if callback else ""
            out.append((pattern, name, cb_name))
    return out


def print_urlpatterns():
    resolver = get_resolver()
    patterns = _extract_patterns(resolver.url_patterns)
    if not patterns:
        print("[startup] No URL patterns found.")
        return

    print("\n[startup] Registered URL patterns:")
    for pat, name, cb in patterns:
        print(f"  {pat}  -> name='{name}' callback={cb}")
    print("[startup] End of URL list.\n")
