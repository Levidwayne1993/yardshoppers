$projectDir = "C:\yardshoppers"
$logFile = "$projectDir\collector-log.txt"
$port = 3099
$cronSecret = "2c142c1484a04c8feb4df66cac95ba0a0f14ce35376cc06b671e108c02b6ef54"

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $logFile -Value "=========================================="
Add-Content -Path $logFile -Value "Collection started at $timestamp"

try {
    Set-Location $projectDir

    $existing = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($existing) {
        $existing | ForEach-Object {
            Stop-Process -Id (Get-Process -Id $_.OwningProcess).Id -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 2
    }

    $env:PORT = $port
    $serverProcess = Start-Process -FilePath "npx" -ArgumentList "next", "dev", "-p", $port -WorkingDirectory $projectDir -PassThru -WindowStyle Hidden

    Add-Content -Path $logFile -Value "Dev server started (PID: $($serverProcess.Id)) on port $port"

    $ready = $false
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 2
        try {
            $test = Invoke-WebRequest -Uri "http://localhost:$port" -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
            if ($test.StatusCode -ge 200 -and $test.StatusCode -lt 500) {
                $ready = $true
                break
            }
        } catch {}
    }

    if (-not $ready) {
        Add-Content -Path $logFile -Value "ERROR: Dev server failed to start within 60 seconds"
        throw "Dev server failed to start"
    }

    Add-Content -Path $logFile -Value "Dev server is ready. Triggering collector..."

    $response = Invoke-RestMethod -Uri "http://localhost:$port/api/external/collect" -Method POST -Headers @{ "Authorization" = "Bearer $cronSecret" } -TimeoutSec 120

    $inserted = $response.inserted
    $skipped = $response.skipped
    $cleaned = $response.cleaned
    $total = $response.total_collected
    $errors = $response.errors | ConvertTo-Json -Compress

    Add-Content -Path $logFile -Value "SUCCESS: Inserted=$inserted, Skipped=$skipped, Cleaned=$cleaned, Total=$total"

    if ($response.errors -and $response.errors.Count -gt 0) {
        Add-Content -Path $logFile -Value "Errors: $errors"
    }

} catch {
    Add-Content -Path $logFile -Value "SCRIPT ERROR: $($_.Exception.Message)"
} finally {
    if ($serverProcess -and -not $serverProcess.HasExited) {
        Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
        Add-Content -Path $logFile -Value "Dev server stopped"
    }

    $remaining = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($remaining) {
        $remaining | ForEach-Object {
            Stop-Process -Id (Get-Process -Id $_.OwningProcess).Id -Force -ErrorAction SilentlyContinue
        }
    }

    $endTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path $logFile -Value "Collection finished at $endTime"
    Add-Content -Path $logFile -Value "=========================================="
}
