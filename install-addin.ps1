<#
.SYNOPSIS
  組合メール転送アドインを Outlook にインストールします。

.DESCRIPTION
  @microsoft/teamsapp-cli 経由でマニフェストを Exchange メールボックスに登録します。
  Microsoft 365 に Windows 認証またはブラウザでサインインするだけで完了します。

.NOTES
  - Node.js (v18 以上) が必要です: https://nodejs.org/
  - Office 365 / Exchange Online が前提です。
  - 管理者権限は不要です。初回のみ実行してください。
#>

$ErrorActionPreference = "Stop"
$ManifestUrl = "https://akuniondigit.github.io/union-mail-transer/manifest.xml"

Write-Host ""
Write-Host "=== 組合メール転送アドイン インストーラー ===" -ForegroundColor Yellow
Write-Host ""

# 1. Node.js 確認
Write-Host "  [1/3] Node.js を確認中..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version 2>&1
    Write-Host "        OK ($nodeVersion)" -ForegroundColor Green
} catch {
    Write-Host "  [エラー] Node.js が見つかりません。" -ForegroundColor Red
    Write-Host "           https://nodejs.org/ からインストールしてください。" -ForegroundColor Yellow
    Read-Host "  Enterキーで終了"
    exit 1
}

# 2. マニフェストを一時フォルダに保存
Write-Host "  [2/3] マニフェストを取得中..." -ForegroundColor Cyan
$tmpDir = Join-Path $env:TEMP "union-mail-transer-install"
New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null
$manifestPath = Join-Path $tmpDir "manifest.xml"
try {
    Invoke-WebRequest -Uri $ManifestUrl -OutFile $manifestPath -UseBasicParsing
    Write-Host "        OK" -ForegroundColor Green
} catch {
    Write-Host "  [エラー] マニフェストの取得に失敗: $_" -ForegroundColor Red
    Read-Host "  Enterキーで終了"
    exit 1
}

# 3. teamsapp-cli でサイドロード
Write-Host "  [3/3] アドインを登録中..." -ForegroundColor Cyan
Write-Host "        Windows 認証またはブラウザで Microsoft 365 にサインインします。" -ForegroundColor Yellow
Write-Host ""
try {
    Push-Location $tmpDir
    $result = npx --yes "@microsoft/teamsapp-cli" install --xml-path $manifestPath 2>&1
    Pop-Location
    Write-Host ($result | Out-String)

    if ($result -match "Successfully registered") {
        Write-Host "  登録成功！" -ForegroundColor Green
    } elseif ($result -match "already") {
        Write-Host "  すでにインストール済みです（スキップ）" -ForegroundColor Green
    }
} catch {
    Pop-Location -ErrorAction SilentlyContinue
    Write-Host "  [エラー] $_" -ForegroundColor Red
    Read-Host "  Enterキーで終了"
    exit 1
}

# 後片付け
Remove-Item -Path $tmpDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== 完了！ ===" -ForegroundColor Green
Write-Host ""
Write-Host "  次の手順:"
Write-Host "  1. Outlook を完全に閉じて再起動"
Write-Host "  2. 転送したいメールを開いて「転送」を押し、編集画面に入る"
Write-Host "  3. リボンに「組合ツール」->「組合メール転送」ボタンを確認"
Write-Host ""
Read-Host "  Enterキーで終了"
