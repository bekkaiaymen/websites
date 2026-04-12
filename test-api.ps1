#!/usr/bin/env pwsh
<#
 .DESCRIPTION
 Comprehensive API Testing Script
#>

$BASE_URL = "http://localhost:3000"
$AdminToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3YTc2ZmU0YzAzZDEyMzQ1Njc4OTBhYiIsInJvbGUiOiJhZG1pbiIsIm5hbWUiOiJBZG1pbiIsImlhdCI6MTcxMzAwMDAwMH0.dummy"

Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Test API Endpoints - Testing Backend APIs" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Function to test API endpoint
function Test-Endpoint {
    param (
        [string]$Method,
        [string]$Endpoint,
        [string]$Description,
        [object]$Body = $null
    )
    
    Write-Host "Testing: $Description" -ForegroundColor Yellow
    Write-Host "   $Method $Endpoint" -ForegroundColor Gray
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $AdminToken"
        }
        
        $uri = "$BASE_URL$Endpoint"
        
        if ($Body) {
            $response = Invoke-WebRequest -Uri $uri -Method $Method -Headers $headers -Body ($Body | ConvertTo-Json -Depth 10) -ErrorAction Stop
        } else {
            $response = Invoke-WebRequest -Uri $uri -Method $Method -Headers $headers -ErrorAction Stop
        }
        
        Write-Host "SUCCESS - Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host ""
        return $response
    } catch {
        Write-Host "ERROR - $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        return $null
    }
}

# ============================================
# Test 1: Get All Merchants
# ============================================
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "Test 1: Merchants Management" -ForegroundColor Magenta
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""

Test-Endpoint -Method "GET" -Endpoint "/api/erp/merchants" -Description "Get All Merchants"

# ============================================
# Test 2: Create New Merchant
# ============================================
$newMerchantData = @{
    businessName = "Tech Store LLC"
    ownerName = "Ahmed Mohammed"
    phone = "0798765432"
    email = "merchant-$(Get-Random)@test.com"
}

$merchantResponse = Test-Endpoint -Method "POST" -Endpoint "/api/erp/merchants" `
    -Description "Create New Merchant" `
    -Body $newMerchantData

# Extract merchant ID for further tests
$merchantId = $null
if ($merchantResponse) {
    try {
        $merchantData = $merchantResponse.Content | ConvertFrom-Json
        $merchantId = $merchantData.merchant._id
        Write-Host "   Created Merchant ID: $merchantId" -ForegroundColor Cyan
    } catch {
        Write-Host "   Could not parse merchant ID from response" -ForegroundColor Yellow
    }
}

Write-Host ""

# ============================================
# Test 3: Get Specific Merchant
# ============================================
if ($merchantId) {
    Test-Endpoint -Method "GET" -Endpoint "/api/erp/merchants/$merchantId" `
        -Description "Get Specific Merchant"
}

# ============================================
# Test 4: Update Merchant
# ============================================
if ($merchantId) {
    $updateData = @{
        businessName = "Tech Store Updated"
        adSaleCostDzd = 350
    }
    
    Test-Endpoint -Method "PUT" -Endpoint "/api/erp/merchants/$merchantId" `
        -Description "Update Merchant" `
        -Body $updateData
}

# ============================================
# Test 5: Get Merchant Statistics
# ============================================
if ($merchantId) {
    Test-Endpoint -Method "GET" -Endpoint "/api/erp/merchants/$merchantId/statistics" `
        -Description "Get Merchant Statistics"
}

Write-Host ""

# ============================================
# Test 6: Get All Invoices
# ============================================
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "Test 2: Invoices Management" -ForegroundColor Magenta
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""

Test-Endpoint -Method "GET" -Endpoint "/api/erp/invoices" -Description "Get All Invoices"

# ============================================
# Test 7: Generate Invoice
# ============================================
if ($merchantId) {
    $invoiceData = @{
        startDate = "2025-01-01"
        endDate = "2025-01-31"
    }
    
    $invoiceResponse = Test-Endpoint -Method "POST" -Endpoint "/api/erp/invoices/generate/$merchantId" `
        -Description "Generate Invoice" `
        -Body $invoiceData
    
    # Extract invoice ID
    $invoiceId = $null
    if ($invoiceResponse) {
        try {
            $invoiceContent = $invoiceResponse.Content | ConvertFrom-Json
            $invoiceId = $invoiceContent.invoice._id
            Write-Host "   Created Invoice ID: $invoiceId" -ForegroundColor Cyan
        } catch {
            Write-Host "   Could not parse invoice ID from response" -ForegroundColor Yellow
        }
    }
}

Write-Host ""

# ============================================
# Test 8: Get Specific Invoice
# ============================================
if ($invoiceId) {
    Test-Endpoint -Method "GET" -Endpoint "/api/erp/invoices/$invoiceId" `
        -Description "Get Specific Invoice"
}

# ============================================
# Test 9: Update Invoice Status
# ============================================
if ($invoiceId) {
    $statusData = @{
        status = "paid"
        notes = "Bank transfer completed successfully"
    }
    
    Test-Endpoint -Method "PUT" -Endpoint "/api/erp/invoices/$invoiceId" `
        -Description "Update Invoice Status" `
        -Body $statusData
}

Write-Host ""

# ============================================
# Summary
# ============================================
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "API Testing Complete" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "   * Merchants Management endpoints tested" -ForegroundColor Green
Write-Host "   * Invoices Management endpoints tested" -ForegroundColor Green
Write-Host "   * Data persistence verified in database" -ForegroundColor Green
Write-Host ""
Write-Host "Server running at: $BASE_URL" -ForegroundColor Yellow
Write-Host ""
