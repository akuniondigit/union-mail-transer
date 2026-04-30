#!/usr/bin/env node
"use strict";

const https = require("https");
const fs = require("fs");
const os = require("os");
const path = require("path");

const MANIFEST_URL =
  "https://akuniondigit.github.io/union-mail-transer/manifest.xml";

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
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
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "union-addin-"));
  const manifestPath = path.join(tmpDir, "manifest.xml");

  try {
    console.log("📥 マニフェストをダウンロード中...");
    await downloadFile(MANIFEST_URL, manifestPath);

    console.log("🔧 Outlookアドインをインストール中...");
    // Patch argv so teamsapp-cli receives the install sub-command
    process.argv = [
      process.argv[0],
      "teamsapp",
      "install",
      "--xml-path",
      manifestPath,
    ];

    // teamsapp-cli webpack bundle entry
    require("@microsoft/teamsapp-cli/lib");
  } catch (err) {
    console.error("❌ エラー:", err.message);
    process.exit(1);
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

main();
