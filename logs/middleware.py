from django.utils.deprecation import MiddlewareMixin
from .utils import build_log_payload
from .utils import _sanitize_payload
from .models import SystemLog
from django.conf import settings


class SystemLogMiddleware(MiddlewareMixin):
    """
    Middleware to capture POST/PUT/PATCH/DELETE and create a SystemLog entry.
    It keeps the logic minimal to avoid interfering with responses.
    """

    WATCH_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

    def process_response(self, request, response):
        try:
            method = getattr(request, "method", "")
            if method and method.upper() in self.WATCH_METHODS:
                user = getattr(request, "user", None)
                user_id = getattr(user, "id", None) if user and user.is_authenticated else None

                # try to infer organization/branch from user attrs (best-effort)
                organization_id = getattr(user, "organization_id", None) if user else None
                branch_id = getattr(user, "branch_id", None) if user else None

                status_text = "success" if (200 <= getattr(response, "status_code", 0) < 400) else "failed"

                payload = build_log_payload(request=request, response=response)

                # Basic action type: METHOD + PATH (shortened)
                action_type = f"{method.upper()} {request.path}"

                SystemLog.objects.create(
                    action_type=action_type[:100],
                    model_name=getattr(request, 'resolver_match', None) and getattr(request.resolver_match, 'view_name', None) or request.path[:100],
                    record_id=None,
                    organization_id=organization_id,
                    branch_id=branch_id,
                    user_id=user_id,
                    description=f"Auto log for {method} {request.path}",
                    status=status_text,
                    ip_address=request.META.get("REMOTE_ADDR"),
                    new_data=payload,
                )
        except Exception:
            # Don't allow logging problems to break responses
            pass
        return response
