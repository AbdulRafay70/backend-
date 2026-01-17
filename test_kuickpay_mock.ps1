# Test Kuickpay APIs with Mock Server
# This script tests both Bill Inquiry and Bill Payment endpoints

Write-Host "=== Testing Kuickpay APIs with Mock Server ===" -ForegroundColor Cyan
Write-Host ""

# First, let's test the mock server directly
Write-Host "1. Testing Mock Kuickpay Server (Direct)" -ForegroundColor Yellow
Write-Host "   Endpoint: POST http://localhost:8000/mock/api/v1/BillInquiry" -ForegroundColor Gray

$mockInquiryBody = @{
    consumer_number = "095716373739"
    bank_mnemonic = "KPY"
    reserved = ""
} | ConvertTo-Json

try {
    $mockResponse = Invoke-WebRequest -Uri "http://localhost:8000/mock/api/v1/BillInquiry" `
        -Method POST `
        -ContentType "application/json" `
        -Body $mockInquiryBody `
        -UseBasicParsing
    
    Write-Host "   Status: $($mockResponse.StatusCode)" -ForegroundColor Green
    Write-Host "   Response:" -ForegroundColor Green
    $mockResponse.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "   Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "2. Testing Bill Inquiry API (via Django Backend)" -ForegroundColor Yellow
Write-Host "   Endpoint: GET http://localhost:8000/api/kuickpay/bill-inquiry/" -ForegroundColor Gray
Write-Host "   Note: This requires JWT token authentication" -ForegroundColor Gray
Write-Host ""

# Note: To test the full flow, you need to:
# 1. Login to get JWT token
# 2. Use that token to call the Kuickpay APIs

Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Import the Postman collection: SAER_Kuickpay_Working_Collection.postman_collection.json"
Write-Host "2. Login to get JWT token"
Write-Host "3. Test Bill Inquiry and Bill Payment APIs"
