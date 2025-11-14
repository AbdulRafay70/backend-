Deployment Guide — Lead Modules (leads & area_leads)

This guide packages the lead modules for deployment and shows how to schedule the daily maintenance commands:

- `python manage.py mark_overdue_loans` (from `leads` app)
- `python manage.py mark_overdue_promises` (from `area_leads` app)

It also points to the final delivery note: `docs/leads_area_leads_summary.md`.

## 1 — Prepare release package

1. Ensure all code changes are committed, including migrations under each app (`leads/migrations/` and `area_leads/migrations/`).
2. Update `requirements.txt` if you added new dependencies. Pin versions where possible.
3. Build a release tag in git (optional):

```powershell
git add -A
git commit -m "chore: lead modules ready for deployment"
git tag -a v1.0-leads -m "Lead modules release"
git push --follow-tags
```

## 2 — Pre-deployment checks (on server or staging)

- Pull code, create/activate virtualenv and install requirements.
- Run linting and tests:

```powershell
python -m venv .venv
. .venv/Scripts/Activate.ps1   # Windows PowerShell
pip install -r requirements.txt
python manage.py check
python manage.py test -v 2
```

## 3 — Database migration & startup

On the deployment host run:

```powershell
# Ensure you are in the project root and virtualenv is active
python manage.py migrate
python manage.py collectstatic --noinput
```

If you previously used `--fake-initial` in dev, avoid faking in production unless you understand the schema alignment.

## 4 — Scheduling daily commands

You can schedule the two commands in multiple ways depending on your environment. Below are examples for Linux (cron), systemd timers, Windows Task Scheduler, and Celery Beat.

Linux (crontab) — run at 08:00 every day

1. Edit crontab (as the deploy user):

```bash
crontab -e
```

2. Add these lines (adjust paths):

```cron
# Activate venv and run mark_overdue_loans at 08:00
0 8 * * * /bin/bash -lc 'source /opt/saer/.venv/bin/activate && cd /opt/saer && /opt/saer/.venv/bin/python manage.py mark_overdue_loans >> /var/log/saer/mark_overdue_loans.log 2>&1'

# Activate venv and run mark_overdue_promises at 08:10
10 8 * * * /bin/bash -lc 'source /opt/saer/.venv/bin/activate && cd /opt/saer && /opt/saer/.venv/bin/python manage.py mark_overdue_promises >> /var/log/saer/mark_overdue_promises.log 2>&1'
```

Notes:
- Use absolute paths for the Python executable and project directory.
- Redirect logs to a location with rotation (logrotate) so they don't grow indefinitely.

Windows Task Scheduler (PowerShell) — run daily at 08:00

Use schtasks to create tasks (run in an elevated PowerShell prompt):

```powershell
# mark_overdue_loans daily at 08:00
schtasks /Create /SC DAILY /TN "SAER_MarkOverdueLoans" /TR "C:\path\to\venv\Scripts\python.exe C:\path\to\project\manage.py mark_overdue_loans" /ST 08:00 /RU "DOMAIN\username" /RL HIGHEST

# mark_overdue_promises daily at 08:10
schtasks /Create /SC DAILY /TN "SAER_MarkOverduePromises" /TR "C:\path\to\venv\Scripts\python.exe C:\path\to\project\manage.py mark_overdue_promises" /ST 08:10 /RU "DOMAIN\username" /RL HIGHEST
```

Replace paths and user account as appropriate. Alternatively use the Task Scheduler GUI.

systemd timer example (Linux)

Create `/etc/systemd/system/mark_overdue_loans.service`:

```
[Unit]
Description=Run mark_overdue_loans

[Service]
Type=oneshot
WorkingDirectory=/opt/saer
ExecStart=/opt/saer/.venv/bin/python manage.py mark_overdue_loans
```

And `/etc/systemd/system/mark_overdue_loans.timer`:

```
[Unit]
Description=Daily timer for mark_overdue_loans

[Timer]
OnCalendar=*-*-* 08:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

Then enable & start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now mark_overdue_loans.timer
```

Celery Beat (if using Celery)

Add periodic tasks in your Celery beat schedule (example in Django settings):

```python
from datetime import timedelta
CELERY_BEAT_SCHEDULE = {
    'mark-overdue-loans-daily': {
        'task': 'leads.tasks.mark_overdue_loans',
        'schedule': crontab(hour=8, minute=0),
    },
    'mark-overdue-promises-daily': {
        'task': 'area_leads.tasks.mark_overdue_promises',
        'schedule': crontab(hour=8, minute=10),
    },
}
```

Implement small Celery tasks that call the management commands or contain the same logic.

## 5 — Log rotation & monitoring

- Ensure logs written by cron tasks are rotated. Add entries in `/etc/logrotate.d/saer` that rotate `/var/log/saer/*.log` daily or weekly.
- Add alerts/monitoring (Sentry/Prometheus) for failures in periodic jobs.

## 6 — Final handover / client delivery

- The final delivery note is `docs/leads_area_leads_summary.md`. It contains the full module summary, endpoints, tests, and next steps.
- Deliver the repository (tag or branch) and share the deployment instructions in this document.

## 7 — Quick checklist before closing

- [ ] Confirm production DB backups exist before migrations
- [ ] Ensure secrets (DB credentials) are present as env vars or secret manager
- [ ] Create a small smoke test script that hits `/api/area-leads/search` and `/api/leads/list` with an API token
- [ ] Schedule the cron/systemd/schtasks entries described above

---

If you want, I can create the following files to help deploy:

- `scripts/schedule_cron.sh` — prints the crontab lines customized to your paths (not executed)
- `scripts/create_schtasks.ps1` — PowerShell script that calls `schtasks` with your paths (not executed)

Would you like me to add those helper scripts (and populate them with your project paths), or do you prefer to schedule tasks manually?
