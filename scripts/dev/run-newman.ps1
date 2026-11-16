param([int]$Fase, [int]$Port, [int]$Delay = 0)
# Satu run newman untuk satu fase terhadap jasana_test (sesi 10c, dari runner 10b).
#   1. seed fase itu (kalau ada)
#   2. server satu proses di port uji: gateway fake, LLM fake, SMTP palsu 127.0.0.1:2525
#   3. tunggu baris "Jasana API berjalan", lalu newman
#   4. server dimatikan lewat PID di finally
# Pakai port selain 3000 (dipakai penyusun) dan port baru setiap run (batas login in-memory).
# Contoh: powershell -File scripts\dev\run-newman.ps1 -Fase 10 -Port 3301 -Delay 700
# Berkas ini sengaja ASCII saja: PowerShell 5.1 membaca .ps1 tanpa BOM sebagai ANSI.
$ErrorActionPreference = 'Continue'
$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $root
$env:DATABASE_URL = (node -e "require('dotenv').config({path:'.env'});process.stdout.write(process.env.TEST_DATABASE_URL||'')")
if (-not $env:DATABASE_URL) { Write-Output 'TEST_DATABASE_URL kosong'; exit 1 }
if (([Uri]$env:DATABASE_URL).AbsolutePath -ne '/jasana_test') { Write-Output 'Runner hanya untuk jasana_test'; exit 1 }
$env:PORT = "$Port"
$env:PAYMENT_GATEWAY = 'fake'
$env:LLM_GATEWAY = 'fake'
$env:SMTP_HOST = '127.0.0.1'
$env:SMTP_PORT = '2525'
$env:XENDIT_CALLBACK_TOKEN = 'token-uji-postman-bukan-asli'

$seeds = @{ 2 = 'postman:seed'; 3 = 'postman:seed:fase-3'; 4 = 'postman:seed:fase-4'; 5 = 'postman:seed:fase-5'; 6 = 'postman:seed:fase-6'; 7 = 'postman:seed:fase-7'; 8 = 'postman:seed:fase-8'; 9 = 'postman:seed:fase-9'; 10 = 'postman:seed:fase-10' }
if ($seeds.ContainsKey($Fase)) {
  $seedOut = npm run $seeds[$Fase] 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) { Write-Output "SEED GAGAL`n$seedOut"; exit 1 }
}

$logDir = Join-Path $env:TEMP 'jasana-dev'
New-Item -ItemType Directory -Force $logDir | Out-Null
$log = Join-Path $logDir "server-$Port.log"
$err = Join-Path $logDir "server-$Port.err.log"
$proc = Start-Process node -ArgumentList '--import', 'tsx', 'src/server.ts' -WorkingDirectory "$root\apps\api" -PassThru -RedirectStandardOutput $log -RedirectStandardError $err -WindowStyle Hidden
try {
  $ready = $false
  for ($i = 0; $i -lt 120; $i++) {
    Start-Sleep -Milliseconds 500
    if ((Test-Path $log) -and (Select-String -Path $log -Pattern 'Jasana API berjalan' -Quiet)) { $ready = $true; break }
    if ($proc.HasExited) { break }
  }
  if (-not $ready) { Write-Output 'SERVER TIDAK SIAP'; Get-Content $err -Tail 20; exit 1 }
  $nargs = @('newman', 'run', "postman\Jasana-Fase-$Fase.postman_collection.json", '-e', 'postman\Jasana-Lokal.postman_environment.json',
    '--env-var', 'seed_password=Postman-Jasana-123', '--env-var', "base_url=http://localhost:$Port/api/v1", '--working-dir', 'postman', '--color', 'off')
  if ($Delay -gt 0) { $nargs += @('--delay-request', "$Delay") }
  $out = npx @nargs 2>&1 | Out-String
  $lines = $out -split "`n"
  $summaryStart = ($lines | Select-String -Pattern 'executed' | Select-Object -First 1).LineNumber
  if ($summaryStart) { $lines[($summaryStart - 3)..($lines.Length - 1)] -join "`n" } else { $out }
} finally {
  Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
}
