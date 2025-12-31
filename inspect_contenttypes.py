
import os
import django
from django.db import connection

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
django.setup()

with connection.cursor() as cursor:
    try:
        cursor.execute("SHOW CREATE TABLE django_content_type")
        row = cursor.fetchone()
        print("django_content_type:", row[1])
    except Exception as e:
        print("django_content_type error:", e)

    try:
        cursor.execute("SHOW CREATE TABLE auth_permission")
        row = cursor.fetchone()
        print("auth_permission:", row[1])
    except Exception as e:
        print("auth_permission error:", e)
