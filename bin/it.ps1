$ErrorActionPreference = "Stop"

Set-Location -Path (Join-Path $PSScriptRoot "..")

docker compose -f docker-compose.test.yml up -d --wait
if ($LASTEXITCODE -ne 0) { throw "docker compose up failed" }

$env:CEREBRO_IT = "1"
sbt 'testOnly *IT'
$exit = $LASTEXITCODE

if ($exit -eq 0) {
  docker compose -f docker-compose.test.yml down
} else {
  Write-Host "Integration tests failed (exit $exit). Containers left running for inspection."
}

exit $exit
