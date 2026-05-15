<#
.SYNOPSIS
  組合メール転送アドインを Outlook にインストールします。

.DESCRIPTION
  Node.js ポータブル版を一時的にダウンロードし、teamsapp-cli 経由で
  Exchange Online にアドインを登録します。完了後すべて自動削除されます。

.NOTES
  - Office 365 / Exchange Online が前提です。
  - 管理者権限は不要です。初回のみ実行してください。
#>

$ErrorActionPreference = "Stop"
$ManifestUrl = "https://akuniondigit.github.io/union-mail-transer/manifest.xml"
$NodeVersion = "v20.18.1"
$NodeZipUrl = "https://nodejs.org/dist/$NodeVersion/node-$NodeVersion-win-x64.zip"
$TmpBase = Join-Path $env:TEMP "union-addin-setup"

Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "  組合メール転送アドイン インストーラー" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""

# 1. Node.js ポータブルをダウンロード
Write-Host "  [1/3] セットアップ環境を準備中..." -ForegroundColor Cyan
Write-Host "        (初回は数十秒かかります)" -ForegroundColor Gray
Remove-Item $TmpBase -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $TmpBase -Force | Out-Null

$nodeZipPath = Join-Path $TmpBase "node.zip"
$nodeDirName = "node-$NodeVersion-win-x64"
$nodePath = Join-Path $TmpBase $nodeDirName

if (-not (Test-Path (Join-Path $nodePath "node.exe"))) {
    Invoke-WebRequest -Uri $NodeZipUrl -OutFile $nodeZipPath -UseBasicParsing
    Expand-Archive -Path $nodeZipPath -DestinationPath $TmpBase
    Remove-Item $nodeZipPath -Force
}
Write-Host "        OK" -ForegroundColor Green

# 2. マニフェストを取得
Write-Host "  [2/3] マニフェストを取得中..." -ForegroundColor Cyan
$manifestPath = Join-Path $TmpBase "manifest.xml"
Invoke-WebRequest -Uri $ManifestUrl -OutFile $manifestPath -UseBasicParsing
Write-Host "        OK" -ForegroundColor Green

# 3. teamsapp-cli でサイドロード
Write-Host "  [3/3] アドインを登録中..." -ForegroundColor Cyan
Write-Host "        ブラウザが開いたら Microsoft 365 にサインインしてください。" -ForegroundColor Yellow
Write-Host ""

$npxCmd = Join-Path $nodePath "npx.cmd"
$env:NODE_NO_WARNINGS = "1"
Push-Location $TmpBase
$ErrorActionPreference = "Continue"
$result = & $npxCmd --yes "@microsoft/teamsapp-cli@3.0.2" install --xml-path $manifestPath 2>&1 | Where-Object { $_ -notmatch "DeprecationWarning|trace-deprecation" }
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
