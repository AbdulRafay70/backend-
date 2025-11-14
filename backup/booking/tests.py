"""
Compatibility shim: keep `booking.tests` importable while using the
`booking/tests/` package for actual test modules. This module exposes a
package-like __path__ and attempts to import the submodules so Django's
test runner can locate them as e.g. 'booking.tests.test_hotel_summary'.
"""
import importlib
import os

# Treat this module as a package by setting __path__ to the tests/ folder
__path__ = [os.path.join(os.path.dirname(__file__), "tests")]

_SUBMODULES = [
    "test_discounts_and_unpaid",
    "test_pax_summary",
    "test_hotel_summary",
    "test_transport_summary",
    "test_flight_summary",
    "test_public_booking",
    "test_scope",
    # added test modules created by recent work
    "test_admin_public_bookings",
    "test_admin_actions_notifications",
]

for _m in _SUBMODULES:
    try:
        importlib.import_module(f"{__name__}.{_m}")
    except Exception:
        # best-effort: let test discovery proceed; failures will show up when running tests
        pass
