$ErrorActionPreference = "Stop"
$cacheBase = Join-Path $env:LOCALAPPDATA "UnionMailTranserInstallerCache"

Write-Host "[cleanup-cache] target: $cacheBase"

if (-not (Test-Path $cacheBase -PathType Container)) {
    Write-Host "[cleanup-cache] no cache found"
    exit 0
}

if ($cacheBase -notlike "*$([IO.Path]::DirectorySeparatorChar)UnionMailTranserInstallerCache") {
    throw "Unexpected path. Abort: $cacheBase"
}

Remove-Item $cacheBase -Recurse -Force -ErrorAction Stop
Write-Host "[cleanup-cache] removed"
