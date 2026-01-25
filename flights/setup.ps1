# Flight Module Setup Script
# Run this to install dependencies and test the integration

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Flight Module Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment is activated
if ($env:VIRTUAL_ENV) {
    Write-Host "✓ Virtual environment detected: $env:VIRTUAL_ENV" -ForegroundColor Green
} else {
    Write-Host "⚠ Virtual environment not detected. Activating..." -ForegroundColor Yellow
    & .\.venv\Scripts\Activate.ps1
}

Write-Host ""
Write-Host "[Step 1/3] Installing dependencies..." -ForegroundColor Yellow
pip install websockets requests

Write-Host ""
Write-Host "[Step 2/3] Running migrations..." -ForegroundColor Yellow
python manage.py makemigrations
python manage.py migrate

Write-Host ""
Write-Host "[Step 3/3] Testing flight API..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Starting Django server..." -ForegroundColor Cyan
Write-Host "Test URLs:" -ForegroundColor Cyan
Write-Host "  - API Docs: http://localhost:8000/api/schema/swagger-ui/" -ForegroundColor White
Write-Host "  - Flight Search: POST http://localhost:8000/api/flights/search/" -ForegroundColor White
Write-Host "  - Auth Test: GET http://localhost:8000/api/flights/auth/test/" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

python manage.py runserver
