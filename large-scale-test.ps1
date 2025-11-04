# Large Scale Performance Test - 2100 Orders

Write-Host "🚀 LARGE SCALE PERFORMANCE TEST" -ForegroundColor Cyan
Write-Host "Target: 2,100 orders to validate throughput claims" -ForegroundColor Yellow
Write-Host "=" * 60

$totalOrders = 2100
$batchSize = 50  # Process in batches to avoid overwhelming
$delayBetweenOrders = 50  # Start with 50ms delay
$delayBetweenBatches = 1000  # 1 second between batches

$allResults = @()
$totalStartTime = Get-Date

Write-Host "Configuration:" -ForegroundColor White
Write-Host "  Total Orders: $totalOrders"
Write-Host "  Batch Size: $batchSize"
Write-Host "  Delay Between Orders: ${delayBetweenOrders}ms"
Write-Host "  Delay Between Batches: ${delayBetweenBatches}ms"
Write-Host ""

$totalBatches = [math]::Ceiling($totalOrders / $batchSize)

for ($batch = 1; $batch -le $totalBatches; $batch++) {
    $batchStartTime = Get-Date
    $ordersInThisBatch = [math]::Min($batchSize, $totalOrders - (($batch - 1) * $batchSize))
    
    Write-Host "Processing Batch $batch/$totalBatches ($ordersInThisBatch orders)..." -ForegroundColor Green
    
    $batchResults = @()
    $successCount = 0
    $failCount = 0
    
    for ($i = 1; $i -le $ordersInThisBatch; $i++) {
        $orderNumber = (($batch - 1) * $batchSize) + $i
        
        $body = @{
            client_id = "load-test-$orderNumber"
            instrument = "BTC-USD"
            side = if ($orderNumber % 2 -eq 0) { "buy" } else { "sell" }
            type = "limit"
            price = 70000 + (Get-Random -Minimum -500 -Maximum 500)
            quantity = [math]::Round((Get-Random -Minimum 0.01 -Maximum 0.1), 3)
        } | ConvertTo-Json

        $orderStartTime = Get-Date
        
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:3000/orders" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 30
            $latency = (Get-Date) - $orderStartTime
            
            $result = @{
                OrderNumber = $orderNumber
                Success = $true
                Latency = $latency.TotalMilliseconds
                Batch = $batch
            }
            
            $batchResults += $result
            $allResults += $result
            $successCount++
            
            # Progress indicator
            if ($i % 10 -eq 0) {
                Write-Host "  $i/$ordersInThisBatch completed..." -ForegroundColor Gray
            }
        }
        catch {
            $latency = (Get-Date) - $orderStartTime
            
            $result = @{
                OrderNumber = $orderNumber
                Success = $false
                Latency = $latency.TotalMilliseconds
                Error = $_.Exception.Message
                Batch = $batch
            }
            
            $batchResults += $result
            $allResults += $result
            $failCount++
            
            Write-Host "  Order $orderNumber FAILED: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        # Small delay between orders
        if ($i -lt $ordersInThisBatch) {
            Start-Sleep -Milliseconds $delayBetweenOrders
        }
    }
    
    $batchDuration = (Get-Date) - $batchStartTime
    $batchThroughput = $ordersInThisBatch / $batchDuration.TotalSeconds
    
    Write-Host "  Batch $batch Results: $successCount success, $failCount failed" -ForegroundColor White
    Write-Host "  Batch Duration: $($batchDuration.TotalSeconds.ToString('F1'))s" -ForegroundColor White
    Write-Host "  Batch Throughput: $($batchThroughput.ToString('F1')) orders/sec" -ForegroundColor White
    Write-Host ""
    
    # Delay between batches (except for the last one)
    if ($batch -lt $totalBatches) {
        Write-Host "  Waiting ${delayBetweenBatches}ms before next batch..." -ForegroundColor Gray
        Start-Sleep -Milliseconds $delayBetweenBatches
    }
}

$totalDuration = (Get-Date) - $totalStartTime
$successfulOrders = ($allResults | Where-Object { $_.Success }).Count
$failedOrders = $allResults.Count - $successfulOrders

Write-Host "🎯 FINAL RESULTS" -ForegroundColor Cyan -BackgroundColor Black
Write-Host "=" * 60

Write-Host "Total Orders Attempted: $($allResults.Count)" -ForegroundColor White
Write-Host "Successful Orders: $successfulOrders" -ForegroundColor Green
Write-Host "Failed Orders: $failedOrders" -ForegroundColor Red
Write-Host "Success Rate: $([math]::Round($successfulOrders / $allResults.Count * 100, 2))%" -ForegroundColor Yellow

Write-Host ""
Write-Host "TIMING RESULTS:" -ForegroundColor White
Write-Host "Total Duration: $($totalDuration.TotalSeconds.ToString('F1')) seconds" -ForegroundColor White
Write-Host "Total Duration: $($totalDuration.TotalMinutes.ToString('F1')) minutes" -ForegroundColor White

if ($successfulOrders -gt 0) {
    $successfulResults = $allResults | Where-Object { $_.Success }
    $avgLatency = ($successfulResults | Measure-Object -Property Latency -Average).Average
    $minLatency = ($successfulResults | Measure-Object -Property Latency -Minimum).Minimum
    $maxLatency = ($successfulResults | Measure-Object -Property Latency -Maximum).Maximum
    
    Write-Host ""
    Write-Host "LATENCY ANALYSIS:" -ForegroundColor White
    Write-Host "Average Latency: $($avgLatency.ToString('F1'))ms" -ForegroundColor White
    Write-Host "Min Latency: $($minLatency.ToString('F1'))ms" -ForegroundColor White
    Write-Host "Max Latency: $($maxLatency.ToString('F1'))ms" -ForegroundColor White
    
    Write-Host ""
    Write-Host "THROUGHPUT ANALYSIS:" -ForegroundColor White
    $overallThroughput = $successfulOrders / $totalDuration.TotalSeconds
    Write-Host "Overall Throughput: $($overallThroughput.ToString('F1')) orders/sec" -ForegroundColor Yellow
    Write-Host "Peak Theoretical: $((1000 / $avgLatency).ToString('F1')) orders/sec (single connection)" -ForegroundColor White
    
    # Compare to claimed performance
    Write-Host ""
    Write-Host "COMPARISON TO CLAIMS:" -ForegroundColor Magenta
    $claimedThroughput = 2100
    $actualPercentage = ($overallThroughput / $claimedThroughput) * 100
    Write-Host "Claimed: $claimedThroughput orders/sec" -ForegroundColor White
    Write-Host "Actual: $($overallThroughput.ToString('F1')) orders/sec" -ForegroundColor White
    Write-Host "Achievement: $($actualPercentage.ToString('F1'))% of claimed performance" -ForegroundColor $(if ($actualPercentage -ge 50) { "Green" } elseif ($actualPercentage -ge 25) { "Yellow" } else { "Red" })
}

if ($failedOrders -gt 0) {
    Write-Host ""
    Write-Host "ERROR ANALYSIS:" -ForegroundColor Red
    $failedResults = $allResults | Where-Object { -not $_.Success }
    $errorGroups = $failedResults | Group-Object -Property Error
    foreach ($errorGroup in $errorGroups) {
        Write-Host "  $($errorGroup.Name): $($errorGroup.Count) occurrences" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Test completed!" -ForegroundColor Green