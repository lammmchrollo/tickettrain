# Demo payment flow (mock checkout)
# Update API URL and TOKEN before running.

$API = "http://localhost:5000/api"
$TOKEN = $env:VETAU_DEMO_TOKEN

if ([string]::IsNullOrWhiteSpace($TOKEN)) {
  Write-Host "Missing token. Set env VETAU_DEMO_TOKEN and rerun." -ForegroundColor Yellow
  Write-Host "Example: `$env:VETAU_DEMO_TOKEN = 'your_jwt_token'" -ForegroundColor Yellow
  exit 1
}

$body = @{
  provider = "vnpay"
  selectedTrain = @{ name = "SE1"; type = "standard"; dep = "06:00"; arr = "20:30"; dur = "14h 30m" }
  searchData = @{ from = "HN"; to = "DN" }
  selectedSeats = @("12A", "12B")
  passengers = @(
    @{ fullName = "Demo A"; phone = "0900000000"; idCard = "012345678901"; email = "demo@example.com" },
    @{ fullName = "Demo B"; phone = "0900000001"; idCard = "012345678902"; email = "demo2@example.com" }
  )
  totalPrice = 1000000
  serviceFee = 20000
  discount = 0
  finalTotal = 1020000
} | ConvertTo-Json -Depth 6

$resp = Invoke-RestMethod -Method Post -Uri "$API/payments/create" -Headers @{ Authorization = "Bearer $TOKEN" } -ContentType "application/json" -Body $body
$checkoutUrl = $resp.data.checkoutUrl

if ([string]::IsNullOrWhiteSpace($checkoutUrl)) {
  Write-Host "Checkout URL not returned. Check API response." -ForegroundColor Red
  Write-Host ($resp | ConvertTo-Json -Depth 6)
  exit 1
}

Write-Host "Checkout URL:" $checkoutUrl

# Open mock checkout in browser
Start-Process $checkoutUrl
