
import os
import django
from django.db import connection

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
django.setup()

with connection.cursor() as cursor:
    try:
        print("Adding PRIMARY KEY and AUTO_INCREMENT to auth_user.id...")
        cursor.execute("ALTER TABLE auth_user MODIFY id INT NOT NULL AUTO_INCREMENT PRIMARY KEY")
        print("Success.")
    except Exception as e:
        print(f"Error adding PK: {e}")

    try:
        print("Adding UNIQUE constraint to auth_user.username...")
        cursor.execute("ALTER TABLE auth_user ADD UNIQUE (username)")
        print("Success.")
    except Exception as e:
        print(f"Error adding UNIQUE username: {e}")
