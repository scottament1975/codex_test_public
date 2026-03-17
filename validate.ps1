$workspace = Split-Path -Parent $MyInvocation.MyCommand.Path
$teamsFile = Join-Path $workspace "data\teams.js"
$indexFile = Join-Path $workspace "index.html"
$appFile = Join-Path $workspace "app.js"

if (-not (Test-Path $teamsFile)) {
  throw "Missing team seed file."
}

if (-not (Test-Path $indexFile)) {
  throw "Missing index.html."
}

if (-not (Test-Path $appFile)) {
  throw "Missing app.js."
}

$teamIds = Select-String -Path $teamsFile -Pattern 'id: "' | Measure-Object | Select-Object -ExpandProperty Count
$playoffIds = Select-String -Path $teamsFile -Pattern 'id: "playoff-slot-' | Measure-Object | Select-Object -ExpandProperty Count
$qualifiedSlots = $teamIds - $playoffIds

if ($teamIds -ne 48) {
  throw "Expected 48 team slots, found $teamIds."
}

if ($qualifiedSlots -lt 42) {
  throw "Expected at least 42 confirmed team entries, found $qualifiedSlots."
}

Write-Output "Validation passed: 48 team slots detected, including $qualifiedSlots confirmed entries and $playoffIds play-off placeholders."