@echo off
echo ========================================
echo KUICKPAY API TEST SCRIPT
echo ========================================
echo.

echo STEP 1: Getting Authentication Token
echo ========================================
echo.

set "loginBody={\"email\":\"admin@gmail.com\",\"password\":\"admin@123\"}"

powershell -Command "$body = '%loginBody%'; try { $response = Invoke-RestMethod -Uri 'http://localhost:8000/api/token/' -Method Post -Body $body -ContentType 'application/json'; $token = $response.access; Write-Host 'Token obtained successfully!'; Write-Host ''; Write-Host 'Token:' $token; Write-Host ''; Write-Host '========================================'; Write-Host 'STEP 2: Testing Bill Inquiry API'; Write-Host '========================================'; Write-Host ''; try { $inquiry = Invoke-RestMethod -Uri 'http://localhost:8000/api/kuickpay/bill-inquiry/?consumer_number=0000812345&bank_mnemonic=KPY' -Method Get -Headers @{Authorization=\"Bearer $token\"}; Write-Host 'Bill Inquiry Response:'; $inquiry | ConvertTo-Json -Depth 10; } catch { Write-Host 'Bill Inquiry failed:' $_.Exception.Message; }; Write-Host ''; Write-Host '========================================'; Write-Host 'STEP 3: Testing Bill Payment API'; Write-Host '========================================'; Write-Host ''; $now = Get-Date; $tranDate = $now.ToString('yyyyMMdd'); $tranTime = $now.ToString('HHmmss'); $paymentBody = @{consumer_number='0000812345';tran_auth_id='AUTH123456';transaction_amount='1869.00';tran_date=$tranDate;tran_time=$tranTime;bank_mnemonic='KPY';reserved=''} | ConvertTo-Json; try { $payment = Invoke-RestMethod -Uri 'http://localhost:8000/api/kuickpay/bill-payment/' -Method Post -Body $paymentBody -Headers @{Authorization=\"Bearer $token\";'Content-Type'='application/json'}; Write-Host 'Bill Payment Response:'; $payment | ConvertTo-Json -Depth 10; } catch { Write-Host 'Bill Payment failed:' $_.Exception.Message; }; } catch { Write-Host 'Authentication failed:' $_.Exception.Message; }"

echo.
echo ========================================
echo TEST COMPLETE
echo ========================================
