
import os
import django
from django.db import connection

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
django.setup()

with connection.cursor() as cursor:
    # Fix django_content_type
    try:
        print("Making django_content_type.name nullable...")
        cursor.execute("ALTER TABLE django_content_type MODIFY name VARCHAR(100) NULL")
        print("Success.")
    except Exception as e:
        print(f"Error fixing django_content_type: {e}")

    # Fix auth_permission
    try:
        print("Adding PK/AutoInc to auth_permission.id...")
        cursor.execute("ALTER TABLE auth_permission MODIFY id INT NOT NULL AUTO_INCREMENT PRIMARY KEY")
        print("Success.")
    except Exception as e:
        print(f"Error fixing auth_permission: {e}")
