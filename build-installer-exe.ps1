$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$inputPs1 = Join-Path $repoRoot "install-addin.ps1"
$outDir = Join-Path $repoRoot "dist-installer"
$outExe = Join-Path $outDir "union-mail-transer-installer.exe"

if (-not (Test-Path $inputPs1)) {
    throw "install-addin.ps1 not found: $inputPs1"
}

if (-not (Get-Module -ListAvailable -Name ps2exe)) {
    Write-Host "Installing ps2exe module for current user..." -ForegroundColor Yellow
    Install-Module -Name ps2exe -Scope CurrentUser -Force -AllowClobber
}

Import-Module ps2exe -ErrorAction Stop

New-Item -ItemType Directory -Path $outDir -Force | Out-Null

Write-Host "Building EXE..." -ForegroundColor Cyan
Invoke-ps2exe `
    -inputFile $inputPs1 `
    -outputFile $outExe `
    -title "Union Mail Transer Installer" `
    -description "Install Outlook add-in without preinstalling Node.js" `
    -company "Asahi Kasei" `
    -product "Union Mail Transer" `
    -version "1.0.0.0" `
    -noConsole:$false

Write-Host "Done: $outExe" -ForegroundColor Green
