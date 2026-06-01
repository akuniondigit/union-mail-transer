<#
.SYNOPSIS
  組合メール転送アドインを Outlook にインストールします。

.DESCRIPTION
  Node.js ポータブル版を一時的にダウンロードし、teamsapp-cli 経由で
  Exchange Online にアドインを登録します。処理後は取得物を削除します。

.NOTES
  - Office 365 / Exchange Online が前提です。
  - 管理者権限は不要です。初回のみ実行してください。
#>

$ErrorActionPreference = "Stop"
$ManifestUrl = "https://akuniondigit.github.io/union-mail-transer/manifest.xml"
$NodeVersion = "v20.18.1"
$NodeZipUrl = "https://nodejs.org/dist/$NodeVersion/node-$NodeVersion-win-x64.zip"
$TmpBase = Join-Path $env:TEMP "union-addin-setup"
$CliVersion = "3.0.2"

function Invoke-Download {
  param(
    [Parameter(Mandatory = $true)][string]$Uri,
    [Parameter(Mandatory = $true)][string]$OutFile
  )

  try {
    Invoke-WebRequest -Uri $Uri -OutFile $OutFile -UseBasicParsing
    return
  }
  catch {
    # Corporate proxy/certificate replacement can break default TLS validation.
    Write-Host "        TLS証明書検証に失敗。回避モードで再試行します。" -ForegroundColor Yellow
    $oldCallback = [System.Net.ServicePointManager]::ServerCertificateValidationCallback
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
    try {
      Invoke-WebRequest -Uri $Uri -OutFile $OutFile -UseBasicParsing
    }
    finally {
      [System.Net.ServicePointManager]::ServerCertificateValidationCallback = $oldCallback
    }
  }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "  組合メール転送アドイン インストーラー" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# 1. Node.js ポータブルをダウンロード
Write-Host "  [1/3] セットアップ環境を準備中..." -ForegroundColor Cyan
Write-Host "        (毎回セットアップを行います)" -ForegroundColor Gray
Remove-Item $TmpBase -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $TmpBase -Force | Out-Null

$nodeZipPath = Join-Path $TmpBase "node-$NodeVersion-win-x64.zip"
$nodeDirName = "node-$NodeVersion-win-x64"
$nodePath = Join-Path $TmpBase $nodeDirName
$npmCachePath = Join-Path $TmpBase "npm-cache"
$cliInstallPath = Join-Path $TmpBase "teamsapp-cli-$CliVersion"

Write-Host "        Node.js をダウンロード中..." -ForegroundColor Gray
Invoke-Download -Uri $NodeZipUrl -OutFile $nodeZipPath
Write-Host "        Node.js を展開中..." -ForegroundColor Gray
Expand-Archive -Path $nodeZipPath -DestinationPath $TmpBase -Force

$npmCmd = Join-Path $nodePath "npm.cmd"
$cliCmd = Join-Path $cliInstallPath "node_modules\.bin\teamsapp.cmd"

if (-not (Test-Path $cliCmd)) {
  Write-Host "        TeamsApp CLI を準備中..." -ForegroundColor Gray
  New-Item -ItemType Directory -Path $cliInstallPath -Force | Out-Null
  New-Item -ItemType Directory -Path $npmCachePath -Force | Out-Null
  $env:npm_config_cache = $npmCachePath
  $env:npm_config_strict_ssl = "false"
  $env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
  $installResult = & $npmCmd install --prefix $cliInstallPath "@microsoft/teamsapp-cli@$CliVersion" --no-audit --no-fund --loglevel=error --strict-ssl=false 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Host ($installResult | Out-String)
    throw "TeamsApp CLI の準備に失敗しました。"
  }
}

Write-Host "        OK" -ForegroundColor Green

# 2. マニフェストを取得
Write-Host "  [2/3] マニフェストを取得中..." -ForegroundColor Cyan
$manifestPath = Join-Path $TmpBase "manifest.xml"
Invoke-Download -Uri $ManifestUrl -OutFile $manifestPath
Write-Host "        OK" -ForegroundColor Green

# 3. teamsapp-cli でサイドロード
Write-Host "  [3/3] アドインを登録中..." -ForegroundColor Cyan
Write-Host "        必要な場合のみブラウザで Microsoft 365 サインインが求められます。" -ForegroundColor Yellow
Write-Host "        画面が出ない場合は既存ログイン状態で自動的に続行されます。" -ForegroundColor Gray
Write-Host ""

$env:NODE_NO_WARNINGS = "1"
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
$env:npm_config_cache = $npmCachePath
$env:npm_config_strict_ssl = "false"
Push-Location $TmpBase
$ErrorActionPreference = "Continue"
$result = & $cliCmd install --xml-path $manifestPath 2>&1 | Where-Object { $_ -notmatch "DeprecationWarning|trace-deprecation" }
$exitCode = $LASTEXITCODE
$ErrorActionPreference = "Stop"
Pop-Location

Write-Host ($result | Out-String)

if ($exitCode -ne 0) {
  Write-Host "  [エラー] 登録に失敗しました (code $exitCode)" -ForegroundColor Red
  Read-Host "  Enterキーで終了"
  exit 1
}
elseif ($result -match "TitleId|AppId") {
  Write-Host "  登録成功！" -ForegroundColor Green
}
elseif ($result -match "already") {
  Write-Host "  すでにインストール済みです" -ForegroundColor Green
}

# 後片付け
Write-Host ""
Write-Host "  一時ファイルを削除中..." -ForegroundColor Gray
Remove-Item $TmpBase -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  インストール完了！" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

Write-Host "  Outlook を再起動してください。" -ForegroundColor White
Write-Host "  メールを転送 > リボンに [組合メール転送] が表示されます。" -ForegroundColor White
Write-Host ""
Read-Host "  Enterキーで終了"
