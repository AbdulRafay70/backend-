
import os
import django
from django.db import connection

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
django.setup()

with connection.cursor() as cursor:
    cursor.execute("SHOW TABLES LIKE 'token_blacklist_outstandingtoken'")
    row = cursor.fetchone()
    if row:
        print("VERIFICATION PASSED: Table 'token_blacklist_outstandingtoken' exists.")
    else:
        print("VERIFICATION FAILED: Table 'token_blacklist_outstandingtoken' does NOT exist.")
