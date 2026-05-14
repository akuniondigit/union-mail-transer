#!/usr/bin/env node
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

const ADDIN_ID = "59b57c92-0f93-46a1-aa9d-342b0c9b6fd4";
const MANIFEST_DIR = path.join(os.homedir(), "AppData", "Roaming", "UnionMailAddin");
const MANIFEST_PATH = path.join(MANIFEST_DIR, "manifest.xml");
const BUNDLED_MANIFEST = path.join(__dirname, "manifest.xml");
const REG_KEY = `HKCU\\Software\\Microsoft\\Office\\16.0\\WEF\\Developer\\${ADDIN_ID}`;

const LOG_PATH = path.join(
  path.dirname(process.execPath || __filename),
  "install-addin.log"
);
const logStream = fs.createWriteStream(LOG_PATH, { flags: "w" });

function ts() { return new Date().toISOString(); }
function log(msg) {
  console.log(msg);
  logStream.write(`[${ts()}] ${msg}\n`);
}

process.on("exit", () => {
  try { logStream.end(); } catch { }
});

function reg(args) {
  execSync(`reg ${args}`, { stdio: "pipe" });
}

async function main() {
  log("=== 組合メール転送アドイン インストーラー ===");
  log(`保存先: ${MANIFEST_PATH}`);
  log(`ログ:   ${LOG_PATH}`);

  try {
    // 1. マニフェスト保存先を作成
    fs.mkdirSync(MANIFEST_DIR, { recursive: true });

    // 2. 同梱の manifest.xml を配置
    log("マニフェストを配置中...");
    fs.copyFileSync(BUNDLED_MANIFEST, MANIFEST_PATH);
    log("マニフェスト配置完了");

    // 3. レジストリに書き込み（Exchange を経由しないローカルインストール）
    log("レジストリを設定中...");
    reg(`add "${REG_KEY}" /f /v Manifest /t REG_SZ /d "${MANIFEST_PATH}"`);
    reg(`add "${REG_KEY}" /f /v UseDirectDebugger /t REG_DWORD /d 0`);
    reg(`add "${REG_KEY}" /f /v UseWebDebugger /t REG_DWORD /d 0`);
    reg(`add "${REG_KEY}" /f /v UseLiveReload /t REG_DWORD /d 0`);
    log("レジストリ設定完了");

    log("");
    log("✅ インストール完了！");
    log("   Outlook を再起動するとアドインが使えます。");
    log("");
  } catch (err) {
    log(`❌ エラー: ${err.message}`);
    console.error(err.stack);
    process.exitCode = 1;
  }

  // ウィンドウを閉じないよう待機
  await new Promise((resolve) => {
    process.stdout.write("何かキーを押すと終了します...");
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once("data", resolve);
  });
}

main();
