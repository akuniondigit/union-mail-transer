// Copies keytar.node next to the built exe so it can be loaded at runtime
const fs = require("fs");
const path = require("path");

const src = path.join(
  __dirname,
  "node_modules",
  "keytar",
  "build",
  "Release",
  "keytar.node"
);
const destDir = path.join(__dirname, "dist");
const dest = path.join(destDir, "keytar.node");

if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log("✅ Copied keytar.node →", dest);
} else {
  console.warn("⚠️  keytar.node not found at", src, "— skipping");
}
