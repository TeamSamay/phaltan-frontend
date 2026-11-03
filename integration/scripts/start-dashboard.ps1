param(
  [string]$EnvFile = ".env"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $EnvFile)) {
  Write-Host "[SUTRA] .env file not found. Copy .env.example and configure hosts/ports first." -ForegroundColor Yellow
  exit 1
}

Get-Content $EnvFile | ForEach-Object {
  if ($_ -match "^\s*#") { return }
  if ($_ -match "^\s*$") { return }
  $key, $value = $_ -split '=', 2
  if ($null -ne $key -and $null -ne $value) {
    [System.Environment]::SetEnvironmentVariable($key.Trim(), $value.Trim(), "Process")
  }
}

$dashboardDir = Join-Path $PSScriptRoot "..\dashboard"
Set-Location $dashboardDir
& "C:\Program Files\nodejs\npm.cmd" install
& "C:\Program Files\nodejs\npm.cmd" run dev -- --host 0.0.0.0
