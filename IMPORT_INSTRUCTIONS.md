# SAERPK PERMISSIONS IMPORT INSTRUCTIONS
## For Your Friend's Laptop

---

## Method 1: Using Django (Recommended - Easiest)

### Step 1: Get the permissions_data.json file
- You'll receive a file called `permissions_data.json`
- Copy it to the backend folder: `D:\Saerpk\backend\`

### Step 2: Import using Django command
Open PowerShell/Command Prompt in the backend folder and run:

```bash
python manage.py loaddata permissions_data.json
```

✓ Done! All permissions are now imported.

---

## Method 2: Using MySQL Workbench (If you prefer SQL)

### Step 1: Get the permissions_export.sql file
- You'll receive a file called `permissions_export.sql`

### Step 2: Import in MySQL Workbench
1. Open MySQL Workbench
2. Connect to your database
3. Go to: **File → Run SQL Script**
4. Select the `permissions_export.sql` file
5. Click **Run**

✓ Done!

---

## Method 3: Using MySQL Command Line

Open Command Prompt and run:

```bash
mysql -u root -p saerpk < permissions_export.sql
```

(Replace 'saerpk' with your database name if different)

---

## Verification

After importing, verify permissions are loaded:

```bash
python manage.py shell
```

Then run:
```python
from django.contrib.auth.models import Permission
print(f"Total Permissions: {Permission.objects.count()}")
```

You should see a number greater than 0.

---

## Troubleshooting

**Problem:** Import fails with foreign key errors

**Solution:** Make sure you've run migrations first:
```bash
python manage.py migrate
```

Then try importing again.

---

**Problem:** Permission already exists error

**Solution:** The permissions are already in your database. You're good!

---

## Questions?
Contact the person who shared this file with you.
