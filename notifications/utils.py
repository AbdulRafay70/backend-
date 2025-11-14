"""Minimal notification utilities used by booking signals.

This provides a small send_agent_message function so signals can call a project-level
notification helper without introducing extra dependencies. It currently logs the
notification into SystemLog and returns True. Replace implementation to integrate
with your real push/SMS/email system.
"""
from logs.models import SystemLog


def send_agent_message(agent_id, message, booking_id=None):
    """Send notification to an agent (placeholder).

    agent_id: integer user id (or object) representing the agent
    message: string
    booking_id: optional booking id for context
    """
    desc = f"Notify agent {agent_id}: {message}"
    if booking_id:
        desc += f" (booking_id={booking_id})"

    # Log as an info system log (status success assumed)
    try:
        SystemLog.objects.create(
            action_type="notification:agent",
            model_name="Notification",
            record_id=booking_id,
            description=desc,
            status="success",
        )
    except Exception:
        # don't raise; notifications should be best-effort
        pass

    return True
