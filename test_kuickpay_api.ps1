# Kuickpay API Test Script (PowerShell)
# This script tests both bill inquiry and bill payment endpoints

$BASE_URL = "http://localhost:8000"
$EMAIL = "admin@gmail.com"
$PASSWORD = "admin@123"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "KUICKPAY API TEST SCRIPT" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Get Authentication Token
Write-Host "STEP 1: Getting Authentication Token" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow

$loginUrl = "$BASE_URL/api/token/"
$loginBody = @{
    email = $EMAIL
    password = $PASSWORD
} | ConvertTo-Json

Write-Host "Request URL: $loginUrl" -ForegroundColor Green
Write-Host "Request Body:" -ForegroundColor Green
Write-Host $loginBody -ForegroundColor White

try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.access
    
    Write-Host "`nResponse:" -ForegroundColor Green
    Write-Host ($loginResponse | ConvertTo-Json -Depth 10) -ForegroundColor White
    Write-Host "`n✅ Successfully obtained token!`n" -ForegroundColor Green
} catch {
    Write-Host "`n❌ Failed to get token!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Test Bill Inquiry API
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "STEP 2: Testing Bill Inquiry API" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow

$inquiryUrl = "$BASE_URL/api/kuickpay/bill-inquiry/?consumer_number=0000812345&bank_mnemonic=KPY&reserved="
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "Request URL: $inquiryUrl" -ForegroundColor Green
Write-Host "Headers: Authorization: Bearer $($token.Substring(0,20))..." -ForegroundColor Green

try {
    $inquiryResponse = Invoke-RestMethod -Uri $inquiryUrl -Method Get -Headers $headers
    
    Write-Host "`nResponse:" -ForegroundColor Green
    Write-Host ($inquiryResponse | ConvertTo-Json -Depth 10) -ForegroundColor White
    Write-Host "`n✅ Bill Inquiry successful!`n" -ForegroundColor Green
} catch {
    Write-Host "`n❌ Bill Inquiry failed!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    
    # Try to get error response body
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error Response: $errorBody" -ForegroundColor Red
    } catch {}
}

# Step 3: Test Bill Payment API
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "STEP 3: Testing Bill Payment API" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow

$paymentUrl = "$BASE_URL/api/kuickpay/bill-payment/"

# Get current date and time
$now = Get-Date
$tranDate = $now.ToString("yyyyMMdd")
$tranTime = $now.ToString("HHmmss")

$paymentBody = @{
    consumer_number = "0000812345"
    tran_auth_id = "AUTH123456"
    transaction_amount = "1869.00"
    tran_date = $tranDate
    tran_time = $tranTime
    bank_mnemonic = "KPY"
    reserved = ""
} | ConvertTo-Json

Write-Host "Request URL: $paymentUrl" -ForegroundColor Green
Write-Host "Request Body:" -ForegroundColor Green
Write-Host $paymentBody -ForegroundColor White
Write-Host "Headers: Authorization: Bearer $($token.Substring(0,20))..." -ForegroundColor Green

try {
    $paymentResponse = Invoke-RestMethod -Uri $paymentUrl -Method Post -Body $paymentBody -Headers $headers
    
    Write-Host "`nResponse:" -ForegroundColor Green
    Write-Host ($paymentResponse | ConvertTo-Json -Depth 10) -ForegroundColor White
    Write-Host "`n✅ Bill Payment successful!`n" -ForegroundColor Green
} catch {
    Write-Host "`n❌ Bill Payment failed!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    
    # Try to get error response body
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error Response: $errorBody" -ForegroundColor Red
    } catch {}
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`n📝 NOTES:" -ForegroundColor Yellow
Write-Host "- The Kuickpay BASE_URL is configured as: http://localhost:8000/pay" -ForegroundColor White
Write-Host "- This appears to be a mock/test endpoint" -ForegroundColor White
Write-Host "- The actual Kuickpay service needs to be running at that URL" -ForegroundColor White
Write-Host "- Update KUICKPAY_CONFIG in settings.py with the real Kuickpay URL if needed" -ForegroundColor White
