<#
.SYNOPSIS
  組合メール転送アドインを Classic Outlook にインストールします。

.DESCRIPTION
  Exchange Web Services (EWS) 経由でマニフェストを Exchange メールボックスに登録します。
  登録後は Outlook を再起動すると「組合ツール」リボンボタンが表示されます。

.NOTES
  - Office 365 / Exchange Online が前提です。
  - 初回のみ実行してください（重複登録は自動でスキップされます）。
  - 管理者権限は不要です（自分のメールボックスへの登録）。
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ManifestUrl = "https://akuniondigit.github.io/union-mail-transer/manifest.xml"
$EwsUrl      = "https://outlook.office365.com/ews/exchange.asmx"

function Write-Step([string]$msg) { Write-Host "  $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg)   { Write-Host "  ✅ $msg" -ForegroundColor Green }
function Write-Err([string]$msg)  { Write-Host "  ❌ $msg" -ForegroundColor Red }

Write-Host ""
Write-Host "=== 組合メール転送アドイン インストーラー ===" -ForegroundColor Yellow
Write-Host ""

# 1. マニフェストをダウンロード
Write-Step "GitHub Pages からマニフェストを取得中..."
try {
    $manifestContent = (Invoke-WebRequest -Uri $ManifestUrl -UseBasicParsing).Content
} catch {
    Write-Err "マニフェストの取得に失敗しました: $_"
    Write-Host ""
    Write-Host "  ネットワーク接続やプロキシ設定を確認してください。" -ForegroundColor Yellow
    Read-Host "  Enterキーで終了"
    exit 1
}
$manifestBase64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($manifestContent))
Write-Ok "マニフェスト取得完了"

# 2. EWS で InstallApp を呼び出す
Write-Step "Exchange にアドインを登録中（Windows 認証）..."
$soapBody = @"
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types"
               xmlns:m="http://schemas.microsoft.com/exchange/services/2006/messages">
  <soap:Header>
    <t:RequestServerVersion Version="Exchange2013_SP1" />
  </soap:Header>
  <soap:Body>
    <m:InstallApp>
      <m:Manifest>$manifestBase64</m:Manifest>
    </m:InstallApp>
  </soap:Body>
</soap:Envelope>
"@

try {
    $response = Invoke-WebRequest -Uri $EwsUrl `
        -Method POST `
        -Body $soapBody `
        -ContentType "text/xml; charset=utf-8" `
        -UseDefaultCredentials `
        -UseBasicParsing
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Err "EWS 接続エラー (HTTP $statusCode): $_"
    Write-Host ""
    Write-Host "  ヒント: 社内ネットワーク or VPN に接続されているか確認してください。" -ForegroundColor Yellow
    Write-Host "  それでも失敗する場合は、ブラウザで https://outlook.office.com を開き" -ForegroundColor Yellow
    Write-Host "  設定 → アドインを取得 → カスタムアドイン → URLから追加 で" -ForegroundColor Yellow
    Write-Host "  $ManifestUrl を指定してください。" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "  Enterキーで終了"
    exit 1
}

$responseText = $response.Content

# 3. 結果を解析
if ($responseText -match "NoError") {
    Write-Ok "登録成功！"
} elseif ($responseText -match "AppAlreadyInstalled") {
    Write-Ok "すでにインストール済みです（スキップ）"
} elseif ($responseText -match "AppDCEnabledGeneralFailure|AppManifestParseFailure") {
    Write-Err "マニフェストが正しく解析できませんでした。"
    Write-Host "  詳細: $responseText"
    Read-Host "  Enterキーで終了"
    exit 1
} elseif ($responseText -match "RequestFailed|ErrorAccessDenied") {
    Write-Err "アクセス拒否: 管理者によってカスタムアドインが無効化されている可能性があります。"
    Write-Host "  詳細: $responseText"
    Read-Host "  Enterキーで終了"
    exit 1
} else {
    Write-Host "  レスポンス: $responseText" -ForegroundColor Yellow
    Write-Host "  上記に NoError が含まれていれば成功です。" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== 完了 ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "  次の手順:" -ForegroundColor White
Write-Host "  1. Outlook を完全に閉じて再起動"
Write-Host "  2. 新しいメール作成 or 転送 で編集画面を開く"
Write-Host "  3. リボンに「組合ツール」グループ → 「組合メール転送」ボタンを確認"
Write-Host ""
Read-Host "  Enterキーで終了"
