# Simple Performance Test

Write-Host "Testing Exchange Performance..." -ForegroundColor Yellow

$successCount = 0
$failCount = 0
$latencies = @()

for ($i = 1; $i -le 5; $i++) {
    $body = @{
        client_id = "test$i"
        instrument = "BTC-USD"
        side = "buy"
        type = "limit"
        price = 70000
        quantity = 0.01
    } | ConvertTo-Json

    $startTime = Get-Date
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/orders" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 10
        $latency = (Get-Date) - $startTime
        $latencies += $latency.TotalMilliseconds
        $successCount++
        Write-Host "Order $i SUCCESS - $($latency.TotalMilliseconds.ToString('F0'))ms" -ForegroundColor Green
    }
    catch {
        $latency = (Get-Date) - $startTime
        $failCount++
        Write-Host "Order $i FAILED - $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 200
}

Write-Host ""
Write-Host "RESULTS:"
Write-Host "Success: $successCount/5"
Write-Host "Failed: $failCount/5"

if ($latencies.Count -gt 0) {
    $avgLatency = ($latencies | Measure-Object -Average).Average
    Write-Host "Average Latency: $($avgLatency.ToString('F0'))ms"
    $throughput = [math]::Round(1000/$avgLatency, 1)
    Write-Host "Estimated Throughput: $throughput orders/sec"
}