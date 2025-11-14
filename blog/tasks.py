from django.conf import settings
from django.utils import timezone
from django.db import transaction
import time
import json

from .models import FormSubmission, FormSubmissionTask
import logging

logger = logging.getLogger(__name__)


LEADS_API_URL = getattr(settings, "LEADS_API_URL", None)
LEADS_API_TIMEOUT = getattr(settings, "LEADS_API_TIMEOUT", 10)


def forward_submission_to_leads(submission: FormSubmission):
    """Forward a submission to the Leads API synchronously. Returns (success, result_dict_or_error).

    This function is intended to be called by the queue processor. It does not touch task rows; it
    only updates the submission object based on outcome.
    """
    if LEADS_API_URL is None:
        return False, {"error": "LEADS_API_URL not configured"}

    payload = submission.payload or {}
    # add trace data
    payload_with_trace = {"trace_submission_id": submission.pk, "payload": payload}

    try:
        import requests

        resp = requests.post(LEADS_API_URL, json=payload_with_trace, timeout=LEADS_API_TIMEOUT)
        try:
            data = resp.json()
        except Exception:
            data = {"status_code": resp.status_code, "text": resp.text}

        if resp.status_code in (200, 201):
            # expected a lead id in response (best-effort)
            lead_ref = None
            if isinstance(data, dict):
                lead_ref = data.get("lead_id") or data.get("id")
            submission.is_forwarded = True
            submission.status = "forwarded"
            if lead_ref:
                submission.lead_ref = str(lead_ref)
            submission.error_details = None
            submission.forwarded_at = timezone.now()
            # store the full response safely (could be large) - best-effort
            try:
                submission.forwarded_response = data
            except Exception:
                submission.forwarded_response = {"note": "unable to serialize response"}
            submission.save(update_fields=["is_forwarded", "status", "lead_ref", "error_details", "forwarded_at", "forwarded_response"])
            logger.info("FormSubmission %s forwarded to Leads API: status=%s", submission.pk, resp.status_code)
            return True, data

        # non-success status code
        submission.status = "error"
        submission.error_details = {"http_status": resp.status_code, "response": data}
        # also save last response for debugging
        try:
            submission.forwarded_response = data
        except Exception:
            submission.forwarded_response = {"note": "unable to serialize response"}
        submission.save(update_fields=["status", "error_details", "forwarded_response"])
        logger.warning("FormSubmission %s received non-success from Leads API: %s", submission.pk, resp.status_code)
        return False, submission.error_details

    except Exception as exc:
        err = {"exception": str(exc)}
        submission.status = "error"
        submission.error_details = err
        try:
            submission.forwarded_response = {"exception": str(exc)}
        except Exception:
            pass
        submission.save(update_fields=["status", "error_details", "forwarded_response"])
        logger.exception("Error forwarding FormSubmission %s to Leads API", submission.pk)
        return False, err
