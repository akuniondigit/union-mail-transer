#!/usr/bin/env node
"use strict";

const https = require("https");
const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline");

const MANIFEST_URL =
  "https://akuniondigit.github.io/union-mail-transer/manifest.xml";

// Log file is written next to the exe (or next to this script in dev)
const LOG_PATH = path.join(
  path.dirname(process.execPath || __filename),
  "install-addin.log"
);
const logStream = fs.createWriteStream(LOG_PATH, { flags: "w" });

function log(...args) {
  const line = `[${new Date().toISOString()}] ${args.join(" ")}`;
  console.log(...args);
  logStream.write(line + "\n");
}

function logErr(...args) {
  const line = `[${new Date().toISOString()}] ERROR: ${args.join(" ")}`;
  console.error(...args);
  logStream.write(line + "\n");
}

// Tee stdout/stderr of child modules into log too
const origWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = (chunk, enc, cb) => {
  logStream.write(chunk);
  return origWrite(chunk, enc, cb);
};
const origErrWrite = process.stderr.write.bind(process.stderr);
process.stderr.write = (chunk, enc, cb) => {
  logStream.write(chunk);
  return origErrWrite(chunk, enc, cb);
};

function pause() {
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
      .on("error", (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
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
  } catch (err) {
    logErr(err.stack || err.message);
    await pause();
    process.exit(1);
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    logStream.end();
  }
}

main();
