@echo off
REM =====================================================
REM Saerpk Permissions Export - Simple Batch Script
REM Run this to export permissions as JSON file
REM =====================================================

echo.
echo ========================================
echo Saerpk Permissions Exporter
echo ========================================
echo.

echo Exporting permissions using Django...
echo.

python export_permissions_django.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Export completed successfully!
    echo File created: permissions_data.json
    echo.
    pause
) else (
    echo.
    echo Export failed! Check error messages above.
    echo.
    pause
)
