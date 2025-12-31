
import os
import django
from django.db import connection

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
django.setup()

with connection.cursor() as cursor:
    cursor.execute("SHOW TABLES LIKE 'users_userprofile'")
    row = cursor.fetchone()
    if row:
        print("OK: Table 'users_userprofile' exists.")
    else:
        print("FAIL: Table 'users_userprofile' does NOT exist.")
        
    cursor.execute("SHOW TABLES LIKE 'token_blacklist_outstandingtoken'")
    row = cursor.fetchone()
    if row:
        print("OK: Table 'token_blacklist_outstandingtoken' exists.")
    else:
        print("FAIL: Table 'token_blacklist_outstandingtoken' does NOT exist.")
