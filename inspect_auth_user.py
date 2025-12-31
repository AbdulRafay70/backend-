
import os
import django
from django.db import connection

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
django.setup()

with connection.cursor() as cursor:
    cursor.execute("SHOW CREATE TABLE auth_user")
    row = cursor.fetchone()
    print(row[1])
