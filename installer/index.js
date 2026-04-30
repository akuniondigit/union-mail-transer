#!/usr/bin/env node
"use strict";

const https = require("https");
const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline");

const MANIFEST_URL =
  "https://akuniondigit.github.io/union-mail-transer/manifest.xml";

const LOG_PATH = path.join(
  path.dirname(process.execPath || __filename),
  "install-addin.log"
);
const logStream = fs.createWriteStream(LOG_PATH, { flags: "w" });

function ts() { return new Date().toISOString(); }
function log(...args) {
  const line = `[${ts()}] ${args.join(" ")}`;
  console.log(...args);
  logStream.write(line + "\n");
}
function logErr(...args) {
  const line = `[${ts()}] ERROR: ${args.join(" ")}`;
  console.error(...args);
  logStream.write(line + "\n");
}

// Tee stdout/stderr so teamsapp-cli output is captured
const origOut = process.stdout.write.bind(process.stdout);
process.stdout.write = (chunk, enc, cb) => { logStream.write(chunk); return origOut(chunk, enc, cb); };
const origErr = process.stderr.write.bind(process.stderr);
process.stderr.write = (chunk, enc, cb) => { logStream.write(chunk); return origErr(chunk, enc, cb); };

// Capture process.exit() calls (teamsapp-cli exits this way)
const _exit = process.exit.bind(process);
process.exit = (code) => {
  fs.appendFileSync(LOG_PATH, `[${ts()}] process.exit(${code ?? 0})\n`);
  if (code === 0 || code == null) {
    fs.appendFileSync(LOG_PATH, `[${ts()}] ✅ インストール完了\n`);
  } else {
    fs.appendFileSync(LOG_PATH, `[${ts()}] ❌ 失敗 (code=${code})\n`);
  }
  _exit(code);
};

// Catch anything teamsapp-cli throws outside our try/catch
process.on("uncaughtException", (err) => {
  fs.appendFileSync(LOG_PATH, `[${ts()}] uncaughtException: ${err.stack || err.message}\n`);
  console.error("❌ 予期しないエラー:", err.message);
  waitKey().then(() => _exit(1));
});
process.on("unhandledRejection", (reason) => {
  fs.appendFileSync(LOG_PATH, `[${ts()}] unhandledRejection: ${reason}\n`);
});

function waitKey() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question("\n何かキーを押すと終了します...", () => { rl.close(); resolve(); });
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    log(`📥 GET ${url}`);
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        log(`   HTTP ${res.statusCode}`);
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} downloading manifest`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", (err) => { fs.unlink(dest, () => {}); reject(err); });
  });
}

async function main() {
  log("=== 組合メール転送アドイン インストーラー ===");
  log(`Node: ${process.version}  Platform: ${process.platform}`);
  log(`exe: ${process.execPath}`);
  log(`log: ${LOG_PATH}`);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "union-addin-"));
  const manifestPath = path.join(tmpDir, "manifest.xml");
  log(`tmpDir: ${tmpDir}`);

  try {
    log("📥 マニフェストをダウンロード中...");
    await downloadFile(MANIFEST_URL, manifestPath);
    log("✅ ダウンロード完了");

    log("🔧 Outlookアドインをインストール中...");
    process.argv = [
      process.argv[0],
      "teamsapp",
      "install",
      "--xml-path",
      manifestPath,
    ];
    log(`argv: ${process.argv.join(" ")}`);

    require("@microsoft/teamsapp-cli/lib");
    // teamsapp-cli calls process.exit() internally — code after here may not run
  } catch (err) {
    logErr(err.stack || err.message);
    await waitKey();
    _exit(1);
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

main();
