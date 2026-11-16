param([int]$BasePort = 3310, [int[]]$Fases = @(1, 2, 3, 4, 5, 6, 7, 8, 9, 10))
# Regresi newman Fase 1 sampai 10 berurutan, satu server baru per fase (port BasePort + fase).
# Fase 8 dan 10 di atas 85 request, jadi diberi jeda 700 ms supaya di bawah batas global 100 per menit.
# Jangan jalankan vitest bersamaan: resetDatabase mengosongkan jasana_test.
# Contoh: powershell -File scripts\dev\regresi.ps1 -BasePort 3310
$ErrorActionPreference = 'Continue'
$delays = @{ 8 = 700; 10 = 700 }
foreach ($fase in $Fases) {
  $delay = 0
  if ($delays.ContainsKey($fase)) { $delay = $delays[$fase] }
  Write-Output "===== Fase $fase (port $($BasePort + $fase), jeda $delay ms) ====="
  & (Join-Path $PSScriptRoot 'run-newman.ps1') -Fase $fase -Port ($BasePort + $fase) -Delay $delay
}
