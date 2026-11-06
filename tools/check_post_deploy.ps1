$site = "https://cornwalltap.co.uk"

Write-Host ""
Write-Host "CornwallTap post-deploy health check"
Write-Host "------------------------------------"

try {
    $version = Invoke-RestMethod "$site/api/version"
} catch {
    Write-Host "FAIL: Could not reach /api/version" -ForegroundColor Red
    exit 1
}

try {
    $daily = Invoke-RestMethod "$site/api/daily"
} catch {
    Write-Host "FAIL: Could not reach /api/daily" -ForegroundColor Red
    exit 1
}

Write-Host "Live build: $($version.build)"

$locationCount = @($daily.location_ids).Count

Write-Host "Daily locations returned: $locationCount"

if ([string]::IsNullOrWhiteSpace($version.build)) {
    Write-Host "FAIL: Live build version was not returned." -ForegroundColor Red
    exit 1
}

if ($locationCount -ne 5) {
    Write-Host "FAIL: Daily endpoint did not return exactly 5 locations." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "PASS: Production health check passed." -ForegroundColor Green
exit 0