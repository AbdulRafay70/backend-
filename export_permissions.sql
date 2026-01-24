-- =====================================================
-- Saerpk Permissions Export
-- Created: January 20, 2026
-- Instructions: Import this file in MySQL Workbench
-- =====================================================

-- Disable foreign key checks for import
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- Step 1: Export Content Types (Required for Permissions)
-- =====================================================

-- Note: You'll need to export auth_permission and django_content_type tables
-- Run these commands in MySQL Workbench or terminal to generate the data:

-- For Content Types:
-- SELECT * FROM django_content_type INTO OUTFILE '/tmp/content_types.sql';

-- For Permissions:
-- SELECT * FROM auth_permission INTO OUTFILE '/tmp/permissions.sql';

-- For Groups:
-- SELECT * FROM auth_group INTO OUTFILE '/tmp/groups.sql';

-- For Group Permissions:
-- SELECT * FROM auth_group_permissions INTO OUTFILE '/tmp/group_permissions.sql';


-- =====================================================
-- ALTERNATIVE: Use mysqldump command
-- =====================================================

-- Open terminal/PowerShell and run:
-- 
-- cd D:\Saerpk\backend
-- 
-- mysqldump -u root -p your_database_name auth_permission auth_group auth_group_permissions django_content_type > permissions_export.sql
-- 
-- Then share the permissions_export.sql file with your friend
-- 
-- To import on friend's laptop:
-- mysql -u root -p your_database_name < permissions_export.sql


-- =====================================================
-- OPTION 2: Django Management Command (Recommended)
-- =====================================================

-- Instead of SQL file, use Django's dumpdata command:
-- 
-- python manage.py dumpdata auth.permission auth.group contenttypes.contenttype --indent 2 > permissions_data.json
-- 
-- Your friend can import it with:
-- python manage.py loaddata permissions_data.json


-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- END OF FILE
-- =====================================================
