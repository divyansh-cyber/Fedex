# Simple PowerShell Performance Test

Write-Host "🎯 Testing Sequential Orders..." -ForegroundColor Yellow

$successCount = 0
$failCount = 0
$latencies = @()

for ($i = 1; $i -le 10; $i++) {
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
        Write-Host "Order $i`: ✅ SUCCESS ($($latency.TotalMilliseconds.ToString('F1'))ms)" -ForegroundColor Green
    }
    catch {
        $latency = (Get-Date) - $startTime
        $failCount++
        Write-Host "Order $i`: ❌ FAILED - $($_.Exception.Message) ($($latency.TotalMilliseconds.ToString('F1'))ms)" -ForegroundColor Red
    }
    
    # Small delay between orders
    Start-Sleep -Milliseconds 100
}

Write-Host "`n📊 RESULTS:" -ForegroundColor Cyan
Write-Host "Success: $successCount/10 ($([math]::Round($successCount/10*100, 1))%%)" -ForegroundColor Green
Write-Host "Failed: $failCount/10" -ForegroundColor Red

if ($latencies.Count -gt 0) {
    $avgLatency = ($latencies | Measure-Object -Average).Average
    $minLatency = ($latencies | Measure-Object -Minimum).Minimum
    $maxLatency = ($latencies | Measure-Object -Maximum).Maximum
    
    Write-Host "Average Latency: $($avgLatency.ToString('F1'))ms" -ForegroundColor White
    Write-Host "Min Latency: $($minLatency.ToString('F1'))ms" -ForegroundColor White
    Write-Host "Max Latency: $($maxLatency.ToString('F1'))ms" -ForegroundColor White
    $throughput = [math]::Round(1000/$avgLatency, 1)
    Write-Host "Estimated Throughput: $throughput orders/sec" -ForegroundColor White
}