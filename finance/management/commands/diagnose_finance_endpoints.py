from django.core.management.base import BaseCommand
from django.test import Client
from django.contrib.auth import get_user_model
import traceback


class Command(BaseCommand):
    help = "Diagnose common 500s on finance endpoints by calling them and printing responses or tracebacks."

    def handle(self, *args, **options):
        User = get_user_model()

        username = "__diag_user__"
        password = "diag-pass-please-change"

        user, created = User.objects.get_or_create(username=username)
        if created:
            user.set_password(password)
            user.is_staff = True
            user.is_superuser = True
            user.save()

        client = Client()
        logged_in = client.login(username=username, password=password)
        if not logged_in:
            self.stderr.write("Failed to log in diagnostic user; cannot authenticate requests.")

        endpoints = [
            ("GET", "/api/finance/dashboard"),
            ("GET", "/api/finance/dashboard/period?period=today"),
            ("GET", "/api/finance/expense/list"),
            ("GET", "/api/finance/summary/all"),
            ("GET", "/reports/profit-loss"),
            ("GET", "/reports/fbr/summary/csv?year=2025"),
        ]

        for method, url in endpoints:
            self.stdout.write(f"Calling {method} {url}")
            try:
                if method == 'GET':
                    resp = client.get(url)
                else:
                    resp = client.post(url, {})

                self.stdout.write(f"Status: {resp.status_code}")
                # Try to print JSON if available, else text
                try:
                    data = resp.json()
                    self.stdout.write(f"JSON: {data}")
                except Exception:
                    content = resp.content.decode('utf-8', errors='replace')
                    self.stdout.write(f"Body: {content[:1000]}")

            except Exception as e:
                self.stderr.write("Exception occurred:\n")
                self.stderr.write(traceback.format_exc())

        self.stdout.write("Diagnostic run complete.")
