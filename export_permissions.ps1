# =====================================================
# Saerpk Permissions Export Script
# Run this in PowerShell to create permissions SQL file
# =====================================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Saerpk Permissions Exporter" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Get database credentials
Write-Host "Please enter your MySQL database credentials:`n" -ForegroundColor Yellow

$dbName = Read-Host "Database name (default: saerpk)"
if ([string]::IsNullOrWhiteSpace($dbName)) {
    $dbName = "saerpk"
}

$dbUser = Read-Host "MySQL username (default: root)"
if ([string]::IsNullOrWhiteSpace($dbUser)) {
    $dbUser = "root"
}

$password = Read-Host "MySQL password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$dbPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$outputFile = "permissions_export.sql"

Write-Host "`nExporting permissions from database: $dbName..." -ForegroundColor Green

# Create the mysqldump command
$tables = "auth_permission auth_group auth_group_permissions django_content_type users_customuser_groups users_customuser_user_permissions"

$dumpCommand = "mysqldump -u $dbUser -p$dbPassword $dbName $tables"

Write-Host "`nRunning export command..." -ForegroundColor Yellow

try {
    # Execute mysqldump
    Invoke-Expression "$dumpCommand > $outputFile 2>&1"
    
    if (Test-Path $outputFile) {
        Write-Host "`n✓ SUCCESS! Permissions exported to: $outputFile" -ForegroundColor Green
        Write-Host "`nFile size: $((Get-Item $outputFile).Length) bytes" -ForegroundColor Cyan
        Write-Host "`nYou can now share this file with your friend." -ForegroundColor Yellow
        Write-Host "`nTo import on another computer, run in MySQL Workbench:" -ForegroundColor Yellow
        Write-Host "  File > Run SQL Script > Select $outputFile" -ForegroundColor White
        Write-Host "`nOr use command line:" -ForegroundColor Yellow
        Write-Host "  mysql -u root -p $dbName < $outputFile" -ForegroundColor White
    } else {
        Write-Host "`n✗ ERROR: Export file was not created." -ForegroundColor Red
    }
} catch {
    Write-Host "`n✗ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nAlternative method:" -ForegroundColor Yellow
    Write-Host "Use Django's dumpdata command instead:" -ForegroundColor White
    Write-Host "  python manage.py dumpdata auth.permission auth.group contenttypes.contenttype --indent 2 > permissions_data.json" -ForegroundColor Cyan
}

Write-Host "`n========================================`n" -ForegroundColor Cyan
