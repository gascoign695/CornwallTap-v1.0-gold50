$game = Get-Content "js/game.js" -Raw
$index = Get-Content "index.html" -Raw
$version = Get-Content "functions/api/version.js" -Raw

$gameVersion = [regex]::Match(
    $game,
    'clientBuildVersion\s*=\s*["'']([^"'']+)["'']'
).Groups[1].Value

$indexVersion = [regex]::Match(
    $index,
    'js/game.js\?v=([^"''&]+)'
).Groups[1].Value

$apiVersion = [regex]::Match(
    $version,
    'build\s*:\s*["'']([^"'']+)["'']'
).Groups[1].Value

Write-Host ""
Write-Host "CornwallTap build version check"
Write-Host "--------------------------------"
Write-Host "game.js:        $gameVersion"
Write-Host "index.html:     $indexVersion"
Write-Host "api/version.js: $apiVersion"
Write-Host ""

if (
    [string]::IsNullOrWhiteSpace($gameVersion) -or
    [string]::IsNullOrWhiteSpace($indexVersion) -or
    [string]::IsNullOrWhiteSpace($apiVersion)
) {
    Write-Host "FAIL: One or more build versions could not be found." -ForegroundColor Red
    exit 1
}

if (
    $gameVersion -ne $indexVersion -or
    $gameVersion -ne $apiVersion
) {
    Write-Host "FAIL: Build versions do not match." -ForegroundColor Red
    exit 1
}

Write-Host "PASS: All build versions match." -ForegroundColor Green
exit 0